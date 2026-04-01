import { useState } from "react";
import {
  Users, Calendar, Trophy, ChevronDown, Download, X, Send,
  Settings, CreditCard, FileText, AlertTriangle, RotateCcw, Trash2,
  ExternalLink, Check,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DangerConfirmDialog } from "@/components/admin/DangerConfirmDialog";
import { PLANS, formatPrice } from "@/config/stripe-plans";

/* ── Mock data ── */
const CLUB = {
  name: "RFC XHOFFRAIX",
  city: "Xhoffraix",
  division: "Liège 2C",
  sport: "Football",
  players_count: 18,
  season: "2024-2025",
  matches_played: 13,
};

const SUBSCRIPTION = {
  plan: "solo" as "solo" | "solo+" | "club",
  plan_label: "SOLO",
  plan_id: "solo",
  amount: 9,
  period: "mois" as const,
  renewal_date: "1 mai 2025",
  status: "active" as const,
  licenses_used: 1,
  licenses_total: 1,
};

const INVOICES = [
  { id: "inv1", date: "1 mars 2025", description: "Tactik Solo — Mars 2025", amount: "9,00 €", status: "paid" as const },
  { id: "inv2", date: "1 février 2025", description: "Tactik Solo — Février 2025", amount: "9,00 €", status: "paid" as const },
  { id: "inv3", date: "1 janvier 2025", description: "Tactik Solo — Janvier 2025", amount: "9,00 €", status: "paid" as const },
];

const INVITATIONS = [
  { id: "i1", name: "Marc Lecomte", email: "marc@xhoffraix.be", role: "coach" as const, status: "active" as const, date: "12 déc. 2024" },
  { id: "i2", name: "Pierre Xhonneux", email: "pierre@gmail.com", role: "fine_manager" as const, status: "pending" as const, date: "3 mars 2025" },
];

const PLAN_STYLES = {
  solo: { bg: "bg-primary", text: "text-primary-text" },
  "solo+": { bg: "bg-[var(--color-info)]", text: "text-white" },
  club: { bg: "bg-[var(--color-warning)]", text: "text-black" },
};

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  coach: { label: "Coach", color: "bg-[var(--color-info)]/15 text-[var(--color-info)]" },
  fine_manager: { label: "Gestionnaire amendes", color: "bg-[var(--color-warning)]/15 text-[var(--color-warning)]" },
};

/* ── Button style for primary buttons (black text, semibold) ── */
const primaryBtnClass = "py-2.5 rounded-xl font-ui text-[12px] uppercase tracking-[0.05em] font-semibold bg-primary text-black hover:opacity-90 transition-all flex items-center justify-center gap-2";

