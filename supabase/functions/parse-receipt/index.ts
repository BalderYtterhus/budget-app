import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Ordered longest-first so "coop extra" matches before "coop"
const STORE_CHAINS = [
  "rema 1000", "coop extra", "coop prix", "coop mega", "coop marked",
  "obs bygg", "eurospar", "bunnpris", "nærbutikken", "mathallen",
  "kiwi", "meny", "spar", "joker", "extra", "obs", "oda", "prix",
];

function extractStoreChain(storeName: string | null): string | null {
  if (!storeName) return null;
  const lower = storeName.toLowerCase().trim();
  for (const chain of STORE_CHAINS) {
    if (lower === chain || lower.startsWith(chain + " ")) return chain;
  }
  // Fallback: first word, stripped of non-alphanumeric
  return lower.split(/\s+/)[0].replace(/[^\w]/g, "") || null;
}

function normalizeItemName(raw: string): string {
  return raw
    .toLowerCase()
    // Remove quantity prefixes like "2x", "3 pk"
    .replace(/^\d+\s*[xX×]\s*/, "")
    // Remove weights/measures
    .replace(/\b\d+([.,]\d+)?\s*(g|kg|ml|l|cl|dl|pk|stk|liter)\b/gi, "")
    // Remove store codes / price info
    .replace(/\b[A-Z]{2,}\d+\b/g, "")
    // Strip punctuation
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const { imageBase64, mimeType, householdId } = await req.json();
    if (!imageBase64) throw new Error("No image provided");

    const validMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    const resolvedMimeType = validMimeTypes.includes(mimeType) ? mimeType : "image/jpeg";

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let categories: { id: string; name: string }[] = [];
    let mappings: { item_pattern: string; category_id: string }[] = [];

    if (householdId) {
      const { data: catData } = await supabase
        .from("categories")
        .select("id, name")
        .or(`is_default.eq.true,household_id.eq.${householdId}`);
      if (catData) categories = catData;

      const { data: mapData } = await supabase
        .from("item_category_mappings")
        .select("item_pattern, category_id")
        .eq("household_id", householdId)
        .order("frequency", { ascending: false });
      if (mapData) mappings = mapData;
    }

    const categoryList = categories.map((c) => `- "${c.name}" (ID: ${c.id})`).join("\n");
    const learnedMappingsInfo = mappings.length > 0
      ? `\nLearned mappings (prioritize these):\n${mappings.slice(0, 50).map((m) => `- "${m.item_pattern}" → ${m.category_id}`).join("\n")}`
      : "";

    const prompt = `Du er en ekspert på å lese norske dagligvarekvitteringer. Analyser kvitteringsbildet og ekstraher strukturerte data.

TILGJENGELIGE KATEGORIER:
${categoryList || "Ingen kategorier — sett categoryId til null"}
${learnedMappingsInfo}

Returner KUN gyldig JSON uten markdown-blokker:
{
  "storeName": "Butikknavn eller null",
  "totalAmount": 0.00,
  "date": "ÅÅÅÅ-MM-DD eller null",
  "items": [
    {
      "rawText": "Varetekst nøyaktig slik den står på kvitteringen",
      "normalizedName": "normalisert produktnavn",
      "price": 0.00,
      "quantity": 1,
      "unitPrice": null,
      "categoryId": "UUID eller null",
      "confidence": 0.95
    }
  ]
}

REGLER:
- totalAmount: finn TOTAL, SUM, Å BETALE, TOTALT — bruk nøyaktig beløp fra kvitteringen
- rawText: vareteksten nøyaktig slik den vises, inkludert forkortelser
- normalizedName: generisk, liten bokstav, ingen mengder/vekter (g/kg/ml/l/pk/stk), ingen butikkspesifikke koder. Eksempler: "Tine Helmelk 1L" → "helmelk", "Kjøttdeig 400g" → "kjøttdeig", "2pk Egg L" → "egg", "Prior Kyllingfilet 600g" → "kyllingfilet"
- price: linjens totalpris (quantity × unitPrice)
- quantity: antall enheter, standard 1
- unitPrice: pris per enhet, eller null hvis quantity er 1
- categoryId: bruk lærte mappinger og kategorilisten — velg best match
- confidence: 0.0–1.0, hvor sikker du er på kategorien
- Returner KUN gyldig JSON`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 4000,
        messages: [{
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: resolvedMimeType,
                data: imageBase64,
              },
            },
            { type: "text", text: prompt },
          ],
        }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Anthropic API error:", errorText);
      throw new Error(`Anthropic API request failed: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.content?.find((b: { type: string }) => b.type === "text")?.text;
    if (!content) throw new Error("No content in Anthropic response");

    let parsed;
    try {
      const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const jsonData = JSON.parse(cleanContent);
      const validCategoryIds = new Set(categories.map((c) => c.id));

      const parsedStoreName = jsonData.storeName || null;
      parsed = {
        storeName: parsedStoreName,
        storeChain: extractStoreChain(parsedStoreName),
        totalAmount: parseFloat(jsonData.totalAmount) || 0,
        date: jsonData.date || null,
        items: (jsonData.items || []).map((item: any) => {
          const categoryId = item.categoryId && validCategoryIds.has(item.categoryId)
            ? item.categoryId : null;
          const quantity = parseInt(item.quantity) || 1;
          const price = parseFloat(item.price) || 0;
          let unitPrice: number | null = item.unitPrice ? parseFloat(item.unitPrice) : null;

          // Validate unit price: if quantity > 1 and unitPrice is provided, check consistency
          if (quantity > 1) {
            if (unitPrice !== null) {
              const expected = price / quantity;
              // Accept if within 5% tolerance; otherwise recalculate
              if (Math.abs(unitPrice * quantity - price) > 0.05 * price + 0.01) {
                unitPrice = expected;
              }
            } else {
              unitPrice = price / quantity;
            }
          } else {
            // quantity === 1: unitPrice should equal price or be null
            unitPrice = null;
          }

          const confidence = Math.min(1, Math.max(0, parseFloat(item.confidence) || 0));

          // Sanitize normalizedName from AI, then apply our own cleanup as fallback
          const rawNormalized = String(item.normalizedName || item.rawText || "ukjent vare");
          const normalizedName = normalizeItemName(rawNormalized) || normalizeItemName(String(item.rawText || "ukjent vare"));

          return {
            rawText: String(item.rawText || "Ukjent vare"),
            normalizedName,
            price,
            quantity,
            unitPrice,
            categoryId,
            needsReview: confidence < 0.7 || (!categoryId && item.categoryId != null),
            confidence,
          };
        }),
        rawText: content,
      };
    } catch {
      parsed = { storeName: null, storeChain: null, totalAmount: 0, date: null, items: [], rawText: content };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error parsing receipt:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
