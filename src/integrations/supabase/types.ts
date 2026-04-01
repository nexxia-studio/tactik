export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ── Enums ──────────────────────────────────────────────────────────────────
export type SportSlug = "football" | "rugby" | "basketball" | "volleyball"
export type UserRole = "player" | "coach" | "fine_manager" | "club_admin" | "super_admin"
export type MatchType = "championship" | "friendly" | "cup"
export type MatchStatus = "scheduled" | "in_progress" | "completed" | "cancelled" | "postponed"
export type MatchSource = "api" | "manual" | "friendly"
export type AttendanceStatus = "present" | "absent" | "excused" | "late"
export type TrainingPhase = "warmup" | "tactical" | "technical" | "scrimmage" | "cooldown"
export type DrillSourceType = "youtube" | "tiktok" | "manual" | "other"
export type SubscriptionPlan = "solo" | "club"
export type SubscriptionStatus = "active" | "cancelled" | "past_due" | "trialing"
export type FootPreference = "left" | "right" | "both"
export type ForumCategory = "friendly_matches" | "drills" | "transfers" | "general"

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      sports: {
        Row: {
          id: string
          name: string
          slug: SportSlug
          color_hex: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: SportSlug
          color_hex?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: SportSlug
          color_hex?: string
          created_at?: string
        }
        Relationships: []
      }
      seasons: {
        Row: {
          id: string
          label: string
          start_date: string
          end_date: string
          sport_slug: SportSlug
          is_current: boolean
          created_at: string
        }
        Insert: {
          id?: string
          label: string
          start_date: string
          end_date: string
          sport_slug: SportSlug
          is_current?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          label?: string
          start_date?: string
          end_date?: string
          sport_slug?: SportSlug
          is_current?: boolean
          created_at?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          id: string
          name: string
          short_name: string | null
          city: string | null
          logo_url: string | null
          sport_id: string | null
          division: string | null
          external_api_id: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          short_name?: string | null
          city?: string | null
          logo_url?: string | null
          sport_id?: string | null
          division?: string | null
          external_api_id?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          short_name?: string | null
          city?: string | null
          logo_url?: string | null
          sport_id?: string | null
          division?: string | null
          external_api_id?: string | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizations_sport_id_fkey"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "sports"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          id: string
          organization_id: string
          season_id: string | null
          name: string
          category: string | null
          external_api_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          season_id?: string | null
          name: string
          category?: string | null
          external_api_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          season_id?: string | null
          name?: string
          category?: string | null
          external_api_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          id: string
          user_id: string | null
          full_name: string
          nickname: string | null
          avatar_url: string | null
          birth_date: string | null
          position_preferred: string | null
          foot_preferred: FootPreference | null
          strengths_tags: Json
          weaknesses_tags: Json
          shirt_number: number | null
          height_cm: number | null
          weight_kg: number | null
          external_api_id: string | null
          is_claimed: boolean
          claimed_at: string | null
          xp_points: number
          level: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          full_name: string
          nickname?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          position_preferred?: string | null
          foot_preferred?: FootPreference | null
          strengths_tags?: Json
          weaknesses_tags?: Json
          shirt_number?: number | null
          height_cm?: number | null
          weight_kg?: number | null
          external_api_id?: string | null
          is_claimed?: boolean
          claimed_at?: string | null
          xp_points?: number
          level?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          full_name?: string
          nickname?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          position_preferred?: string | null
          foot_preferred?: FootPreference | null
          strengths_tags?: Json
          weaknesses_tags?: Json
          shirt_number?: number | null
          height_cm?: number | null
          weight_kg?: number | null
          external_api_id?: string | null
          is_claimed?: boolean
          claimed_at?: string | null
          xp_points?: number
          level?: number
          created_at?: string
        }
        Relationships: []
      }
      coaches: {
        Row: {
          id: string
          user_id: string | null
          full_name: string
          avatar_url: string | null
          license_level: string | null
          external_api_id: string | null
          is_claimed: boolean
          claimed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          full_name: string
          avatar_url?: string | null
          license_level?: string | null
          external_api_id?: string | null
          is_claimed?: boolean
          claimed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          full_name?: string
          avatar_url?: string | null
          license_level?: string | null
          external_api_id?: string | null
          is_claimed?: boolean
          claimed_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          id: string
          full_name: string | null
          role: UserRole
          player_id: string | null
          coach_id: string | null
          onboarding_completed: boolean
          organization_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          role?: UserRole
          player_id?: string | null
          coach_id?: string | null
          onboarding_completed?: boolean
          organization_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          role?: UserRole
          player_id?: string | null
          coach_id?: string | null
          onboarding_completed?: boolean
          organization_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          id: string
          team_id: string
          user_id: string | null
          player_id: string | null
          coach_id: string | null
          role: UserRole
          is_fine_manager: boolean
          joined_at: string
        }
        Insert: {
          id?: string
          team_id: string
          user_id?: string | null
          player_id?: string | null
          coach_id?: string | null
          role?: UserRole
          is_fine_manager?: boolean
          joined_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          user_id?: string | null
          player_id?: string | null
          coach_id?: string | null
          role?: UserRole
          is_fine_manager?: boolean
          joined_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          id: string
          team_id: string
          season_id: string
          opponent: string
          opponent_external_id: string | null
          match_date: string
          location: string | null
          is_home: boolean
          type: MatchType
          status: MatchStatus
          score_home: number | null
          score_away: number | null
          source: MatchSource
          is_manual_override: boolean
          override_reason: string | null
          external_api_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          team_id: string
          season_id: string
          opponent: string
          opponent_external_id?: string | null
          match_date: string
          location?: string | null
          is_home?: boolean
          type?: MatchType
          status?: MatchStatus
          score_home?: number | null
          score_away?: number | null
          source?: MatchSource
          is_manual_override?: boolean
          override_reason?: string | null
          external_api_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          season_id?: string
          opponent?: string
          opponent_external_id?: string | null
          match_date?: string
          location?: string | null
          is_home?: boolean
          type?: MatchType
          status?: MatchStatus
          score_home?: number | null
          score_away?: number | null
          source?: MatchSource
          is_manual_override?: boolean
          override_reason?: string | null
          external_api_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      match_stats: {
        Row: {
          id: string
          match_id: string
          player_id: string
          goals: number
          assists: number
          yellow_cards: number
          red_cards: number
          minutes_played: number
          rating: number | null
          source: MatchSource
          is_manual_override: boolean
          override_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          match_id: string
          player_id: string
          goals?: number
          assists?: number
          yellow_cards?: number
          red_cards?: number
          minutes_played?: number
          rating?: number | null
          source?: MatchSource
          is_manual_override?: boolean
          override_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          match_id?: string
          player_id?: string
          goals?: number
          assists?: number
          yellow_cards?: number
          red_cards?: number
          minutes_played?: number
          rating?: number | null
          source?: MatchSource
          is_manual_override?: boolean
          override_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      trainings: {
        Row: {
          id: string
          team_id: string
          season_id: string
          scheduled_at: string
          location: string | null
          status: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          team_id: string
          season_id: string
          scheduled_at: string
          location?: string | null
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          season_id?: string
          scheduled_at?: string
          location?: string | null
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      training_attendance: {
        Row: {
          id: string
          training_id: string
          player_id: string
          status: AttendanceStatus
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          training_id: string
          player_id: string
          status?: AttendanceStatus
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          training_id?: string
          player_id?: string
          status?: AttendanceStatus
          note?: string | null
          created_at?: string
        }
        Relationships: []
      }
      drills: {
        Row: {
          id: string
          coach_id: string
          title: string
          description: string | null
          source_url: string | null
          source_type: DrillSourceType
          is_public: boolean
          sport_slug: SportSlug
          thumbnail_url: string | null
          duration_minutes: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          coach_id: string
          title: string
          description?: string | null
          source_url?: string | null
          source_type?: DrillSourceType
          is_public?: boolean
          sport_slug?: SportSlug
          thumbnail_url?: string | null
          duration_minutes?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          coach_id?: string
          title?: string
          description?: string | null
          source_url?: string | null
          source_type?: DrillSourceType
          is_public?: boolean
          sport_slug?: SportSlug
          thumbnail_url?: string | null
          duration_minutes?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      fine_rules: {
        Row: {
          id: string
          team_id: string
          label: string
          amount: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          team_id: string
          label: string
          amount: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          label?: string
          amount?: number
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      fines: {
        Row: {
          id: string
          team_id: string
          player_id: string
          fine_rule_id: string | null
          created_by: string
          reason: string
          amount: number
          is_paid: boolean
          paid_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          team_id: string
          player_id: string
          fine_rule_id?: string | null
          created_by: string
          reason: string
          amount: number
          is_paid?: boolean
          paid_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          player_id?: string
          fine_rule_id?: string | null
          created_by?: string
          reason?: string
          amount?: number
          is_paid?: boolean
          paid_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      team_treasury: {
        Row: {
          id: string
          team_id: string
          total_collected: number
          total_spent: number
          season_goal: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          team_id: string
          total_collected?: number
          total_spent?: number
          season_goal?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          total_collected?: number
          total_spent?: number
          season_goal?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      treasury_expenses: {
        Row: {
          id: string
          team_id: string
          created_by: string
          label: string
          amount: number
          spent_at: string
          created_at: string
        }
        Insert: {
          id?: string
          team_id: string
          created_by: string
          label: string
          amount: number
          spent_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          created_by?: string
          label?: string
          amount?: number
          spent_at?: string
          created_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          id: string
          team_id: string
          title: string
          type: string
          scheduled_at: string
          location: string | null
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          team_id: string
          title: string
          type?: string
          scheduled_at: string
          location?: string | null
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          title?: string
          type?: string
          scheduled_at?: string
          location?: string | null
          description?: string | null
          created_at?: string
        }
        Relationships: []
      }
      forum_posts: {
        Row: {
          id: string
          user_id: string
          title: string
          body: string
          category: ForumCategory
          sport_slug: SportSlug
          metadata: Json
          is_pinned: boolean
          is_closed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          body: string
          category?: ForumCategory
          sport_slug?: SportSlug
          metadata?: Json
          is_pinned?: boolean
          is_closed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          body?: string
          category?: ForumCategory
          sport_slug?: SportSlug
          metadata?: Json
          is_pinned?: boolean
          is_closed?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          id: string
          organization_id: string
          plan: SubscriptionPlan
          status: SubscriptionStatus
          license_count: number
          licenses_used: number
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          current_period_start: string | null
          current_period_end: string | null
          cancelled_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          plan?: SubscriptionPlan
          status?: SubscriptionStatus
          license_count?: number
          licenses_used?: number
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          cancelled_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          plan?: SubscriptionPlan
          status?: SubscriptionStatus
          license_count?: number
          licenses_used?: number
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          cancelled_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: UserRole
      }
      is_team_member: {
        Args: { p_team_id: string }
        Returns: boolean
      }
      is_team_coach: {
        Args: { p_team_id: string }
        Returns: boolean
      }
      is_fine_manager: {
        Args: { p_team_id: string }
        Returns: boolean
      }
      is_club_admin: {
        Args: { p_organization_id: string }
        Returns: boolean
      }
    }
    Enums: {
      sport_slug: SportSlug
      user_role: UserRole
      match_type: MatchType
      match_status: MatchStatus
      match_source: MatchSource
      attendance_status: AttendanceStatus
      training_phase: TrainingPhase
      drill_source_type: DrillSourceType
      subscription_plan: SubscriptionPlan
      subscription_status: SubscriptionStatus
      foot_preference: FootPreference
      forum_category: ForumCategory
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      sport_slug: ["football", "rugby", "basketball", "volleyball"],
      user_role: ["player", "coach", "fine_manager", "club_admin", "super_admin"],
      match_type: ["championship", "friendly", "cup"],
      match_status: ["scheduled", "in_progress", "completed", "cancelled", "postponed"],
      match_source: ["api", "manual", "friendly"],
      attendance_status: ["present", "absent", "excused", "late"],
      training_phase: ["warmup", "tactical", "technical", "scrimmage", "cooldown"],
      drill_source_type: ["youtube", "tiktok", "manual", "other"],
      subscription_plan: ["solo", "club"],
      subscription_status: ["active", "cancelled", "past_due", "trialing"],
      foot_preference: ["left", "right", "both"],
      forum_category: ["friendly_matches", "drills", "transfers", "general"],
    },
  },
} as const
