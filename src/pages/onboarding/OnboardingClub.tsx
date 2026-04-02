import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

// ── Static config ─────────────────────────────────────────────────────────────

const PROVINCES = [
  { key: "LG", label: "Liège" },
] as const;

type ProvinceKey = (typeof PROVINCES)[number]["key"];

const DIVISIONS: { key: string; label: string; filter: string }[] = [
  { key: "P1",  label: "1re Provinciale",  filter: "1e provinciale" },
  { key: "P2C", label: "2e Provinciale C", filter: "2e provinciale C" },
  { key: "P3D", label: "3e Provinciale D", filter: "3e provinciale D" },
];

// ── Types ─────────────────────────────────────────────────────────────────────

interface OrgRow {
  id: string;
  name: string;
  logo_url: string | null;
  external_api_id: string | null;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function OnboardingClub() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [province, setProvince] = useState<ProvinceKey | null>(null);
  const [division, setDivision] = useState<string | null>(null);
  const [clubs, setClubs] = useState<OrgRow[]>([]);
  const [loadingClubs, setLoadingClubs] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<OrgRow | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch clubs whenever division changes
  useEffect(() => {
    if (!division) {
      setClubs([]);
      setSelectedOrg(null);
      return;
    }
    const divConfig = DIVISIONS.find((d) => d.key === division)!;
    setLoadingClubs(true);
    setSelectedOrg(null);

    supabase
      .from("organizations")
      .select("id, name, logo_url, external_api_id")
      .ilike("division", `%${divConfig.filter}%`)
      .order("name")
      .then(({ data, error }) => {
        setLoadingClubs(false);
        if (error) {
          toast({ title: "Erreur", description: error.message, variant: "destructive" });
          return;
        }
        setClubs((data ?? []) as OrgRow[]);
      });
  }, [division]);

  const handleSubmit = async () => {
    if (!user || !selectedOrg) return;
    setSubmitting(true);
    try {
      // 1. Link user profile to the VIB organization
      const { error: profileError } = await supabase
        .from("user_profiles")
        .update({ organization_id: selectedOrg.id })
        .eq("id", user.id);
      if (profileError) throw profileError;

      // 2. Claim the organization (set created_by) if unclaimed
      await supabase
        .from("organizations")
        .update({ created_by: user.id })
        .eq("id", selectedOrg.id)
        .is("created_by", null);
      // Ignore errors here — org may already be claimed or policy may deny it

      navigate("/onboarding/plan");
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  // Step index for progress bar: 0=province, 1=division, 2=club
  const step = province === null ? 0 : division === null ? 1 : 2;

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">

        {/* Progress bar */}
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                s === 1 ? "bg-primary" : "bg-bg-surface-3"
              }`}
            />
          ))}
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <p className="text-label">ÉTAPE 1 / 3</p>
          <h1
            className="font-display text-t-primary leading-none"
            style={{ fontSize: "var(--text-h2)" }}
          >
            TON CLUB
          </h1>
          <p className="font-ui text-[13px] text-t-secondary">
            Sélectionne ton club dans les compétitions provinciales.
          </p>
        </div>

        <div className="space-y-6">

          {/* ── Step 1 : Province ── */}
          <div className="space-y-2">
            <p className="font-ui text-[11px] uppercase tracking-[0.15em] text-t-secondary">
              Province
            </p>
            <div className="flex flex-wrap gap-2">
              {PROVINCES.map((p) => (
                <button
                  key={p.key}
                  onClick={() => {
                    setProvince(p.key);
                    setDivision(null);
                    setClubs([]);
                    setSelectedOrg(null);
                  }}
                  className={`px-4 py-2.5 rounded-lg font-ui text-[13px] transition-all cursor-pointer border ${
                    province === p.key
                      ? "bg-primary text-primary-text border-transparent"
                      : "bg-bg-surface-1 text-t-secondary border-b-subtle hover:bg-bg-surface-2"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Step 2 : Division ── */}
          {province !== null && (
            <div className="space-y-2 animate-fade-in">
              <p className="font-ui text-[11px] uppercase tracking-[0.15em] text-t-secondary flex items-center gap-1.5">
                <ChevronRight className="h-3 w-3 text-t-muted" />
                Division
              </p>
              <div className="flex flex-wrap gap-2">
                {DIVISIONS.map((d) => (
                  <button
                    key={d.key}
                    onClick={() => setDivision(d.key)}
                    className={`px-4 py-2.5 rounded-lg font-ui text-[13px] transition-all cursor-pointer border ${
                      division === d.key
                        ? "bg-primary text-primary-text border-transparent"
                        : "bg-bg-surface-1 text-t-secondary border-b-subtle hover:bg-bg-surface-2"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 3 : Club ── */}
          {division !== null && (
            <div className="space-y-2 animate-fade-in">
              <p className="font-ui text-[11px] uppercase tracking-[0.15em] text-t-secondary flex items-center gap-1.5">
                <ChevronRight className="h-3 w-3 text-t-muted" />
                Club
              </p>

              {loadingClubs ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-14 bg-bg-surface-1 border border-b-subtle rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
                  {clubs.map((club) => (
                    <button
                      key={club.id}
                      onClick={() => setSelectedOrg(club)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all cursor-pointer ${
                        selectedOrg?.id === club.id
                          ? "bg-primary/10 border-primary-border"
                          : "bg-bg-surface-1 border-b-subtle hover:bg-bg-surface-2"
                      }`}
                    >
                      {/* Logo */}
                      {club.logo_url ? (
                        <img
                          src={club.logo_url}
                          alt=""
                          className="w-9 h-9 rounded-lg object-contain bg-bg-surface-2 shrink-0"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-bg-surface-2 flex items-center justify-center shrink-0">
                          <span className="font-ui text-[11px] text-t-muted">
                            {club.name.slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                      )}

                      <span
                        className={`font-ui text-[13px] truncate ${
                          selectedOrg?.id === club.id ? "text-t-primary font-semibold" : "text-t-secondary"
                        }`}
                      >
                        {club.name}
                      </span>

                      {selectedOrg?.id === club.id && (
                        <span className="ml-auto text-primary text-[16px] shrink-0">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Confirm ── */}
          {selectedOrg && (
            <div className="space-y-3 animate-fade-in pt-2">
              <div className="bg-bg-surface-1 border border-primary-border rounded-xl px-4 py-3 flex items-center gap-3">
                {selectedOrg.logo_url && (
                  <img
                    src={selectedOrg.logo_url}
                    alt=""
                    className="w-10 h-10 rounded-lg object-contain bg-bg-surface-2 shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                )}
                <div>
                  <p className="font-ui text-[11px] text-t-muted uppercase tracking-wider">Club sélectionné</p>
                  <p className="font-display text-t-primary text-[15px] leading-tight mt-0.5">
                    {selectedOrg.name}
                  </p>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full font-ui text-[11px] font-semibold tracking-wider uppercase
                           px-4 py-3 rounded-lg bg-primary text-primary-text
                           hover:opacity-90 active:scale-[0.98] transition-all
                           disabled:opacity-50 cursor-pointer"
              >
                {submitting ? "Enregistrement…" : "Continuer"}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
