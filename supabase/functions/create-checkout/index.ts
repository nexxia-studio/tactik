import Stripe from "https://esm.sh/stripe@14";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SITE_URL = Deno.env.get("SITE_URL") ?? "http://localhost:8081";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  // ── Entry log (must appear if handler is reached) ──────────────────────────
  console.log("[create-checkout] handler reached, method:", req.method);
  console.log("[create-checkout] STRIPE_SECRET_KEY set:", !!STRIPE_SECRET_KEY);
  console.log("[create-checkout] SUPABASE_URL set:", !!SUPABASE_URL);
  console.log("[create-checkout] SITE_URL:", SITE_URL);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  // ── Env check ──────────────────────────────────────────────────────────────
  if (!STRIPE_SECRET_KEY) {
    console.error("[create-checkout] STRIPE_SECRET_KEY is not set");
    return json({ error: "Stripe not configured (missing STRIPE_SECRET_KEY)" }, 500);
  }
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("[create-checkout] Supabase env vars missing");
    return json({ error: "Supabase not configured" }, 500);
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // ── 1. Auth ────────────────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing authorization" }, 401);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      console.error("[create-checkout] Auth error:", authError?.message);
      return json({ error: "Invalid token" }, 401);
    }
    console.log("[create-checkout] User authenticated:", user.id);

    // ── 2. Body ────────────────────────────────────────────────────────────
    const body = await req.json().catch(() => ({}));
    const { priceId } = body;
    if (!priceId || typeof priceId !== "string") {
      return json({ error: "Missing or invalid priceId" }, 400);
    }
    console.log("[create-checkout] priceId:", priceId);

    // ── 3. Organization lookup (non-blocking) ──────────────────────────────
    let organizationId: string | null = null;
    try {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from("user_profiles")
        .select("organization_id")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.warn("[create-checkout] user_profiles lookup error:", profileError.message);
      } else {
        organizationId = profile?.organization_id ?? null;
      }
    } catch (e) {
      console.warn("[create-checkout] user_profiles lookup threw:", e);
    }

    // Fallback: find org via organizations.created_by
    if (!organizationId) {
      try {
        const { data: org, error: orgError } = await supabaseAdmin
          .from("organizations")
          .select("id")
          .eq("created_by", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!orgError && org) {
          organizationId = org.id;
          console.log("[create-checkout] org found via created_by fallback:", organizationId);
        }
      } catch (e) {
        console.warn("[create-checkout] org fallback lookup threw:", e);
      }
    }

    console.log("[create-checkout] organizationId:", organizationId ?? "not found (checkout will proceed without)");

    // ── 4. Stripe Checkout Session ─────────────────────────────────────────
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${SITE_URL}/dashboard`,
      cancel_url: `${SITE_URL}/onboarding/plan`,
      client_reference_id: user.id,
      ...(user.email ? { customer_email: user.email } : {}),
      ...(organizationId ? { metadata: { organization_id: organizationId } } : {}),
    };

    console.log("[create-checkout] Creating Stripe session...");
    const session = await stripe.checkout.sessions.create(sessionParams);
    console.log("[create-checkout] Session created:", session.id);

    return json({ url: session.url });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[create-checkout] Unhandled error:", message);
    return json({ error: message }, 500);
  }
});
