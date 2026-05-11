import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
      ? `\nLearned mappings:\n${mappings.slice(0, 50).map((m) => `- "${m.item_pattern}" → ${m.category_id}`).join("\n")}`
      : "";

    const prompt = `You are a receipt OCR expert. Analyze this grocery receipt and extract structured data.

AVAILABLE CATEGORIES:
${categoryList || "No categories — leave categoryId as null"}
${learnedMappingsInfo}

Return ONLY valid JSON, no markdown:
{
  "storeName": "Store name or null",
  "totalAmount": 0.00,
  "date": "YYYY-MM-DD or null",
  "items": [
    {
      "rawText": "Item description exactly as shown",
      "price": 0.00,
      "quantity": 1,
      "unitPrice": null,
      "categoryId": "UUID or null",
      "confidence": 0.95
    }
  ]
}

RULES:
- totalAmount: look for TOTAL, SUM, Å BETALE, TOTALT — must be exact number from receipt
- Each item price is the line total
- If text is unclear, use null rather than guessing
- confidence: 0.0-1.0, how certain you are about the category
- Return ONLY valid JSON`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
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
    console.log("Anthropic response:", JSON.stringify(aiResponse));

    let parsed;
    try {
      const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const jsonData = JSON.parse(cleanContent);
      const validCategoryIds = new Set(categories.map((c) => c.id));

      parsed = {
        storeName: jsonData.storeName || null,
        totalAmount: parseFloat(jsonData.totalAmount) || 0,
        date: jsonData.date || null,
        items: (jsonData.items || []).map((item: any) => {
          const categoryId = item.categoryId && validCategoryIds.has(item.categoryId)
            ? item.categoryId : null;
          const quantity = parseInt(item.quantity) || 1;
          const price = parseFloat(item.price) || 0;
          const unitPrice = item.unitPrice ? parseFloat(item.unitPrice) : quantity > 1 ? price / quantity : null;
          const confidence = Math.min(1, Math.max(0, parseFloat(item.confidence) || 0));

          return {
            rawText: String(item.rawText || "Ukjent vare"),
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
      parsed = { storeName: null, totalAmount: 0, date: null, items: [], rawText: content };
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
