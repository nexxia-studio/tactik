import { useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Zap,
  Users,
  BarChart3,
  Calendar,
} from "lucide-react";

const items = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Compo", path: "/composition", icon: Zap },
  { label: "Joueurs", path: "/joueurs", icon: Users },
  { label: "Stats", path: "/statistiques", icon: BarChart3 },
  { label: "Agenda", path: "/calendrier", icon: Calendar },
];

export function BottomNav() {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-bg-surface-1/95 backdrop-blur-xl border-t border-b-subtle"
         style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="flex items-center justify-around h-16">
        {items.map((item) => {
          const active = currentPath === item.path || (item.path === "/dashboard" && currentPath === "/");
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 transition-all ${
                active ? "text-primary" : "text-t-muted"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {active && (
                <span className="text-[10px] font-ui tracking-wide uppercase">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
