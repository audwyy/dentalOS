// app/api/patients/[id]/allergies/route.ts
import { auth } from '@/lib/auth/server';
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL!);

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { data: session } = await auth.getSession();
  if (!session) return new Response('Unauthorized', { status: 401 });
  const { id } = await params;
  const rows = await sql`SELECT * FROM patient_allergies WHERE patient_id = ${id} ORDER BY created_at`;
  return Response.json(rows);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { data: session } = await auth.getSession();
  if (!session) return new Response('Unauthorized', { status: 401 });
  const { id } = await params;
  const { name } = await req.json();
  const [row] = await sql`
    INSERT INTO patient_allergies (patient_id, name) VALUES (${id}, ${name}) RETURNING *
  `;
  return Response.json(row);
}

export async function DELETE(req: Request) {
  const { data: session } = await auth.getSession();
  if (!session) return new Response('Unauthorized', { status: 401 });
  const { allergyId } = await req.json();
  await sql`DELETE FROM patient_allergies WHERE id = ${allergyId}`;
  return Response.json({ ok: true });
}