import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function OnboardingClub() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [clubName, setClubName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !clubName.trim()) return;
    setSubmitting(true);

    try {
      // Create org
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .insert({ name: clubName.trim(), created_by: user.id })
        .select("id")
        .single();

      if (orgError) throw orgError;

      // Link org to profile
      const { error: profileError } = await supabase
        .from("user_profiles")
        .update({ organization_id: org.id })
        .eq("user_id", user.id);

      if (profileError) throw profileError;

      navigate("/onboarding/plan");
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Progress */}
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`h-1 flex-1 rounded-full transition-all ${
                step === 1 ? "bg-primary" : "bg-bg-surface-3"
              }`}
            />
          ))}
        </div>

        <div className="text-center space-y-2">
          <p className="text-label">ÉTAPE 1 / 3</p>
          <h1
            className="font-display text-t-primary leading-none"
            style={{ fontSize: "var(--text-h2)" }}
          >
            TON CLUB
          </h1>
          <p className="font-ui text-[13px] text-t-secondary">
            Commence par créer ton club pour organiser tes équipes.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <label className="font-ui text-[11px] uppercase tracking-[0.15em] text-t-secondary">
              Nom du club
            </label>
            <input
              type="text"
              value={clubName}
              onChange={(e) => setClubName(e.target.value)}
              required
              placeholder="Ex: RFC Liège, JS Tamines…"
              className="w-full font-ui text-[14px] bg-bg-surface-1 border border-b-default
                         text-t-primary rounded-lg px-3 py-3 outline-none
                         focus:border-primary transition-colors placeholder:text-t-muted"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !clubName.trim()}
            className="w-full font-ui text-[11px] font-semibold tracking-wider uppercase
                       px-4 py-3 rounded-lg bg-primary text-primary-text
                       hover:opacity-90 active:scale-[0.98] transition-all
                       disabled:opacity-50 cursor-pointer"
          >
            {submitting ? "Création…" : "Continuer"}
          </button>
        </form>
      </div>
    </div>
  );
}
