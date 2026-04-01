import { useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Zap,
  Users,
  BarChart3,
  Swords,
  Trophy,
  Shield,
  Dumbbell,
  Banknote,
  MessageSquare,
  Settings,
  Moon,
  Sun,
  LogOut,
  User,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import logoDark from "@/assets/tactik-symbol-dark.svg";
import logoLight from "@/assets/tactik-symbol-light.svg";

const mainNav = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Équipe", path: "/equipe", icon: Shield },
  { label: "Composition FUT", path: "/composition", icon: Zap },
  { label: "Joueurs", path: "/joueurs", icon: Users },
  { label: "Statistiques", path: "/statistiques", icon: BarChart3 },
  { label: "Calendrier", path: "/calendrier", icon: Swords },
  { label: "Classement", path: "/classement", icon: Trophy },
];

const secondaryNav = [
  { label: "Entraînements", path: "/entrainements", icon: Dumbbell },
  { label: "Amendes", path: "/amendes", icon: Banknote },
  { label: "Communication", path: "/communication", icon: MessageSquare },
];

const adminNav = [
  { label: "Admin", path: "/admin", icon: Settings },
];

interface NavItemProps {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
}

function NavItem({ label, path, icon: Icon, active }: NavItemProps) {
  return (
    <Link
      to={path}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-ui transition-all duration-150 cursor-pointer ${
        active
          ? "text-primary bg-primary-dim border border-primary-border"
          : "text-t-secondary hover:bg-bg-surface-3 hover:text-t-primary"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{label}</span>
    </Link>
  );
}

export function Sidebar() {
  const location = useLocation();
  const { theme, toggle } = useTheme();
  const { user, signOut } = useAuth();
  const currentPath = location.pathname;

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Coach";
  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-[220px] flex-col bg-bg-surface-1 border-r border-b-subtle z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5">
        <img
          src={theme === "dark" ? logoDark : logoLight}
          alt="Tactik"
          className="h-8 w-8 rounded-lg"
        />
        <span className="font-display text-[15px] text-t-primary tracking-wider">
          TACTIK
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-1">
        <p className="text-label px-3 pt-4 pb-2">Principal</p>
        {mainNav.map((item) => (
          <NavItem
            key={item.path}
            {...item}
            active={currentPath === item.path || (item.path === "/dashboard" && currentPath === "/")}
          />
        ))}

        <div className="my-3 border-t border-b-subtle" />

        <p className="text-label px-3 pt-2 pb-2">Gestion</p>
        {secondaryNav.map((item) => (
          <NavItem key={item.path} {...item} active={currentPath === item.path} />
        ))}

        <div className="my-3 border-t border-b-subtle" />

        {adminNav.map((item) => (
          <NavItem key={item.path} {...item} active={currentPath === item.path} />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 space-y-3">
        <button
          onClick={toggle}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-[13px] font-ui text-t-secondary hover:bg-bg-surface-3 hover:text-t-primary transition-all"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          <span>{theme === "dark" ? "Mode clair" : "Mode sombre"}</span>
        </button>

        {/* User profile card */}
        <div className="bg-bg-surface-2 border border-b-subtle rounded-lg p-3 space-y-3">
          <div className="flex items-center gap-2.5">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-primary-dim flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-ui text-[13px] text-t-primary truncate">{displayName}</p>
              <p className="font-ui text-[11px] text-t-secondary truncate">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={signOut}
            className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-[12px] font-ui text-t-secondary hover:bg-bg-surface-3 hover:text-danger transition-all cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Se déconnecter</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
