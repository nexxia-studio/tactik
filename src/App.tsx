import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useOnboarding } from "@/hooks/useOnboarding";
import { AppLayout } from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Players from "@/pages/Players";
import Statistics from "@/pages/Statistics";
import CalendarPage from "@/pages/CalendarPage";
import Standings from "@/pages/Standings";
import Composition from "@/pages/Composition";
import TeamPage from "@/pages/Team";
import TrainingsPage from "@/pages/TrainingsPage";
import SessionDetailPage from "@/pages/SessionDetailPage";
import FinesPage from "@/pages/FinesPage";
import CommunicationPage from "@/pages/CommunicationPage";
import AdminPage from "@/pages/AdminPage";
import Auth from "@/pages/Auth";
import OnboardingClub from "@/pages/onboarding/OnboardingClub";
import OnboardingPlan from "@/pages/onboarding/OnboardingPlan";
import OnboardingTeam from "@/pages/onboarding/OnboardingTeam";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const { loading: obLoading, onboardingCompleted } = useOnboarding();

  if (loading || obLoading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return <Navigate to="/auth" replace />;
  if (!onboardingCompleted) return <Navigate to="/onboarding/club" replace />;
  return <>{children}</>;
}

function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/auth" element={<Auth />} />
            {/* Onboarding */}
            <Route path="/onboarding/club" element={<OnboardingRoute><OnboardingClub /></OnboardingRoute>} />
            <Route path="/onboarding/plan" element={<OnboardingRoute><OnboardingPlan /></OnboardingRoute>} />
            <Route path="/onboarding/equipe" element={<OnboardingRoute><OnboardingTeam /></OnboardingRoute>} />
            {/* Protected */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/joueurs"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Players />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/statistiques"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Statistics />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/calendrier"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <CalendarPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/classement"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Standings />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/composition"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Composition />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/equipe"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <TeamPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/entrainements"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <TrainingsPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/seance/:id"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <SessionDetailPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/amendes"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <FinesPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/communication"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <CommunicationPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <AdminPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
