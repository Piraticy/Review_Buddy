import {
  parseJsonBody,
  requireAuthorizedRole,
  setCorsHeaders,
  type VercelRequest,
  type VercelResponse,
} from './supabase-server.js';

type DeleteFeedbackPayload = {
  feedbackId?: string;
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

  const payload = parseJsonBody<DeleteFeedbackPayload>(req.body) ?? {};
  const feedbackId = payload.feedbackId?.trim();

  if (!feedbackId) {
    res.status(400).json({ error: 'Feedback id is required.' });
    return;
  }

  const { error } = await authResult.supabaseAdmin.from('feedback_entries').delete().eq('id', feedbackId);

  if (error) {
    res.status(400).json({ error: error.message ?? 'We could not remove that feedback just now.' });
    return;
  }

  res.status(200).json({ ok: true });
}
