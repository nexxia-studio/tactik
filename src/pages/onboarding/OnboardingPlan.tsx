import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PLANS, formatPrice, type StripePlan } from "@/config/stripe-plans";

export default function OnboardingPlan() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCheckout = async (plan: StripePlan) => {
    setSelectedPlan(plan.id);
    setLoading(true);

    try {
      const priceId =
        billing === "monthly" ? plan.price_monthly.id : plan.price_yearly.id;

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  const soloPlans = PLANS.filter((p) => p.category === "solo");
  const clubPlans = PLANS.filter((p) => p.category === "club");

  return (
    <div className="min-h-screen bg-bg-base px-4 py-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Progress */}
        <div className="flex items-center gap-2 max-w-md mx-auto">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`h-1 flex-1 rounded-full transition-all ${
                step <= 2 ? "bg-primary" : "bg-bg-surface-3"
              }`}
            />
          ))}
        </div>

        <div className="text-center space-y-2">
          <p className="text-label">ÉTAPE 2 / 3</p>
          <h1
            className="font-display text-t-primary leading-none"
            style={{ fontSize: "var(--text-h2)" }}
          >
            TON PLAN
          </h1>
          <p className="font-ui text-[13px] text-t-secondary">
            Choisis la formule qui correspond à ton club.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setBilling("monthly")}
            className={`font-ui text-[13px] px-4 py-2 rounded-lg transition-all cursor-pointer ${
              billing === "monthly"
                ? "bg-primary text-primary-text"
                : "bg-bg-surface-2 text-t-secondary hover:text-t-primary"
            }`}
          >
            Mensuel
          </button>
          <button
            onClick={() => setBilling("yearly")}
            className={`font-ui text-[13px] px-4 py-2 rounded-lg transition-all cursor-pointer ${
              billing === "yearly"
                ? "bg-primary text-primary-text"
                : "bg-bg-surface-2 text-t-secondary hover:text-t-primary"
            }`}
          >
            Annuel
            <span className="ml-1.5 text-[10px] opacity-80">−17%</span>
          </button>
        </div>

        {/* Solo plans */}
        <div>
          <p className="text-label mb-3 px-1">COACH SOLO</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {soloPlans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                billing={billing}
                loading={loading && selectedPlan === plan.id}
                onSelect={() => handleCheckout(plan)}
              />
            ))}
          </div>
        </div>

        {/* Club plans */}
        <div>
          <p className="text-label mb-3 px-1">CLUB</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {clubPlans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                billing={billing}
                loading={loading && selectedPlan === plan.id}
                onSelect={() => handleCheckout(plan)}
              />
            ))}
          </div>
        </div>

        {/* Skip (for testing) */}
        <div className="text-center pb-8">
          <button
            onClick={() => navigate("/onboarding/equipe")}
            className="font-ui text-[12px] text-t-muted hover:text-t-secondary transition-colors cursor-pointer underline"
          >
            Passer pour le moment
          </button>
        </div>
      </div>
    </div>
  );
}

function PlanCard({
  plan,
  billing,
  loading,
  onSelect,
}: {
  plan: StripePlan;
  billing: "monthly" | "yearly";
  loading: boolean;
  onSelect: () => void;
}) {
  const price =
    billing === "monthly" ? plan.price_monthly.amount : plan.price_yearly.amount;
  const period = billing === "monthly" ? "/mois" : "/an";

  return (
    <div
      className={`relative bg-bg-surface-1 border rounded-xl p-5 flex flex-col gap-4 transition-all ${
        plan.popular
          ? "border-primary-border glow-primary"
          : "border-b-subtle hover:border-b-default"
      }`}
    >
      {plan.popular && (
        <span className="absolute -top-2.5 right-4 bg-primary text-primary-text font-ui text-[10px] tracking-wider uppercase px-2.5 py-0.5 rounded-full">
          Populaire
        </span>
      )}

      <div>
        <h3 className="font-display text-[16px] text-t-primary tracking-wider">
          {plan.name}
        </h3>
        <p className="font-ui text-[12px] text-t-secondary mt-1">{plan.description}</p>
      </div>

      <div className="flex items-baseline gap-1">
        <span className="font-display text-[28px] text-t-primary leading-none">
          {formatPrice(price)}
        </span>
        <span className="font-ui text-[12px] text-t-muted">{period}</span>
      </div>

      <button
        onClick={onSelect}
        disabled={loading}
        className={`w-full font-ui text-[11px] font-semibold tracking-wider uppercase
                    px-4 py-2.5 rounded-lg transition-all cursor-pointer
                    disabled:opacity-50 ${
                      plan.popular
                        ? "bg-primary text-primary-text hover:opacity-90"
                        : "bg-bg-surface-2 text-t-primary border border-b-default hover:bg-bg-surface-3"
                    }`}
      >
        {loading ? "Redirection…" : "Choisir"}
      </button>
    </div>
  );
}
