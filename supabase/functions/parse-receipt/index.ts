import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CategoryInfo {
  id: string;
  name: string;
  color: string;
}

interface ItemMapping {
  item_pattern: string;
  category_id: string;
}

interface ParsedItem {
  rawText: string;
  price: number;
  quantity: number;
  unitPrice: number | null;
  categoryId: string | null;
  needsReview: boolean;
  confidence: number; // NEW: 0-1, surfaced to UI
}

interface ParsedReceipt {
  storeName: string | null;
  totalAmount: number;
  date: string | null;
  items: ParsedItem[];
  rawText: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const { imageBase64, mimeType, householdId } = await req.json();

    if (!imageBase64) {
      throw new Error("No image provided");
    }

    // Validate mime type — Anthropic supports jpeg, png, gif, webp
    const validMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    const resolvedMimeType = validMimeTypes.includes(mimeType) ? mimeType : "image/jpeg";

    // Initialize Supabase client to fetch household data
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch household categories and learned mappings
    let categories: CategoryInfo[] = [];
    let mappings: ItemMapping[] = [];

    if (householdId) {
      const { data: catData } = await supabase
        .from("categories")
        .select("id, name, color")
        .or(`is_default.eq.true,household_id.eq.${householdId}`);

      if (catData) categories = catData;

      const { data: mapData } = await supabase
        .from("item_category_mappings")
        .select("item_pattern, category_id")
        .eq("household_id", householdId)
        .order("frequency", { ascending: false });

      if (mapData) mappings = mapData;
    }

    const categoryList = categories
      .map((c) => `- "${c.name}" (ID: ${c.id})`)
      .join("\n");

    const learnedMappingsInfo =
      mappings.length > 0
        ? `\nLearned mappings from this household's history (prioritize these):\n${mappings
            .slice(0, 50)
            .map((m) => `- "${m.item_pattern}" → category ID ${m.category_id}`)
            .join("\n")}`
        : "";

    // --- Anthropic API call ---
    // Uses the messages API with native vision support.
    // Image is sent as base64 in the content array — no image_url wrapper.
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        messages: [
          {
            role: "user",
            content: [
              {
                // Image block must come before the text prompt
                type: "image",
                source: {
                  type: "base64",
                  media_type: resolvedMimeType,
                  data: imageBase64,
                },
              },
              {
                type: "text",
                text: `You are a receipt OCR expert. Analyze this grocery receipt image and extract structured data.

AVAILABLE CATEGORIES:
${categoryList || "No categories defined — leave categoryId as null"}
${learnedMappingsInfo}

Return ONLY valid JSON with this exact shape — no markdown, no explanation:
{
  "storeName": "Store name if visible, or null",
  "totalAmount": 0.00,
  "date": "YYYY-MM-DD if visible, or null",
  "items": [
    {
      "rawText": "Item description exactly as shown",
      "price": 0.00,
      "quantity": 1,
      "unitPrice": null,
      "categoryId": "UUID of best matching category, or null",
      "confidence": 0.95
    }
  ]
}

QUANTITY AND PRICE RULES:
1. "2x Vare" or "Vare x2" → quantity=2, price=line total
2. "2 @ 5.00 = 10.00" → quantity=2, unitPrice=5.00, price=10.00
3. Single price shown → quantity=1, unitPrice=null, price=that amount
4. price is ALWAYS the line total (quantity × unitPrice)

CATEGORIZATION RULES:
1. Match each item to the best category from the list above
2. Prioritize learned mappings when item text is similar
3. confidence: your certainty that the category is correct (0.0–1.0)
4. Set categoryId=null if no category fits
5. Similar items must get the same category — be consistent

EXTRACTION RULES:
1. totalAmount must be a number — look for TOTAL, SUM, Å BETALE, TOTALT
2. Each item price must be a number
3. Extract every line item you can identify with a price
4. Return ONLY valid JSON`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Anthropic API error:", errorText);
      throw new Error(`Anthropic API request failed: ${response.status}`);
    }

    const aiResponse = await response.json();

    // Anthropic returns content as an array of blocks; we want the first text block
    const content = aiResponse.content?.find(
      (block: { type: string }) => block.type === "text"
    )?.text;

    if (!content) {
      throw new Error("No text content in Anthropic response");
    }

    // Parse and validate the JSON response
    let parsed: ParsedReceipt;
    try {
      const cleanContent = content
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      const jsonData = JSON.parse(cleanContent);

      const validCategoryIds = new Set(categories.map((c) => c.id));

      parsed = {
        storeName: jsonData.storeName || null,
        totalAmount: parseFloat(jsonData.totalAmount) || 0,
        date: jsonData.date || null,
        items: (jsonData.items || []).map((item: any) => {
          const categoryId =
            item.categoryId && validCategoryIds.has(item.categoryId)
              ? item.categoryId
              : null;

          const quantity = parseInt(item.quantity) || 1;
          const price = parseFloat(item.price) || 0;
          const unitPrice = item.unitPrice
            ? parseFloat(item.unitPrice)
            : quantity > 1
            ? price / quantity
            : null;

          // confidence comes from the model; clamp to [0, 1]
          const confidence = Math.min(
            1,
            Math.max(0, parseFloat(item.confidence) || 0)
          );

          // needsReview: uncertain category OR confidence below threshold
          const needsReview =
            confidence < 0.7 ||
            (!categoryId && item.categoryId != null);

          return {
            rawText: String(item.rawText || "Unknown item"),
            price,
            quantity,
            unitPrice,
            categoryId,
            needsReview,
            confidence,
          };
        }),
        rawText: content,
      };
    } catch (parseError) {
      console.error("Failed to parse Anthropic response:", content);
      // Graceful fallback — return what we can extract
      const totalMatch = content.match(/total[":.\s]*(\d+\.?\d*)/i);
      parsed = {
        storeName: null,
        totalAmount: totalMatch ? parseFloat(totalMatch[1]) : 0,
        date: null,
        items: [],
        rawText: content,
      };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error parsing receipt:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