export default function AdminPage() {
  const [dangerAction, setDangerAction] = useState<"reset" | "delete" | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("coach");

  // Modals
  const [editClubOpen, setEditClubOpen] = useState(false);
  const [manageSubOpen, setManageSubOpen] = useState(false);
  const [changePlanOpen, setChangePlanOpen] = useState(false);

  // Edit club form
  const [clubName, setClubName] = useState(CLUB.name);
  const [clubCity, setClubCity] = useState(CLUB.city);
  const [clubDivision, setClubDivision] = useState(CLUB.division);

  // Change plan
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");

  const planStyle = PLAN_STYLES[SUBSCRIPTION.plan] ?? PLAN_STYLES.solo;

  // Only show the 4 plans requested
  const displayPlans = PLANS.filter((p) => ["solo", "solo-plus", "club-2", "club-3"].includes(p.id));

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div>
        <h1 className="font-display text-t-primary leading-none" style={{ fontSize: "var(--text-h1)" }}>
          ADMINISTRATION
        </h1>
        <p className="text-t-muted font-ui italic text-[var(--text-small)] mt-2">
          Gestion du club et de l'abonnement
        </p>
      </div>

      {/* Section 1 — Mon club */}
      <section className="bg-bg-surface-1 border border-b-subtle rounded-xl p-6 space-y-6">
        <h2 className="font-display text-t-primary text-[var(--text-h3)] uppercase">Mon club</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Col 1 — Infos */}
          <div className="flex flex-col items-start gap-4">
            <div className="flex items-center gap-4">
              <div className="w-[80px] h-[80px] rounded-full bg-primary-dim flex items-center justify-center shrink-0">
                <span className="font-display text-[24px] text-primary">RFC</span>
              </div>
              <div>
                <p className="font-display text-[20px] text-t-primary leading-tight">{CLUB.name}</p>
                <p className="font-ui italic text-t-muted text-[var(--text-small)]">{CLUB.city}</p>
                <div className="flex gap-2 mt-2">
                  <span className="px-2 py-0.5 rounded-md font-ui text-[var(--text-label)] bg-primary-dim text-primary">
                    {CLUB.division}
                  </span>
                  <span className="px-2 py-0.5 rounded-md font-ui text-[var(--text-label)] bg-bg-surface-3 text-t-secondary">
                    {CLUB.sport}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Col 2 — Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Joueurs", value: CLUB.players_count, icon: Users },
              { label: "Saison", value: CLUB.season, icon: Calendar },
              { label: "Matchs joués", value: CLUB.matches_played, icon: Trophy },
            ].map((stat) => (
              <div key={stat.label} className="bg-bg-surface-2 border border-b-subtle rounded-xl p-4 flex flex-col items-center gap-2 text-center">
                <stat.icon className="w-5 h-5 text-t-muted" />
                <span className="font-display text-[18px] text-t-primary leading-none">{stat.value}</span>
                <span className="font-ui text-[var(--text-micro)] text-t-muted uppercase tracking-wider">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => setEditClubOpen(true)}
          className="w-full py-2.5 rounded-xl font-ui text-[var(--text-label)] uppercase tracking-wider bg-transparent border border-b-default text-t-secondary hover:bg-bg-surface-2 transition-all"
        >
          Modifier les infos du club
        </button>
      </section>

      {/* Section 2 — Abonnement */}
      <section className="bg-bg-surface-1 border border-b-subtle rounded-xl p-6 space-y-6">
        <h2 className="font-display text-t-primary text-[var(--text-h3)] uppercase">Abonnement</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left — Plan info */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-lg font-display text-[14px] uppercase ${planStyle.bg} ${planStyle.text}`}>
                {SUBSCRIPTION.plan_label}
              </span>
              <span className="px-2 py-0.5 rounded-md font-ui text-[var(--text-label)] bg-[var(--color-success)]/15 text-[var(--color-success)]">
                Actif
              </span>
            </div>
            <p className="font-ui text-[var(--text-micro)] text-t-muted uppercase tracking-wider">Plan actuel</p>
            <p className="font-ui text-[var(--text-body)] text-t-secondary">
              Renouvellement le {SUBSCRIPTION.renewal_date}
            </p>

            {SUBSCRIPTION.plan === "club" && (
              <div className="space-y-2 pt-2">
                <div className="flex justify-between font-ui text-[var(--text-small)]">
                  <span className="text-t-secondary">Licences utilisées</span>
                  <span className="text-t-primary">{SUBSCRIPTION.licenses_used} / {SUBSCRIPTION.licenses_total}</span>
                </div>
                <Progress value={(SUBSCRIPTION.licenses_used / SUBSCRIPTION.licenses_total) * 100} className="h-2" />
              </div>
            )}
          </div>

          {/* Right — Price */}
          <div className="flex items-center justify-center md:justify-end gap-1">
            <span className="font-display text-[32px] text-primary leading-none">{SUBSCRIPTION.amount}€</span>
            <span className="font-ui text-t-muted text-[var(--text-body)]">/{SUBSCRIPTION.period}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setManageSubOpen(true)}
            className={`${primaryBtnClass} flex-1 px-5`}
          >
            <CreditCard className="w-4 h-4 stroke-black" />
            Gérer mon abonnement
          </button>
          <button
            onClick={() => setChangePlanOpen(true)}
            className="flex-1 py-2.5 rounded-xl font-ui text-[var(--text-label)] uppercase tracking-wider bg-transparent border border-b-default text-t-secondary hover:bg-bg-surface-2 transition-all"
          >
            Changer de plan
          </button>
        </div>

        {/* Invoices */}
        <Accordion type="single" collapsible>
          <AccordionItem value="invoices" className="border-b-subtle">
            <AccordionTrigger className="font-ui text-[var(--text-body)] text-t-secondary hover:text-t-primary">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Historique des factures
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                {INVOICES.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between bg-bg-surface-2 border border-b-subtle rounded-lg p-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-ui text-[var(--text-body)] text-t-primary">{inv.description}</p>
                      <p className="font-ui text-[var(--text-micro)] text-t-muted">{inv.date}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-ui text-[var(--text-body)] text-t-primary">{inv.amount}</span>
                      <span className="px-2 py-0.5 rounded-md font-ui text-[var(--text-label)] bg-[var(--color-success)]/15 text-[var(--color-success)]">
                        Payé
                      </span>
                      <button className="p-1.5 rounded-lg hover:bg-bg-surface-3 transition-colors text-t-muted hover:text-t-primary">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* Section 3 — Invitations */}
      <section className="bg-bg-surface-1 border border-b-subtle rounded-xl p-6 space-y-6">
        <h2 className="font-display text-t-primary text-[var(--text-h3)] uppercase">Accès coaches</h2>

        <div className="space-y-3">
          {INVITATIONS.map((inv) => {
            const roleInfo = ROLE_LABELS[inv.role] ?? { label: inv.role, color: "bg-bg-surface-3 text-t-secondary" };
            return (
              <div key={inv.id} className="flex items-center gap-3 bg-bg-surface-2 border border-b-subtle rounded-xl p-4">
                <div className="w-10 h-10 rounded-full bg-primary-dim flex items-center justify-center shrink-0">
                  <span className="font-display text-[12px] text-primary">
                    {inv.name.split(" ").map((n) => n[0]).join("")}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-ui text-[var(--text-body)] text-t-primary">{inv.name}</p>
                  <p className="font-ui italic text-[var(--text-small)] text-t-muted truncate">{inv.email}</p>
                  <p className="font-ui text-[var(--text-micro)] text-t-muted mt-0.5">{inv.date}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2 py-0.5 rounded-md font-ui text-[var(--text-label)] ${roleInfo.color}`}>
                    {roleInfo.label}
                  </span>
                  {inv.status === "active" ? (
                    <span className="px-2 py-0.5 rounded-md font-ui text-[var(--text-label)] bg-[var(--color-success)]/15 text-[var(--color-success)]">
                      Actif
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md font-ui text-[var(--text-label)] bg-bg-surface-3 text-t-muted">
                      Invitation envoyée
                    </span>
                  )}
                  <button
                    onClick={() => toast.success(`Accès révoqué pour ${inv.name}`)}
                    className="p-1.5 rounded-lg hover:bg-[var(--color-danger)]/10 transition-colors text-t-muted hover:text-[var(--color-danger)]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Invite form */}
        <div className="border-t border-b-subtle pt-5">
          <p className="font-ui text-[var(--text-label)] text-t-muted uppercase tracking-wider mb-3">
            Inviter un nouveau membre
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="email@exemple.com"
              type="email"
              className="flex-1 bg-bg-surface-2 border-b-subtle font-ui text-[var(--text-body)]"
            />
            <Select value={inviteRole} onValueChange={setInviteRole}>
              <SelectTrigger className="w-full sm:w-[220px] bg-bg-surface-2 border-b-subtle font-ui text-[var(--text-body)]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-bg-surface-2 border-b-subtle">
                <SelectItem value="coach" className="font-ui">Coach</SelectItem>
                <SelectItem value="fine_manager" className="font-ui">Gestionnaire amendes</SelectItem>
              </SelectContent>
            </Select>
            <button
              onClick={() => {
                if (!inviteEmail.trim()) return;
                toast.success(`Invitation envoyée à ${inviteEmail}`);
                setInviteEmail("");
              }}
              className={`${primaryBtnClass} px-5 shrink-0`}
            >
              <Send className="w-4 h-4 stroke-black" />
              Envoyer l'invitation
            </button>
          </div>
        </div>
      </section>

      {/* Section 4 — Danger zone */}
      <section className="bg-bg-surface-1 border border-[rgba(255,59,48,0.3)] rounded-xl p-6 space-y-6">
        <h2 className="font-ui text-[var(--color-danger)] text-[var(--text-h3)] uppercase tracking-wider">
          Zone de danger
        </h2>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-bg-surface-2 border border-b-subtle rounded-xl p-4">
            <div className="flex-1">
              <p className="font-ui text-[var(--text-body)] text-t-primary flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-[var(--color-danger)]" />
                Réinitialiser les données de la saison
              </p>
              <p className="font-ui text-[var(--text-small)] text-t-muted mt-1">
                Supprime tous les matchs, entraînements et stats de la saison en cours
              </p>
            </div>
            <button
              onClick={() => setDangerAction("reset")}
              className="px-4 py-2 rounded-xl font-ui text-[var(--text-label)] uppercase tracking-wider border border-[var(--color-danger)] text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 transition-all shrink-0"
            >
              Réinitialiser
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-bg-surface-2 border border-b-subtle rounded-xl p-4">
            <div className="flex-1">
              <p className="font-ui text-[var(--text-body)] text-t-primary flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-[var(--color-danger)]" />
                Supprimer le club
              </p>
              <p className="font-ui text-[var(--text-small)] text-t-muted mt-1">
                Action irréversible. Toutes les données seront supprimées.
              </p>
            </div>
            <button
              onClick={() => setDangerAction("delete")}
              className="px-4 py-2 rounded-xl font-ui text-[var(--text-label)] uppercase tracking-wider bg-[var(--color-danger)] text-white hover:bg-[var(--color-danger)]/90 transition-all shrink-0"
            >
              Supprimer
            </button>
          </div>
        </div>
      </section>

      {/* ── Modals ── */}

      {/* Edit Club Modal */}
      <Dialog open={editClubOpen} onOpenChange={setEditClubOpen}>
        <DialogContent className="bg-bg-surface-1 border-b-subtle sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="font-display text-t-primary text-[var(--text-h3)] uppercase">
              Modifier les infos du club
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <label className="font-ui text-[var(--text-label)] text-t-muted uppercase tracking-wider">Nom du club</label>
              <Input value={clubName} onChange={(e) => setClubName(e.target.value)} className="bg-bg-surface-2 border-b-subtle font-ui text-[var(--text-body)]" />
            </div>
            <div className="space-y-1.5">
              <label className="font-ui text-[var(--text-label)] text-t-muted uppercase tracking-wider">Ville</label>
              <Input value={clubCity} onChange={(e) => setClubCity(e.target.value)} className="bg-bg-surface-2 border-b-subtle font-ui text-[var(--text-body)]" />
            </div>
            <div className="space-y-1.5">
              <label className="font-ui text-[var(--text-label)] text-t-muted uppercase tracking-wider">Division</label>
              <Input value={clubDivision} onChange={(e) => setClubDivision(e.target.value)} className="bg-bg-surface-2 border-b-subtle font-ui text-[var(--text-body)]" />
            </div>
          </div>
          <DialogFooter className="flex gap-3 sm:gap-3">
            <button onClick={() => setEditClubOpen(false)} className="flex-1 py-2.5 rounded-xl font-ui text-[var(--text-label)] uppercase tracking-wider bg-transparent border border-b-default text-t-secondary hover:bg-bg-surface-2 transition-all">
              Annuler
            </button>
            <button
              onClick={() => {
                toast.success("Infos du club mises à jour ✓");
                setEditClubOpen(false);
              }}
              className={`${primaryBtnClass} flex-1 px-5`}
            >
              Sauvegarder
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Subscription Modal */}
      <Dialog open={manageSubOpen} onOpenChange={setManageSubOpen}>
        <DialogContent className="bg-bg-surface-1 border-b-subtle sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="font-display text-t-primary text-[var(--text-h3)] uppercase">
              Gestion de l'abonnement
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="font-ui text-[var(--text-body)] text-t-secondary">
              Vous allez être redirigé vers le portail Stripe pour gérer votre abonnement.
            </p>
          </div>
          <DialogFooter className="flex gap-3 sm:gap-3">
            <button onClick={() => setManageSubOpen(false)} className="flex-1 py-2.5 rounded-xl font-ui text-[var(--text-label)] uppercase tracking-wider bg-transparent border border-b-default text-t-secondary hover:bg-bg-surface-2 transition-all">
              Annuler
            </button>
            <button
              onClick={() => {
                toast.info("Redirection vers le portail Stripe…");
                setManageSubOpen(false);
              }}
              className={`${primaryBtnClass} flex-1 px-5`}
            >
              <ExternalLink className="w-4 h-4 stroke-black" />
              Accéder au portail Stripe
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Plan Modal */}
      <Dialog open={changePlanOpen} onOpenChange={setChangePlanOpen}>
        <DialogContent className="bg-bg-surface-1 border-b-subtle sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle className="font-display text-t-primary text-[var(--text-h3)] uppercase">
              Changer de plan
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-5">
            {/* Billing toggle */}
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setBillingPeriod("monthly")}
                className={`px-4 py-1.5 rounded-lg font-ui text-[12px] uppercase tracking-wider transition-all ${
                  billingPeriod === "monthly"
                    ? "bg-primary text-black font-semibold"
                    : "bg-bg-surface-2 text-t-secondary border border-b-subtle hover:bg-bg-surface-3"
                }`}
              >
                Mensuel
              </button>
              <button
                onClick={() => setBillingPeriod("yearly")}
                className={`px-4 py-1.5 rounded-lg font-ui text-[12px] uppercase tracking-wider transition-all ${
                  billingPeriod === "yearly"
                    ? "bg-primary text-black font-semibold"
                    : "bg-bg-surface-2 text-t-secondary border border-b-subtle hover:bg-bg-surface-3"
                }`}
              >
                Annuel
              </button>
            </div>

            {/* Plan cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {displayPlans.map((plan) => {
                const isCurrent = plan.id === SUBSCRIPTION.plan_id;
                const price = billingPeriod === "monthly" ? plan.price_monthly : plan.price_yearly;
                return (
                  <div
                    key={plan.id}
                    className={`relative bg-bg-surface-2 border rounded-xl p-4 flex flex-col items-center gap-3 text-center transition-all ${
                      isCurrent ? "border-primary ring-1 ring-primary/30" : "border-b-subtle"
                    }`}
                  >
                    {isCurrent && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md font-ui text-[9px] uppercase tracking-wider bg-primary text-black font-semibold whitespace-nowrap">
                        Plan actuel
                      </span>
                    )}
                    <p className="font-display text-[16px] text-t-primary uppercase mt-1">{plan.name}</p>
                    <p className="font-ui text-[var(--text-micro)] text-t-muted">{plan.description}</p>
                    <div>
                      <span className="font-display text-[24px] text-primary leading-none">
                        {formatPrice(price.amount)}
                      </span>
                      <span className="font-ui text-[var(--text-micro)] text-t-muted ml-1">
                        /{billingPeriod === "monthly" ? "mois" : "an"}
                      </span>
                    </div>
                    {isCurrent ? (
                      <span className="flex items-center gap-1 font-ui text-[11px] text-primary">
                        <Check className="w-3.5 h-3.5" /> Actif
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          toast.success(`Plan changé vers ${plan.name} ✓`);
                          setChangePlanOpen(false);
                        }}
                        className={`${primaryBtnClass} w-full px-3 text-[11px]`}
                      >
                        Choisir
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Danger confirmation dialog */}
      <DangerConfirmDialog
        open={dangerAction !== null}
        onOpenChange={(open) => { if (!open) setDangerAction(null); }}
        action={dangerAction ?? "reset"}
        clubName={CLUB.name}
        onConfirm={() => {
          toast.success(dangerAction === "reset" ? "Saison réinitialisée ✓" : "Club supprimé ✓");
          setDangerAction(null);
        }}
      />
    </div>
  );
}
