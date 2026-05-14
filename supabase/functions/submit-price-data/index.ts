import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Service-role client — bypasses RLS, used for consent check + insert
    const admin = createClient(supabaseUrl, serviceKey);

    // Resolve the calling user from their JWT
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Server-side consent check — cannot be spoofed by the client
    const { data: profile } = await admin
      .from("profiles")
      .select("price_sharing_enabled")
      .eq("user_id", user.id)
      .single();

    if (!profile?.price_sharing_enabled) {
      return new Response(JSON.stringify({ inserted: 0, reason: "consent_not_given" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { rows } = await req.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      return new Response(JSON.stringify({ inserted: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limiting: max 100 rows per request (no real receipt exceeds this)
    if (rows.length > 100) {
      return new Response(JSON.stringify({ error: "Too many rows per request (max 100)" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Per-user hourly rate limit: count rows submitted in the last hour using submitted_by_user_hash
    // We store a one-way SHA-256 hash of the user ID so we can rate-limit without linking to identity
    const userIdBytes = new TextEncoder().encode(user.id + Deno.env.get("SUPABASE_URL"));
    const hashBuffer = await crypto.subtle.digest("SHA-256", userIdBytes);
    const userHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 16);

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await admin
      .from("public_price_data")
      .select("*", { count: "exact", head: true })
      .eq("submitted_by_user_hash", userHash)
      .gte("submitted_at", oneHourAgo);

    const hourlyCount = count ?? 0;
    if (hourlyCount + rows.length > 500) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded (500 rows/hour)" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sanitize: only accept known fields, strip anything else, enforce types
    const sanitized = (rows as any[])
      .map(r => ({
        store_chain:     String(r.store_chain     ?? "").slice(0, 100),
        normalized_name: String(r.normalized_name ?? "").slice(0, 200),
        category_name:   r.category_name ? String(r.category_name).slice(0, 100) : null,
        price:           Math.max(0, Number(r.price)    || 0),
        unit_price:      r.unit_price != null ? Number(r.unit_price) : null,
        quantity:        Math.max(1, parseInt(r.quantity) || 1),
        receipt_date:    String(r.receipt_date ?? ""),
        confidence:      r.confidence != null
                           ? Math.min(1, Math.max(0, Number(r.confidence)))
                           : null,
        country_code:    "NO",
        submitted_by_user_hash: userHash,
      }))
      .filter(r =>
        r.store_chain &&
        r.normalized_name &&
        r.price > 0 &&
        /^\d{4}-\d{2}-\d{2}$/.test(r.receipt_date)
      );

    if (sanitized.length === 0) {
      return new Response(JSON.stringify({ inserted: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error } = await admin.from("public_price_data").insert(sanitized);
    if (error) throw error;

    return new Response(JSON.stringify({ inserted: sanitized.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("submit-price-data error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
