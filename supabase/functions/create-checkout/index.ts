import Stripe from "https://esm.sh/stripe@14";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
});

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

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
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    // ── 1. Authenticate ────────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing authorization" }, 401);

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) return json({ error: "Invalid token" }, 401);

    // ── 2. Parse body ──────────────────────────────────────────────────────
    const { priceId } = await req.json();
    if (!priceId) return json({ error: "Missing priceId" }, 400);

    // ── 3. Resolve organization_id ─────────────────────────────────────────
    // user_profiles.organization_id is set by OnboardingClub (step 1)
    const { data: profile } = await supabaseAdmin
      .from("user_profiles")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();

    const organizationId: string | null = profile?.organization_id ?? null;

    // ── 4. Build Checkout Session params ───────────────────────────────────
    const siteUrl = Deno.env.get("SITE_URL") ?? "http://localhost:8081";

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/dashboard`,
      cancel_url: `${siteUrl}/onboarding/plan`,
      // Used by stripe-webhook to link subscription → user_profile
      client_reference_id: user.id,
      // Pre-fill email for better UX
      ...(user.email ? { customer_email: user.email } : {}),
      // Used by stripe-webhook to upsert subscription on the right org
      ...(organizationId
        ? { metadata: { organization_id: organizationId } }
        : {}),
    };

    // ── 5. Create session & return URL ─────────────────────────────────────
    const session = await stripe.checkout.sessions.create(sessionParams);

    return json({ url: session.url });
  } catch (err) {
    console.error("create-checkout error:", err);
    return json(
      { error: err instanceof Error ? err.message : "Internal error" },
      500
    );
  }
});
