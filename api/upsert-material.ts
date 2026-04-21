import {
  parseJsonBody,
  requireAuthorizedRole,
  setCorsHeaders,
  type VercelRequest,
  type VercelResponse,
} from './supabase-server.js';

type MaterialPayload = {
  id: string;
  title: string;
  summary: string;
  body: string;
  countryCode: string;
  stage: string;
  level: string;
  subject: string;
  category: string;
  resourceType: string;
  attachmentName?: string;
  attachmentData?: string;
  videoUrl?: string;
  questionLimit?: number;
  questions?: unknown[];
  uploadedBy: string;
  uploadedByEmail?: string;
  createdAt: string;
  updatedAt?: string;
  approvalStatus?: 'pending' | 'approved' | 'denied';
  aiReviewSummary?: string;
  adminReviewNote?: string;
  reviewedAt?: string;
  reviewedBy?: string;
};

function decodeDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) return null;

  return {
    contentType: match[1],
    bytes: Buffer.from(match[2], 'base64'),
  };
}

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

  const authResult = await requireAuthorizedRole(req, ['admin', 'staff']);
  if ('error' in authResult) {
    res.status(403).json({ error: authResult.error });
    return;
  }

  const payload = parseJsonBody<MaterialPayload>(req.body);
  if (!payload) {
    res.status(400).json({ error: 'Invalid material payload.' });
    return;
  }

  const { supabaseAdmin, profile } = authResult;
  let attachmentName = payload.attachmentName ?? null;
  let attachmentData = payload.attachmentData ?? null;

  if (payload.resourceType === 'document' && attachmentData?.startsWith('data:')) {
    const decoded = decodeDataUrl(attachmentData);
    if (!decoded) {
      res.status(400).json({ error: 'That document could not be read. Please pick it again.' });
      return;
    }

    if (decoded.bytes.byteLength > 5 * 1024 * 1024) {
      res.status(400).json({ error: 'Please keep uploaded files under 5 MB for now.' });
      return;
    }

    await supabaseAdmin.storage.createBucket('staff-materials', {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024,
      allowedMimeTypes: [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
      ],
    }).catch(() => undefined);

    const safeName = (attachmentName || 'material.file').replace(/[^a-zA-Z0-9._-]+/g, '-');
    const objectPath = `${payload.countryCode}/${payload.stage}/${payload.level}/${payload.subject}/${payload.id}-${safeName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('staff-materials')
      .upload(objectPath, decoded.bytes, {
        contentType: decoded.contentType,
        upsert: true,
      });

    if (uploadError) {
      res.status(400).json({
        error: uploadError.message ?? 'We could not upload that document just now.',
      });
      return;
    }

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from('staff-materials').getPublicUrl(objectPath);

    attachmentData = publicUrl;
  }

  const normalizedUploadedByEmail = (payload.uploadedByEmail ?? profile.email).trim().toLowerCase();
  const isAdmin = profile.role === 'admin';

  const row = {
    id: payload.id,
    title: payload.title,
    summary: payload.summary,
    body: payload.body,
    country_code: payload.countryCode,
    stage: payload.stage,
    level: payload.level,
    subject: payload.subject,
    category: payload.category,
    resource_type: payload.resourceType,
    attachment_name: attachmentName,
    attachment_data: attachmentData,
    video_url: payload.videoUrl ?? null,
    question_limit: payload.questionLimit ?? null,
    questions: payload.questions ?? [],
    uploaded_by: payload.uploadedBy,
    uploaded_by_email: normalizedUploadedByEmail,
    created_at: payload.createdAt,
    updated_at: payload.updatedAt ?? payload.createdAt,
    approval_status: isAdmin ? (payload.approvalStatus ?? 'approved') : 'pending',
    ai_review_summary: payload.aiReviewSummary ?? null,
    admin_review_note: isAdmin ? (payload.adminReviewNote ?? null) : 'Waiting for admin review.',
    reviewed_at: isAdmin ? (payload.reviewedAt ?? new Date().toISOString()) : null,
    reviewed_by: isAdmin ? (payload.reviewedBy ?? profile.email) : null,
  };

  const { data, error } = await supabaseAdmin
    .from('staff_materials')
    .upsert(row)
    .select('*')
    .single();

  if (error || !data) {
    res.status(400).json({ error: error?.message ?? 'We could not save that material just now.' });
    return;
  }

  res.status(200).json({ material: data });
}
