import { useLocation, Link } from "react-router-dom";
import { Home, UserCheck, Dumbbell, ClipboardList, MessageSquare } from "lucide-react";

const items = [
  { label: "Dashboard",     path: "/dashboard",     icon: Home },
  { label: "Présence",      path: "/joueurs",        icon: UserCheck },
  { label: "Entraînement",  path: "/entrainements",  icon: Dumbbell },
  { label: "Compo",         path: "/composition",    icon: ClipboardList },
  { label: "Messages",      path: "/communication",  icon: MessageSquare },
];

export function BottomNav() {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-bg-surface-1 border-t border-b-subtle"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-stretch justify-around h-16">
        {items.map((item) => {
          const active =
            currentPath === item.path ||
            (item.path === "/dashboard" && currentPath === "/");
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-colors ${
                active ? "text-primary" : "text-t-muted"
              }`}
            >
              <item.icon className={`h-[22px] w-[22px] ${active ? "stroke-[2.2px]" : "stroke-[1.8px]"}`} />
              <span className={`text-[10px] font-ui tracking-wide leading-none ${active ? "font-semibold" : ""}`}>
                {item.label}
              </span>
              {active && (
                <div className="absolute bottom-0 w-8 h-[2px] bg-primary rounded-t-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
