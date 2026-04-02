// app/api/media/[mediaId]/route.ts
import { auth } from '@/lib/auth/server';
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL!);

export async function PATCH(req: Request, { params }: { params: Promise<{ mediaId: string }> }) {
  const { data: session } = await auth.getSession();
  if (!session) return new Response('Unauthorized', { status: 401 });
  const { mediaId } = await params;
  const { takenDate, visitId, mediaType } = await req.json();

  const [row] = await sql`
    UPDATE patient_media SET
      taken_date = COALESCE(${takenDate ?? null}, taken_date),
      visit_id   = COALESCE(${visitId ?? null}::uuid, visit_id),
      media_type = COALESCE(${mediaType ?? null}, media_type)
    WHERE id = ${mediaId}
    RETURNING *
  `;
  return Response.json(row);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ mediaId: string }> }) {
  const { data: session } = await auth.getSession();
  if (!session) return new Response('Unauthorized', { status: 401 });
  const { mediaId } = await params;
  await sql`DELETE FROM patient_media WHERE id = ${mediaId}`;
  return Response.json({ ok: true });
}