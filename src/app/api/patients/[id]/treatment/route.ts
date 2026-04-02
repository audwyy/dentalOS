// app/api/patients/[id]/treatment/route.ts
import { auth } from '@/lib/auth/server';
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL!);

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { data: session } = await auth.getSession();
  if (!session) return new Response('Unauthorized', { status: 401 });
  const { id } = await params;

  const visits = await sql`
    SELECT * FROM treatment_visits
    WHERE patient_id = ${id}
    ORDER BY visit_number ASC
  `;

  const items = await sql`
    SELECT * FROM treatment_items
    WHERE patient_id = ${id}
    ORDER BY visit_id, sort_order ASC
  `;

  return Response.json({ visits, items });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { data: session } = await auth.getSession();
  if (!session) return new Response('Unauthorized', { status: 401 });
  const { id } = await params;
  const { visitDate } = await req.json();

  // Get next visit number
  const [{ max }] = await sql`
    SELECT COALESCE(MAX(visit_number), 0) as max FROM treatment_visits WHERE patient_id = ${id}
  `;

  const [visit] = await sql`
    INSERT INTO treatment_visits (patient_id, visit_number, visit_date)
    VALUES (${id}, ${Number(max) + 1}, ${visitDate})
    RETURNING *
  `;

  return Response.json(visit);
}