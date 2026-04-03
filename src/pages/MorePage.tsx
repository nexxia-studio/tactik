import { Link } from "react-router-dom";
import {
  Trophy,
  Banknote,
  BarChart3,
  Swords,
  Shield,
  Settings,
  MessageSquare,
  ChevronRight,
} from "lucide-react";

const sections = [
  { label: "Communication", path: "/communication",  icon: MessageSquare, desc: "Convocations & messages" },
  { label: "Classement",    path: "/classement",     icon: Trophy,        desc: "Table de la division" },
  { label: "Calendrier",    path: "/calendrier",     icon: Swords,        desc: "Matchs & résultats" },
  { label: "Statistiques",  path: "/statistiques",   icon: BarChart3,     desc: "Performances individuelles" },
  { label: "Équipe",        path: "/equipe",         icon: Shield,        desc: "Infos du club" },
  { label: "Amendes",       path: "/amendes",        icon: Banknote,      desc: "Cagnotte & amendes" },
  { label: "Admin",         path: "/admin",          icon: Settings,      desc: "Paramètres avancés" },
];

export default function MorePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-t-primary leading-none" style={{ fontSize: "var(--text-h1)" }}>
          PLUS
        </h1>
        <p className="text-t-secondary font-ui text-[var(--text-small)] mt-2">
          Toutes les sections
        </p>
      </div>

      <div className="bg-bg-surface-1 border border-b-subtle rounded-xl overflow-hidden">
        {sections.map((s, i) => (
          <Link
            key={s.path}
            to={s.path}
            className={`flex items-center gap-4 px-4 py-4 hover:bg-bg-surface-2 transition-colors ${
              i < sections.length - 1 ? "border-b border-b-subtle" : ""
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-bg-surface-2 flex items-center justify-center shrink-0">
              <s.icon className="h-5 w-5 text-t-secondary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-ui text-[14px] text-t-primary">{s.label}</p>
              <p className="font-ui text-[12px] text-t-muted mt-0.5">{s.desc}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-t-muted shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
