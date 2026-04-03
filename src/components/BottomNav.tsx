import { useLocation, Link } from "react-router-dom";
import { Home, UserCheck, Dumbbell, ClipboardList, Menu } from "lucide-react";

const items = [
  { label: "Dashboard",    path: "/dashboard",     icon: Home,          elevated: false },
  { label: "Présence",     path: "/presence",       icon: UserCheck,     elevated: false },
  { label: "Entraînement", path: "/entrainements",  icon: Dumbbell,      elevated: true  },
  { label: "Compo",        path: "/composition",    icon: ClipboardList, elevated: false },
  { label: "Plus",         path: "/plus",           icon: Menu,          elevated: false },
];

export function BottomNav() {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-bg-surface-1 border-t border-b-subtle"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-end justify-around h-16">
        {items.map((item) => {
          const active =
            currentPath === item.path ||
            (item.path === "/dashboard" && currentPath === "/");

          if (item.elevated) {
            return (
              <Link
                key={item.path}
                to={item.path}
                className="relative flex flex-col items-center flex-1"
                style={{ marginTop: "-18px" }}
              >
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg border-2 transition-colors ${
                    active
                      ? "bg-primary border-primary"
                      : "bg-bg-surface-2 border-b-subtle"
                  }`}
                >
                  <item.icon
                    className={`h-6 w-6 ${active ? "text-primary-text stroke-[2.2px]" : "text-t-secondary stroke-[1.8px]"}`}
                  />
                </div>
                <span
                  className={`text-[10px] font-ui tracking-wide leading-none mt-1 mb-1 ${
                    active ? "text-primary font-semibold" : "text-t-muted"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex flex-col items-center justify-center gap-1 flex-1 py-1.5 transition-colors ${
                active ? "text-primary" : "text-t-muted"
              }`}
            >
              <item.icon
                className={`h-[22px] w-[22px] ${active ? "stroke-[2.2px]" : "stroke-[1.8px]"}`}
              />
              <span
                className={`text-[10px] font-ui tracking-wide leading-none ${
                  active ? "font-semibold" : ""
                }`}
              >
                {item.label}
              </span>
              {active && (
                <div className="absolute bottom-0 w-6 h-[2px] bg-primary rounded-t-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
