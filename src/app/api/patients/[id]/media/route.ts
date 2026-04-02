// app/api/patients/[id]/media/route.ts
import { auth } from '@/lib/auth/server';
import { neon } from '@neondatabase/serverless';
import { put } from '@vercel/blob';

const sql = neon(process.env.DATABASE_URL!);

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { data: session } = await auth.getSession();
  if (!session) return new Response('Unauthorized', { status: 401 });
  const { id } = await params;

  const rows = await sql`
    SELECT m.*, tv.visit_number
    FROM patient_media m
    LEFT JOIN treatment_visits tv ON tv.id = m.visit_id
    WHERE m.patient_id = ${id}
    ORDER BY m.taken_date DESC, m.created_at DESC
  `;
  return Response.json(rows);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { data: session } = await auth.getSession();
  if (!session) return new Response('Unauthorized', { status: 401 });
  const { id } = await params;

  const formData = await req.formData();
  const file = formData.get('file') as File;
  const mediaType = formData.get('mediaType') as string;
  const takenDate = formData.get('takenDate') as string;
  const visitId = formData.get('visitId') as string | null;

  if (!file) return new Response('No file', { status: 400 });

  // Upload to Vercel Blob
  const blob = await put(`patients/${id}/${Date.now()}-${file.name}`, file, {
    access: 'public',
  });

  const [row] = await sql`
    INSERT INTO patient_media (patient_id, visit_id, url, filename, media_type, taken_date, size_bytes)
    VALUES (
      ${id},
      ${visitId || null},
      ${blob.url},
      ${file.name},
      ${mediaType},
      ${takenDate},
      ${file.size}
    )
    RETURNING *
  `;

  return Response.json(row);
}

export async function DELETE(req: Request) {
  const { data: session } = await auth.getSession();
  if (!session) return new Response('Unauthorized', { status: 401 });
  const { mediaId } = await req.json();
  await sql`DELETE FROM patient_media WHERE id = ${mediaId}`;
  return Response.json({ ok: true });
}