import { Sidebar } from "@/components/Sidebar";
import { BottomNav } from "@/components/BottomNav";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-bg-base">
      <Sidebar />
      <BottomNav />

      {/* Main content area — offset by sidebar on desktop */}
      <main className="lg:ml-[220px] pb-20 lg:pb-0">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
