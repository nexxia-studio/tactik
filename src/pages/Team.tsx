import { Shield, Mail, Phone, MapPin, Calendar, Trophy, Users, Star } from "lucide-react";

/* ─── Mock types matching Supabase schema ─── */

interface Organization {
  id: string;
  name: string;
  logo_url: string | null;
  created_by: string;
  created_at: string;
}

interface Season {
  id: string;
  organization_id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface Team {
  id: string;
  organization_id: string;
  name: string;
  season: string;
  created_at: string;
}

interface Coach {
  id: string;
  team_id: string;
  first_name: string;
  last_name: string;
  role: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
}

interface TeamMember {
  id: string;
  team_id: string;
  first_name: string;
  last_name: string;
  role: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
}

/* ─── Hardcoded mock data ─── */

const mockOrganization: Organization = {
  id: "org-1",
  name: "RFC Xhoffraix",
  logo_url: null,
  created_by: "user-1",
  created_at: "2024-09-01T00:00:00Z",
};

const mockSeason: Season = {
  id: "season-1",
  organization_id: "org-1",
  name: "2024-2025",
  start_date: "2024-08-15",
  end_date: "2025-06-30",
  is_active: true,
};

const mockTeam: Team = {
  id: "team-1",
  organization_id: "org-1",
  name: "Équipe Première",
  season: "2024-2025",
  created_at: "2024-09-01T00:00:00Z",
};

const mockCoaches: Coach[] = [
  {
    id: "coach-1",
    team_id: "team-1",
    first_name: "Laurent",
    last_name: "Dupont",
    role: "Entraîneur principal",
    email: "laurent.dupont@club.be",
    phone: "+32 479 123 456",
    avatar_url: null,
  },
  {
    id: "coach-2",
    team_id: "team-1",
    first_name: "Marc",
    last_name: "Henrotte",
    role: "Entraîneur adjoint",
    email: "marc.henrotte@club.be",
    phone: "+32 479 789 012",
    avatar_url: null,
  },
  {
    id: "coach-3",
    team_id: "team-1",
    first_name: "Pierre",
    last_name: "Lemaire",
    role: "Entraîneur des gardiens",
    email: null,
    phone: "+32 497 654 321",
    avatar_url: null,
  },
];

const mockTeamMembers: TeamMember[] = [
  {
    id: "tm-1",
    team_id: "team-1",
    first_name: "Jean-Claude",
    last_name: "Vandenberghe",
    role: "Président",
    email: "jc.vandenberghe@club.be",
    phone: "+32 475 111 222",
    avatar_url: null,
  },
  {
    id: "tm-2",
    team_id: "team-1",
    first_name: "Philippe",
    last_name: "Martin",
    role: "Délégué",
    email: "p.martin@club.be",
    phone: "+32 496 333 444",
    avatar_url: null,
  },
  {
    id: "tm-3",
    team_id: "team-1",
    first_name: "Nicolas",
    last_name: "Fagnoul",
    role: "Kinésithérapeute",
    email: null,
    phone: "+32 479 555 666",
    avatar_url: null,
  },
];

/* ─── Components ─── */

function StaffCard({ person, roleColor }: { person: Coach | TeamMember; roleColor: string }) {
  const initials = `${person.first_name[0]}${person.last_name[0]}`;
  return (
    <div className="bg-bg-surface-2 border border-b-subtle rounded-xl p-4 flex items-start gap-4 hover:border-primary-border transition-colors">
      {person.avatar_url ? (
        <img
          src={person.avatar_url}
          alt={`${person.first_name} ${person.last_name}`}
          className="h-12 w-12 rounded-full object-cover shrink-0"
        />
      ) : (
        <div className="h-12 w-12 rounded-full bg-bg-surface-3 flex items-center justify-center shrink-0">
          <span className="font-display text-[11px] text-t-secondary">{initials}</span>
        </div>
      )}
      <div className="flex-1 min-w-0 space-y-1">
        <p className="font-ui text-[14px] text-t-primary font-medium truncate">
          {person.first_name} {person.last_name}
        </p>
        <span
          className={`inline-block font-ui text-[10px] uppercase tracking-[0.12em] font-semibold px-2 py-0.5 rounded-md ${roleColor}`}
        >
          {person.role}
        </span>
        <div className="flex flex-col gap-0.5 mt-2">
          {person.email && (
            <a
              href={`mailto:${person.email}`}
              className="font-ui text-[12px] text-t-secondary hover:text-primary transition-colors flex items-center gap-1.5 truncate"
            >
              <Mail className="h-3 w-3 shrink-0" /> {person.email}
            </a>
          )}
          {person.phone && (
            <a
              href={`tel:${person.phone}`}
              className="font-ui text-[12px] text-t-secondary hover:text-primary transition-colors flex items-center gap-1.5"
            >
              <Phone className="h-3 w-3 shrink-0" /> {person.phone}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TeamPage() {
  return (
    <div className="space-y-8 pb-24 lg:pb-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-[var(--text-h1)] text-t-primary uppercase tracking-wider leading-none">
          Équipe
        </h1>
        <p className="font-ui text-[var(--text-small)] text-t-secondary mt-1">
          Informations du club, saison et encadrement
        </p>
      </div>

      {/* Club info card */}
      <div className="bg-bg-surface-2 border border-b-subtle rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-4">
          {mockOrganization.logo_url ? (
            <img
              src={mockOrganization.logo_url}
              alt={mockOrganization.name}
              className="h-16 w-16 rounded-xl object-contain"
            />
          ) : (
            <div className="h-16 w-16 rounded-xl bg-primary-dim border border-primary-border flex items-center justify-center">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          )}
          <div>
            <h2 className="font-display text-[var(--text-h2)] text-t-primary uppercase tracking-wider leading-tight">
              {mockOrganization.name}
            </h2>
            <p className="font-ui text-[var(--text-small)] text-t-secondary mt-0.5">
              {mockTeam.name}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Calendar, label: "Saison", value: mockSeason.name },
            { icon: Trophy, label: "Division", value: "P2C Liège" },
            { icon: MapPin, label: "Terrain", value: "Xhoffraix" },
            { icon: Users, label: "Effectif", value: "18 joueurs" },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-bg-surface-1 border border-b-subtle rounded-xl p-3 space-y-1"
            >
              <div className="flex items-center gap-1.5">
                <item.icon className="h-3.5 w-3.5 text-t-muted" />
                <span className="font-ui text-[var(--text-micro)] uppercase tracking-[0.12em] text-t-muted">
                  {item.label}
                </span>
              </div>
              <p className="font-ui text-[var(--text-body)] text-t-primary font-medium">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Staff technique */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-primary" />
          <h3 className="font-display text-[var(--text-h3)] text-t-primary uppercase tracking-wider">
            Staff technique
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {mockCoaches.map((coach) => (
            <StaffCard
              key={coach.id}
              person={coach}
              roleColor="bg-primary-dim text-primary"
            />
          ))}
        </div>
      </section>

      {/* Encadrement */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <h3 className="font-display text-[var(--text-h3)] text-t-primary uppercase tracking-wider">
            Encadrement & dirigeants
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {mockTeamMembers.map((member) => (
            <StaffCard
              key={member.id}
              person={member}
              roleColor="bg-bg-surface-3 text-t-secondary"
            />
          ))}
        </div>
      </section>
    </div>
  );
}
