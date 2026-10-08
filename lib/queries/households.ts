import { createClient } from "@/lib/supabase/server";

const isDemo = () =>
  process.env.BRUNNEL_DEMO_MODE === "true" ||
  !process.env.NEXT_PUBLIC_SUPABASE_URL;

export interface AppUser {
  id: string;
  name: string;
  email: string;
  initials: string;
}

export interface HouseholdMember {
  id: string;
  name: string;
  email: string | null;
  initials: string;
  role: "admin";
}

export interface HouseholdSummary {
  id: string;
  name: string;
  members: HouseholdMember[];
}

export interface AppContext {
  user: AppUser;
  household: HouseholdSummary | null;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts.at(-1)?.[0] ?? ""}`.toUpperCase();
}

function fallbackName(email: string | undefined, metadata: unknown): string {
  if (typeof metadata === "string" && metadata.trim()) return metadata.trim();
  if (email?.includes("@")) return email.split("@", 1)[0];
  return "Usuário";
}

const demoContext: AppContext = {
  user: {
    id: "demo-user",
    name: "Gabriel",
    email: "gabriel@brunnel.local",
    initials: "GB",
  },
  household: {
    id: "demo-household",
    name: "Família Brunnel",
    members: [
      {
        id: "demo-user",
        name: "Gabriel",
        email: "gabriel@brunnel.local",
        initials: "GB",
        role: "admin",
      },
      {
        id: "demo-member",
        name: "Brunna",
        email: "brunna@brunnel.local",
        initials: "BR",
        role: "admin",
      },
    ],
  },
};

export async function getAppContext(): Promise<AppContext | null> {
  if (isDemo()) return demoContext;

  const supabase = await createClient();
  if (!supabase) return null;

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  const email = auth.user.email ?? "";
  const name = fallbackName(
    auth.user.email,
    auth.user.user_metadata?.display_name,
  );
  const user: AppUser = {
    id: auth.user.id,
    name,
    email,
    initials: initials(name),
  };

  const { data: membership } = await supabase
    .from("household_memberships")
    .select("household_id")
    .eq("user_id", auth.user.id)
    .eq("status", "active")
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!membership) return { user, household: null };

  const [{ data: household }, { data: memberships }] = await Promise.all([
    supabase
      .from("households")
      .select("id,name")
      .eq("id", membership.household_id)
      .maybeSingle(),
    supabase
      .from("household_memberships")
      .select("user_id,role,joined_at")
      .eq("household_id", membership.household_id)
      .eq("status", "active")
      .order("joined_at", { ascending: true }),
  ]);

  if (!household || !memberships?.length) return { user, household: null };

  const memberIds = memberships.map((item) => item.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id,display_name")
    .in("id", memberIds);
  const profileNames = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile.display_name]),
  );

  const members = memberships
    .map((item) => {
      const memberName =
        profileNames.get(item.user_id) ??
        (item.user_id === user.id ? user.name : "Membro da família");
      return {
        id: item.user_id,
        name: memberName,
        email: item.user_id === user.id ? user.email || null : null,
        initials: initials(memberName),
        role: item.role,
      } satisfies HouseholdMember;
    })
    .sort((left, right) => {
      if (left.id === user.id) return -1;
      if (right.id === user.id) return 1;
      return left.name.localeCompare(right.name, "pt-BR");
    });

  return {
    user,
    household: {
      id: household.id,
      name: household.name,
      members,
    },
  };
}

export function isDemoMode(): boolean {
  return isDemo();
}
