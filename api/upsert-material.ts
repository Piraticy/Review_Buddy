import {
  parseJsonBody,
  requireAuthorizedRole,
  setCorsHeaders,
  type VercelRequest,
  type VercelResponse,
} from './_supabase.js';

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
  createdAt: string;
  updatedAt?: string;
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

  const { supabaseAdmin } = authResult;
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
    created_at: payload.createdAt,
    updated_at: payload.updatedAt ?? payload.createdAt,
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
