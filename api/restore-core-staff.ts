import {
  listAuthUsersByEmail,
  requireAuthorizedRole,
  setCorsHeaders,
  writeLearnerProfileWithSchemaFallback,
  type VercelRequest,
  type VercelResponse,
} from './supabase-server.js';

const DEFAULT_STAFF_EMAIL = 'staff@reviewbuddy.app';
const DEFAULT_STAFF_PASSWORD = 'staff';
const DEFAULT_STAFF_ID = 'default-staff';
const DEFAULT_CREATED_AT = new Date('2026-03-31T00:00:00.000Z').toISOString();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(200).json({ ok: true });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const authResult = await requireAuthorizedRole(req, ['admin']);
  if ('error' in authResult) {
    res.status(403).json({ error: authResult.error });
    return;
  }

  const { supabaseAdmin } = authResult;
  const existingAuthUsers = await listAuthUsersByEmail(supabaseAdmin, DEFAULT_STAFF_EMAIL);
  const existingAuthUserId = existingAuthUsers[0]?.id;

  let staffUserId = existingAuthUserId;

  if (!staffUserId) {
    const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: DEFAULT_STAFF_EMAIL,
      password: DEFAULT_STAFF_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: 'Review Buddy Staff',
        username: 'Staff',
        role: 'staff',
        country_code: 'TZ',
      },
    });

    if (createError || !createdUser.user?.id) {
      res.status(400).json({ error: createError?.message ?? 'We could not restore the main Staff account.' });
      return;
    }

    staffUserId = createdUser.user.id;
  }

  await supabaseAdmin
    .from('learner_profiles')
    .delete()
    .eq('email', DEFAULT_STAFF_EMAIL)
    .neq('id', staffUserId);

  const profileRow = {
    id: staffUserId,
    username: 'Staff',
    full_name: 'Review Buddy Staff',
    email: DEFAULT_STAFF_EMAIL,
    role: 'staff',
    gender: 'girl',
    avatar_mode: 'generated',
    avatar_emoji: '🧑🏽‍🏫',
    avatar_image: null,
    country_code: 'TZ',
    plan: 'elite',
    stage: 'primary',
    level: 'Grade 4',
    mode: 'solo',
    subject: 'Communication Skills',
    qualifications: 'Curriculum coach',
    eligibility: 'Verified teacher',
    support_focus: 'Teacher support and review',
    tutorial_seen: true,
    created_at: DEFAULT_CREATED_AT,
    last_login_at: null,
  };

  const { error: profileError } = await writeLearnerProfileWithSchemaFallback(
    async (row) => await supabaseAdmin.from('learner_profiles').upsert(row),
    profileRow,
  );

  if (profileError) {
    res.status(400).json({ error: profileError.message ?? 'The main Staff profile could not be restored.' });
    return;
  }

  const { data: staffMember, error: staffError } = await supabaseAdmin
    .from('staff_members')
    .upsert({
      id: staffUserId,
      name: 'Review Buddy Staff',
      role: 'Learning mentor',
      focus: 'Teacher support and review · Tanzania',
      status: 'Ready to assign',
      country_code: 'TZ',
      email: DEFAULT_STAFF_EMAIL,
      username: 'Staff',
      qualifications: 'Curriculum coach',
      eligibility: 'Verified teacher',
      created_at: DEFAULT_CREATED_AT,
    })
    .select('*')
    .single();

  if (staffError || !staffMember) {
    res.status(400).json({ error: staffError?.message ?? 'The main Staff record could not be restored.' });
    return;
  }

  const { data: staffUser } = await supabaseAdmin
    .from('learner_profiles')
    .select('*')
    .eq('id', staffUserId)
    .single();

  res.status(200).json({
    ok: true,
    staffMember,
    staffUser: staffUser ?? profileRow,
    fallbackId: DEFAULT_STAFF_ID,
  });
}
