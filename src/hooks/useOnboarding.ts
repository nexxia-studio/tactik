import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface OnboardingState {
  loading: boolean;
  onboardingCompleted: boolean;
  organizationId: string | null;
  refetch: () => Promise<void>;
}

export function useOnboarding(): OnboardingState {
  const { user, isReady } = useAuth();
  const [loading, setLoading] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  const fetchProfile = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("user_profiles")
      .select("onboarding_completed, organization_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      setOnboardingCompleted(data.onboarding_completed);
      setOrganizationId(data.organization_id);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!isReady) return;
    fetchProfile();
  }, [user, isReady]);

  return { loading, onboardingCompleted, organizationId, refetch: fetchProfile };
}
