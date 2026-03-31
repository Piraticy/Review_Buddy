import type { AdminStaffMember, RegisteredUser } from '../data';
import { getCountryByCode } from '../data';
import { supabase } from './supabase';

const STORAGE_KEY = 'review-buddy-state';
const DEFAULT_ADMIN_EMAIL = 'admin@reviewbuddy.app';

type StoredState = {
  registeredUsers?: RegisteredUser[];
  staffMembers?: AdminStaffMember[];
};

function readStoredState(): StoredState {
  if (typeof window === 'undefined') {
    return {};
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return {};

  try {
    return JSON.parse(raw) as StoredState;
  } catch {
    return {};
  }
}

function mergeStoredState(next: StoredState) {
  if (typeof window === 'undefined') return;
  const current = readStoredState();
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...next }));
}

function mapProfileRow(row: Record<string, unknown>): RegisteredUser {
  return {
    id: String(row.id ?? ''),
    username: String(row.username ?? ''),
    fullName: String(row.full_name ?? ''),
    email: String(row.email ?? ''),
    password: '',
    role: (row.role as RegisteredUser['role']) ?? 'student',
    gender: (row.gender as RegisteredUser['gender']) ?? 'boy',
    avatarMode: (row.avatar_mode as RegisteredUser['avatarMode']) ?? 'generated',
    avatarEmoji: String(row.avatar_emoji ?? '🙂'),
    avatarImage: row.avatar_image ? String(row.avatar_image) : undefined,
    countryCode: String(row.country_code ?? 'KE'),
    plan: (row.plan as RegisteredUser['plan']) ?? 'free',
    stage: (row.stage as RegisteredUser['stage']) ?? 'primary',
    level: String(row.level ?? 'Grade 1'),
    mode: (row.mode as RegisteredUser['mode']) ?? 'solo',
    subject: String(row.subject ?? 'Mathematics'),
    createdAt: String(row.created_at ?? new Date().toISOString()),
    lastLoginAt: row.last_login_at ? String(row.last_login_at) : undefined,
  };
}

function mapStaffRow(row: Record<string, unknown>): AdminStaffMember {
  return {
    id: row.id ? String(row.id) : undefined,
    name: String(row.name ?? ''),
    role: String(row.role ?? ''),
    focus: String(row.focus ?? ''),
    status: String(row.status ?? 'Online'),
    countryCode: row.country_code ? String(row.country_code) : undefined,
  };
}

async function registerLearner(user: RegisteredUser) {
  if (!supabase) {
    const localUsers = readStoredState().registeredUsers ?? [];
    mergeStoredState({ registeredUsers: [...localUsers, user] });
    return user;
  }

  const { data, error } = await supabase.auth.signUp({
    email: user.email.toLowerCase(),
    password: user.password,
    options: {
      data: {
        full_name: user.fullName,
        username: user.username,
        role: user.role,
        country_code: user.countryCode,
      },
    },
  });

  if (error) {
    throw error;
  }

  const profileRow = {
    id: data.user?.id ?? user.id,
    username: user.username,
    full_name: user.fullName,
    email: user.email.toLowerCase(),
    role: user.role,
    gender: user.gender,
    avatar_mode: user.avatarMode,
    avatar_emoji: user.avatarEmoji,
    avatar_image: user.avatarImage ?? null,
    country_code: user.countryCode,
    plan: user.plan,
    stage: user.stage,
    level: user.level,
    mode: user.mode,
    subject: user.subject,
    created_at: user.createdAt,
    last_login_at: user.lastLoginAt ?? new Date().toISOString(),
  };

  const { error: upsertError } = await supabase.from('learner_profiles').upsert(profileRow);
  if (upsertError) {
    throw upsertError;
  }

  return {
    ...user,
    id: String(profileRow.id),
    email: profileRow.email,
  };
}

