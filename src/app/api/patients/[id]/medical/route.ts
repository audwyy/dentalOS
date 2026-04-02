// app/api/patients/[id]/medical/route.ts
import { auth } from '@/lib/auth/server';
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL!);

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { data: session } = await auth.getSession();
  if (!session) return new Response('Unauthorized', { status: 401 });
  const { id } = await params;
  const rows = await sql`SELECT * FROM patient_medical WHERE patient_id = ${id}`;
  return Response.json(rows);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { data: session } = await auth.getSession();
  if (!session) return new Response('Unauthorized', { status: 401 });
  const { id } = await params;
  const { system, condition, checked, notes } = await req.json();
  const [row] = await sql`
    INSERT INTO patient_medical (patient_id, system, condition, checked, notes)
    VALUES (${id}, ${system}, ${condition}, ${checked}, ${notes})
    ON CONFLICT DO NOTHING
    RETURNING *
  `;
  return Response.json(row);
}

export async function PATCH(req: Request) {
  const { data: session } = await auth.getSession();
  if (!session) return new Response('Unauthorized', { status: 401 });
  const { id, checked, notes } = await req.json();
  const [row] = await sql`
    UPDATE patient_medical SET checked = ${checked}, notes = ${notes} WHERE id = ${id} RETURNING *
  `;
  return Response.json(row);
}