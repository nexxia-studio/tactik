import { useState, useMemo } from "react";
import { List, PieChart, Trash2, Check, Plus, Pencil } from "lucide-react";
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  MOCK_FINES, MOCK_FINE_RULES, MOCK_EXPENSES, MOCK_TREASURY,
  FINE_PLAYERS,
  type Fine, type FineRule, type TreasuryExpense, type Treasury,
} from "@/data/mockFines";
import NewFineDialog from "@/components/fines/NewFineDialog";
import NewRuleDialog from "@/components/fines/NewRuleDialog";
import NewExpenseDialog from "@/components/fines/NewExpenseDialog";
import EditGoalDialog from "@/components/fines/EditGoalDialog";

const DONUT_COLORS = [
  "#16FF6E", "#4F8EFF", "#FFD60A", "#FF3B30", "#FF8C00",
  "#A855F7", "#06B6D4", "#EC4899", "#84CC16", "#F97316",
];

type StatusFilter = "all" | "paid" | "unpaid";
type PlayerView = "list" | "chart";

export default function FinesPage() {
  const [fines, setFines] = useState<Fine[]>(MOCK_FINES);
  const [rules, setRules] = useState<FineRule[]>(MOCK_FINE_RULES);
  const [expenses, setExpenses] = useState<TreasuryExpense[]>(MOCK_EXPENSES);
  const [treasury, setTreasury] = useState<Treasury>(MOCK_TREASURY);

  const [playerView, setPlayerView] = useState<PlayerView>("list");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [playerFilter, setPlayerFilter] = useState<string>("all");
  const [ruleFilter, setRuleFilter] = useState<string>("all");

  // Treasury calculations
  const totalCollected = useMemo(() => fines.filter((f) => f.is_paid).reduce((s, f) => s + f.amount, 0), [fines]);
  const totalDue = useMemo(() => fines.filter((f) => !f.is_paid).reduce((s, f) => s + f.amount, 0), [fines]);
  const totalSpent = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);
  const balance = totalCollected - totalSpent;
  const goalProgress = treasury.goal_amount > 0 ? Math.min(100, Math.round((balance / treasury.goal_amount) * 100)) : 0;

  // Player breakdown
  const playerStats = useMemo(() => {
    const map: Record<string, { name: string; count: number; paid: number; unpaid: number; total: number }> = {};
    fines.forEach((f) => {
      if (!map[f.player_id]) map[f.player_id] = { name: f.player_name, count: 0, paid: 0, unpaid: 0, total: 0 };
      map[f.player_id].count++;
      map[f.player_id].total += f.amount;
      if (f.is_paid) map[f.player_id].paid += f.amount;
      else map[f.player_id].unpaid += f.amount;
    });
    return Object.entries(map)
      .map(([id, s]) => ({ id, ...s }))
      .sort((a, b) => b.total - a.total);
  }, [fines]);

  const championId = playerStats[0]?.id;

  // Filtered fines
  const filteredFines = useMemo(() => {
    return fines
      .filter((f) => {
        if (statusFilter === "paid" && !f.is_paid) return false;
        if (statusFilter === "unpaid" && f.is_paid) return false;
        if (playerFilter !== "all" && f.player_id !== playerFilter) return false;
        if (ruleFilter !== "all" && f.rule_id !== ruleFilter) return false;
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [fines, statusFilter, playerFilter, ruleFilter]);

  const handleAddFine = (fine: Omit<Fine, "id">) => {
    setFines((prev) => [...prev, { ...fine, id: `f-${Date.now()}` }]);
  };

  const togglePaid = (id: string) => {
    setFines((prev) => prev.map((f) => f.id === id ? { ...f, is_paid: !f.is_paid } : f));
  };

  const deleteFine = (id: string) => {
    setFines((prev) => prev.filter((f) => f.id !== id));
  };

  const handleAddRule = (rule: Omit<FineRule, "id">) => {
    setRules((prev) => [...prev, { ...rule, id: `r-${Date.now()}` }]);
  };

  const toggleRuleActive = (id: string) => {
    setRules((prev) => prev.map((r) => r.id === id ? { ...r, is_active: !r.is_active } : r));
  };

  const deleteRule = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  const handleAddExpense = (expense: Omit<TreasuryExpense, "id">) => {
    setExpenses((prev) => [...prev, { ...expense, id: `e-${Date.now()}` }]);
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const handleUpdateGoal = (goal: string, amount: number) => {
    setTreasury((prev) => ({ ...prev, season_goal: goal, goal_amount: amount }));
  };

  const formatEuro = (n: number) => `${n.toFixed(2).replace(".", ",")} €`;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("fr-BE", { day: "numeric", month: "short", year: "numeric" });
  };

  // Donut data
  const donutData = playerStats.map((p) => ({ name: p.name, value: p.total }));
  const donutTotal = donutData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="space-y-6 pb-24 lg:pb-0">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-t-primary leading-none uppercase" style={{ fontSize: "var(--text-h1)" }}>
            AMENDES
          </h1>
          <p className="text-t-secondary font-ui text-[var(--text-small)] mt-2 italic">
            Saison 2024-2025
          </p>
        </div>
        <NewFineDialog rules={rules} onAdd={handleAddFine} />
      </div>

      {/* Section 1 — Dashboard Cagnotte */}
      <section className="bg-bg-surface-1 border border-b-subtle rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Col 1 — Solde */}
          <div className="space-y-1">
            <p className="font-ui text-[11px] text-t-muted uppercase tracking-wider">Solde disponible</p>
            <p className="font-display text-[32px] leading-none" style={{ color: "var(--color-primary)", textShadow: "0 0 20px var(--color-primary-glow)" }}>
              {formatEuro(balance)}
            </p>
            <p className="font-ui text-[11px] text-t-muted italic">= Collecté − Dépensé</p>
          </div>

          {/* Col 2 — Collecté / Dépensé */}
          <div className="space-y-3 md:border-l md:border-b-subtle md:pl-6">
            <div>
              <p className="font-ui text-[11px] text-t-muted uppercase tracking-wider">Total collecté</p>
              <p className="font-display text-[20px]" style={{ color: "var(--color-success)" }}>
                {formatEuro(totalCollected)}
              </p>
            </div>
            <div className="border-t border-b-subtle pt-3">
              <p className="font-ui text-[11px] text-t-muted uppercase tracking-wider">Total dépensé</p>
              <p className="font-display text-[20px]" style={{ color: "var(--color-danger)" }}>
                {formatEuro(totalSpent)}
              </p>
            </div>
            <div className="border-t border-b-subtle pt-3">
              <p className="font-ui text-[11px] text-t-muted uppercase tracking-wider">Non payé</p>
              <p className="font-display text-[20px]" style={{ color: "var(--color-warning)" }}>
                {formatEuro(totalDue)}
              </p>
            </div>
          </div>

          {/* Col 3 — Objectif */}
          <div className="space-y-2 md:border-l md:border-b-subtle md:pl-6">
            <p className="font-ui text-[11px] text-t-muted uppercase tracking-wider">Objectif</p>
            <p className="font-ui text-[14px] text-t-primary">{treasury.season_goal}</p>
            <div className="space-y-1">
              <div className="h-2 w-full rounded-full bg-bg-surface-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${goalProgress}%`, backgroundColor: "var(--color-primary)" }}
                />
              </div>
              <p className="font-ui text-[11px] text-t-muted">
                {formatEuro(balance)} / {formatEuro(treasury.goal_amount)} — {goalProgress}%
              </p>
            </div>
            <EditGoalDialog
              currentGoal={treasury.season_goal}
              currentAmount={treasury.goal_amount}
              onSave={handleUpdateGoal}
            />
          </div>
        </div>
      </section>

      {/* Section 2 — Par joueur */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-ui text-[11px] text-t-muted uppercase tracking-wider">Amendes par joueur</h2>
          <div className="flex gap-1.5">
            {([
              { key: "list" as PlayerView, label: "Liste", icon: List },
              { key: "chart" as PlayerView, label: "Graphique", icon: PieChart },
            ]).map((v) => (
              <button
                key={v.key}
                onClick={() => setPlayerView(v.key)}
                className={`px-3 py-1.5 rounded-lg font-ui text-[12px] transition-all cursor-pointer flex items-center gap-1.5 ${
                  playerView === v.key
                    ? "bg-primary text-primary-text"
                    : "bg-bg-surface-1 text-t-secondary border border-b-subtle hover:bg-bg-surface-2"
                }`}
              >
                <v.icon className="h-3.5 w-3.5" />
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {playerView === "list" ? (
          <div className="bg-bg-surface-1 border border-b-subtle rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-b-subtle">
                    {["#", "Joueur", "Amendes", "Dû", "Payé", "Total", ""].map((h) => (
                      <th key={h} className="font-ui text-[11px] text-t-muted uppercase tracking-wider text-left px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {playerStats.map((p, i) => (
                    <tr key={p.id} className="border-b border-b-subtle last:border-0 hover:bg-bg-surface-2 transition-colors">
                      <td className="px-4 py-3 font-ui text-[13px] text-t-muted">{i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-bg-surface-2 flex items-center justify-center shrink-0">
                            <span className="font-ui text-[10px] text-t-muted">{p.name.split(" ").map((n) => n[0]).join("")}</span>
                          </div>
                          <span className="font-ui text-[13px] text-t-primary">{p.name}</span>
                          {p.id === championId && (
                            <span className="px-2 py-0.5 rounded-md font-ui text-[10px]" style={{ backgroundColor: "rgba(255,214,10,0.15)", color: "var(--color-warning)" }}>
                              💸 Champion
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-ui text-[13px] text-t-secondary">{p.count}</td>
                      <td className="px-4 py-3 font-ui text-[13px]" style={{ color: "var(--color-danger)" }}>{formatEuro(p.unpaid)}</td>
                      <td className="px-4 py-3 font-ui text-[13px]" style={{ color: "var(--color-primary)" }}>{formatEuro(p.paid)}</td>
                      <td className="px-4 py-3 font-display text-[14px] text-t-primary">{formatEuro(p.total)}</td>
                      <td className="px-4 py-3">
                        <NewFineDialog
                          rules={rules}
                          onAdd={handleAddFine}
                          trigger={
                            <button className="w-7 h-7 rounded-lg bg-bg-surface-2 border border-b-subtle flex items-center justify-center hover:bg-bg-surface-3 transition-all cursor-pointer">
                              <Plus className="h-3 w-3 text-t-muted" />
                            </button>
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-bg-surface-2">
                    <td colSpan={2} className="px-4 py-3 font-ui text-[13px] text-t-secondary uppercase">Total</td>
                    <td className="px-4 py-3 font-display text-[14px] text-t-primary">{fines.length}</td>
                    <td className="px-4 py-3 font-display text-[14px]" style={{ color: "var(--color-danger)" }}>{formatEuro(totalDue)}</td>
                    <td className="px-4 py-3 font-display text-[14px]" style={{ color: "var(--color-primary)" }}>{formatEuro(totalCollected)}</td>
                    <td className="px-4 py-3 font-display text-[14px] text-t-primary">{formatEuro(totalCollected + totalDue)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-bg-surface-1 border border-b-subtle rounded-xl p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-[200px] h-[200px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {donutData.map((_, i) => (
                        <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatEuro(value)}
                      contentStyle={{ backgroundColor: "var(--bg-surface-2)", border: "1px solid var(--border-subtle)", borderRadius: 8, fontFamily: "var(--font-ui)" }}
                      itemStyle={{ color: "var(--text-primary)" }}
                    />
                  </RePieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="font-display text-[16px] text-t-primary">{formatEuro(donutTotal)}</p>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                {donutData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                    <span className="font-ui text-[13px] text-t-primary flex-1">{d.name}</span>
                    <span className="font-ui text-[13px] text-t-secondary">{formatEuro(d.value)}</span>
                    <span className="font-ui text-[11px] text-t-muted w-10 text-right">{donutTotal > 0 ? Math.round((d.value / donutTotal) * 100) : 0}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Section 3 — Historique */}
      <section className="space-y-3">
        <h2 className="font-ui text-[11px] text-t-muted uppercase tracking-wider px-1">Historique</h2>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <Select value={playerFilter} onValueChange={setPlayerFilter}>
            <SelectTrigger className="w-[180px] bg-bg-surface-1 border-b-subtle font-ui text-[12px] text-t-primary h-8">
              <SelectValue placeholder="Tous les joueurs" />
            </SelectTrigger>
            <SelectContent className="bg-bg-surface-1 border-b-subtle">
              <SelectItem value="all" className="font-ui text-[12px]">Tous les joueurs</SelectItem>
              {FINE_PLAYERS.map((p) => (
                <SelectItem key={p.id} value={p.id} className="font-ui text-[12px]">{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-1">
            {([
              { key: "all" as StatusFilter, label: "Tous" },
              { key: "paid" as StatusFilter, label: "Payé" },
              { key: "unpaid" as StatusFilter, label: "Non payé" },
            ]).map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`px-2.5 py-1 rounded-lg font-ui text-[11px] transition-all cursor-pointer ${
                  statusFilter === f.key
                    ? "bg-primary text-primary-text"
                    : "bg-bg-surface-1 text-t-secondary border border-b-subtle hover:bg-bg-surface-2"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <Select value={ruleFilter} onValueChange={setRuleFilter}>
            <SelectTrigger className="w-[180px] bg-bg-surface-1 border-b-subtle font-ui text-[12px] text-t-primary h-8">
              <SelectValue placeholder="Tous les motifs" />
            </SelectTrigger>
            <SelectContent className="bg-bg-surface-1 border-b-subtle">
              <SelectItem value="all" className="font-ui text-[12px]">Tous les motifs</SelectItem>
              {rules.map((r) => (
                <SelectItem key={r.id} value={r.id} className="font-ui text-[12px]">{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Fine cards */}
        <div className="space-y-2">
          {filteredFines.length === 0 ? (
            <p className="font-ui text-[12px] text-t-muted text-center py-8 italic">Aucune amende trouvée</p>
          ) : (
            filteredFines.map((fine) => (
              <div key={fine.id} className="bg-bg-surface-1 border border-b-subtle rounded-xl px-4 py-3 flex items-center gap-3">
                <span className="text-[16px] shrink-0">{fine.is_paid ? "✅" : "⏳"}</span>
                <div className="w-7 h-7 rounded-full bg-bg-surface-2 flex items-center justify-center shrink-0">
                  <span className="font-ui text-[10px] text-t-muted">{fine.player_name.split(" ").map((n) => n[0]).join("")}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-ui text-[13px] text-t-primary truncate">{fine.player_name}</p>
                  <p className="font-ui text-[11px] text-t-secondary">{fine.rule_label}</p>
                  <p className="font-ui text-[10px] text-t-muted italic">{formatDate(fine.date)} — Par {fine.created_by}</p>
                </div>
                <p className="font-display text-[16px] shrink-0" style={{ color: fine.is_paid ? "var(--color-primary)" : "var(--color-danger)" }}>
                  {formatEuro(fine.amount)}
                </p>
                <div className="flex gap-1 shrink-0">
                  {!fine.is_paid && (
                    <button
                      onClick={() => togglePaid(fine.id)}
                      className="w-7 h-7 rounded-lg bg-bg-surface-2 border border-b-subtle flex items-center justify-center hover:bg-bg-surface-3 transition-all cursor-pointer"
                      title="Marquer payé"
                    >
                      <Check className="h-3 w-3 text-t-muted" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteFine(fine.id)}
                    className="w-7 h-7 rounded-lg bg-bg-surface-2 border border-b-subtle flex items-center justify-center hover:bg-bg-surface-3 transition-all cursor-pointer"
                    title="Supprimer"
                  >
                    <Trash2 className="h-3 w-3 text-t-muted hover:text-[var(--color-danger)]" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Section 4 — Barème */}
      <Accordion type="single" collapsible defaultValue="bareme">
        <AccordionItem value="bareme" className="bg-bg-surface-1 border border-b-subtle rounded-xl overflow-hidden">
          <AccordionTrigger className="px-4 py-3 font-ui text-[13px] text-t-primary hover:no-underline hover:bg-bg-surface-2 transition-all">
            Barème de l'équipe
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-1">
              {rules.map((rule) => (
                <div key={rule.id} className="flex items-center gap-3 bg-bg-surface-2 rounded-lg px-3 py-2.5">
                  <span className="font-ui text-[13px] text-t-primary flex-1">{rule.label}</span>
                  <span className="font-display text-[14px] text-t-primary">{formatEuro(rule.amount)}</span>
                  <span
                    className="px-2 py-0.5 rounded-md font-ui text-[10px] uppercase tracking-wider"
                    style={{
                      backgroundColor: rule.is_active ? "rgba(22,255,110,0.15)" : "rgba(255,255,255,0.05)",
                      color: rule.is_active ? "var(--color-primary)" : "var(--text-muted)",
                    }}
                  >
                    {rule.is_active ? "Actif" : "Inactif"}
                  </span>
                  <button
                    onClick={() => toggleRuleActive(rule.id)}
                    className="w-7 h-7 rounded-lg bg-bg-surface-1 border border-b-subtle flex items-center justify-center hover:bg-bg-surface-3 transition-all cursor-pointer"
                    title="Modifier statut"
                  >
                    <Pencil className="h-3 w-3 text-t-muted" />
                  </button>
                  <button
                    onClick={() => deleteRule(rule.id)}
                    className="w-7 h-7 rounded-lg bg-bg-surface-1 border border-b-subtle flex items-center justify-center hover:bg-bg-surface-3 transition-all cursor-pointer"
                    title="Supprimer"
                  >
                    <Trash2 className="h-3 w-3 text-t-muted hover:text-[var(--color-danger)]" />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <NewRuleDialog onAdd={handleAddRule} />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Section 5 — Dépenses */}
      <Accordion type="single" collapsible>
        <AccordionItem value="depenses" className="bg-bg-surface-1 border border-b-subtle rounded-xl overflow-hidden">
          <AccordionTrigger className="px-4 py-3 font-ui text-[13px] text-t-primary hover:no-underline hover:bg-bg-surface-2 transition-all">
            <span className="flex items-center gap-3">
              Dépenses
              <span className="font-display text-[14px]" style={{ color: "var(--color-danger)" }}>{formatEuro(totalSpent)}</span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-1">
              {expenses.map((exp) => (
                <div key={exp.id} className="flex items-center gap-3 bg-bg-surface-2 rounded-lg px-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="font-ui text-[13px] text-t-primary">{exp.label}</p>
                    <p className="font-ui text-[10px] text-t-muted italic">{formatDate(exp.date)} — {exp.created_by}</p>
                  </div>
                  <span className="font-display text-[14px] shrink-0" style={{ color: "var(--color-danger)" }}>
                    {formatEuro(exp.amount)}
                  </span>
                  <button
                    onClick={() => deleteExpense(exp.id)}
                    className="w-7 h-7 rounded-lg bg-bg-surface-1 border border-b-subtle flex items-center justify-center hover:bg-bg-surface-3 transition-all cursor-pointer"
                    title="Supprimer"
                  >
                    <Trash2 className="h-3 w-3 text-t-muted hover:text-[var(--color-danger)]" />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <NewExpenseDialog onAdd={handleAddExpense} />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