async function signIn(identifier: string, password: string) {
  const normalizedIdentifier = identifier.trim();

  if (!supabase) {
    const localUsers = readStoredState().registeredUsers ?? [];
    const match = localUsers.find(
      (user) =>
        user.email.toLowerCase() === normalizedIdentifier.toLowerCase() ||
        user.username.toLowerCase() === normalizedIdentifier.toLowerCase(),
    );

    if (!match || match.password !== password) {
      return null;
    }

    const nextUser = {
      ...match,
      lastLoginAt: new Date().toISOString(),
    };

    mergeStoredState({
      registeredUsers: localUsers.map((user) => (user.id === nextUser.id ? nextUser : user)),
    });

    return nextUser;
  }

  let email = normalizedIdentifier.toLowerCase();

  if (email === 'admin') {
    email = DEFAULT_ADMIN_EMAIL;
  }

  if (!email.includes('@')) {
    const { data: usernameRow } = await supabase
      .from('learner_profiles')
      .select('email')
      .eq('username', email)
      .limit(1)
      .maybeSingle();

    if (usernameRow?.email) {
      email = String(usernameRow.email).toLowerCase();
    }
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return null;
  }

  const { data: profileRow, error: profileError } = await supabase
    .from('learner_profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (profileError || !profileRow) {
    return null;
  }

  const nextUser = mapProfileRow(profileRow);
  await supabase
    .from('learner_profiles')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', nextUser.id);

  return {
    ...nextUser,
    lastLoginAt: new Date().toISOString(),
  };
}

async function listRegisteredUsers() {
  if (!supabase) {
    return (readStoredState().registeredUsers ?? []).filter((user) => user.role === 'student');
  }

  const { data, error } = await supabase
    .from('learner_profiles')
    .select('*')
    .eq('role', 'student')
    .order('created_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((row) => mapProfileRow(row));
}

async function listStaffMembers() {
  if (!supabase) {
    return readStoredState().staffMembers ?? [];
  }

  const { data, error } = await supabase
    .from('staff_members')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((row) => mapStaffRow(row));
}

async function addStaffMember(member: AdminStaffMember) {
  if (!supabase) {
    const localStaff = readStoredState().staffMembers ?? [];
    const nextMember = {
      ...member,
      id: member.id ?? `staff-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    };
    mergeStoredState({ staffMembers: [...localStaff, nextMember] });
    return nextMember;
  }

  const insertRow = {
    name: member.name,
    role: member.role,
    focus: member.focus,
    status: member.status,
    country_code: member.countryCode ?? null,
  };

  const { data, error } = await supabase.from('staff_members').insert(insertRow).select('*').single();
  if (error || !data) {
    throw error;
  }

  return mapStaffRow(data);
}

async function removeStaffMember(memberIdOrName: string) {
  if (!supabase) {
    const localStaff = readStoredState().staffMembers ?? [];
    mergeStoredState({
      staffMembers: localStaff.filter((member) => member.id !== memberIdOrName && member.name !== memberIdOrName),
    });
    return;
  }

  const { data } = await supabase
    .from('staff_members')
    .select('id')
    .or(`id.eq.${memberIdOrName},name.eq.${memberIdOrName}`)
    .limit(1)
    .maybeSingle();

  if (!data?.id) return;

  await supabase.from('staff_members').delete().eq('id', data.id);
}

async function removeRegisteredLearner(userId: string) {
  if (!supabase) {
    const localUsers = readStoredState().registeredUsers ?? [];
    mergeStoredState({
      registeredUsers: localUsers.filter((entry) => entry.id !== userId),
    });
    return;
  }

  await supabase.from('learner_profiles').delete().eq('id', userId);
}

function buildCountrySummary(users: RegisteredUser[]) {
  return users.reduce<Record<string, { learners: number; families: number }>>((summary, user) => {
    const existing = summary[user.countryCode] ?? { learners: 0, families: 0 };
    const nextLearners = existing.learners + 1;

    summary[user.countryCode] = {
      learners: nextLearners,
      families: Math.max(1, Math.ceil(nextLearners * 0.6)),
    };

    return summary;
  }, {});
}

function countryLeadFor(code: string, staffMembers: AdminStaffMember[]) {
  const country = getCountryByCode(code);
  const match = staffMembers.find((member) => member.countryCode === code || member.focus.includes(country.name));
  return match?.name ?? 'Waiting for staff assignment';
}

async function listCountryRegistrations() {
  const [users, staff] = await Promise.all([listRegisteredUsers(), listStaffMembers()]);
  const summary = buildCountrySummary(users);

  return Object.entries(summary).map(([code, values]) => ({
    code,
    learners: values.learners,
    families: values.families,
    staffLead: countryLeadFor(code, staff),
  }));
}

export const appRepository = {
  registerLearner,
  signIn,
  listRegisteredUsers,
  listStaffMembers,
  addStaffMember,
  removeStaffMember,
  removeRegisteredLearner,
  listCountryRegistrations,
};
