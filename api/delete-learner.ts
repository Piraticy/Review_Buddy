import {
  listAuthUsersByEmail,
  requireAuthorizedRole,
  setCorsHeaders,
  type VercelRequest,
  type VercelResponse,
} from './supabase-server.js';

type DeleteLearnerPayload = {
  learnerId?: string;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(200).json({ ok: true });
    return;
  }

  if (req.method !== 'POST' && req.method !== 'DELETE') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const authResult = await requireAuthorizedRole(req, ['admin']);
  if ('error' in authResult) {
    res.status(403).json({ error: authResult.error });
    return;
  }

  const payload =
    typeof req.body === 'string'
      ? (JSON.parse(req.body) as DeleteLearnerPayload)
      : ((req.body as DeleteLearnerPayload | undefined) ?? {});
  const learnerId = payload.learnerId?.trim();

  if (!learnerId) {
    res.status(400).json({ error: 'Learner id is required.' });
    return;
  }

  const { supabaseAdmin } = authResult;
  const { data: learner, error: learnerError } = await supabaseAdmin
    .from('learner_profiles')
    .select('id, role, email')
    .eq('id', learnerId)
    .maybeSingle();

  if (learnerError) {
    res.status(400).json({ error: learnerError.message ?? 'We could not find that learner.' });
    return;
  }

  if (!learner) {
    res.status(200).json({ ok: true });
    return;
  }

  if (learner.role !== 'student') {
    res.status(400).json({ error: 'Only learner accounts can be removed here.' });
    return;
  }

  const normalizedEmail = String(learner.email).toLowerCase();

  await supabaseAdmin
    .from('feedback_entries')
    .delete()
    .eq('user_key', `student:${normalizedEmail}`);
  await supabaseAdmin.from('learner_profiles').delete().eq('email', normalizedEmail);

  const authUsers = await listAuthUsersByEmail(supabaseAdmin, normalizedEmail);
  const authIds = Array.from(new Set([learnerId, ...authUsers.map((user) => user.id)]));

  await Promise.all(
    authIds.map(async (authId) => {
      await supabaseAdmin.auth.admin.deleteUser(authId).catch(() => undefined);
    }),
  );

  res.status(200).json({ ok: true });
}
