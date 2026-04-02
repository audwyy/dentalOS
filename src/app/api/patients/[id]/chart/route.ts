// app/api/patients/[id]/chart/route.ts
import { auth } from '@/lib/auth/server';
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL!);

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { data: session } = await auth.getSession();
  if (!session) return new Response('Unauthorized', { status: 401 });
  const { id } = await params;

  const rows = await sql`
    SELECT * FROM tooth_chart WHERE patient_id = ${id}
  `;
  return Response.json(rows);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { data: session } = await auth.getSession();
  if (!session) return new Response('Unauthorized', { status: 401 });
  const { id } = await params;

  const { toothNumber, surface, condition } = await req.json();

  if (condition === null) {
    // Clear this surface
    await sql`
      DELETE FROM tooth_chart
      WHERE patient_id = ${id} AND tooth_number = ${toothNumber} AND surface = ${surface}
    `;
    return Response.json({ ok: true });
  }

  const [row] = await sql`
    INSERT INTO tooth_chart (patient_id, tooth_number, surface, condition)
    VALUES (${id}, ${toothNumber}, ${surface}, ${condition})
    ON CONFLICT (patient_id, tooth_number, surface)
    DO UPDATE SET condition = ${condition}, updated_at = now()
    RETURNING *
  `;
  return Response.json(row);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { data: session } = await auth.getSession();
  if (!session) return new Response('Unauthorized', { status: 401 });
  const { id } = await params;
  const { toothNumber } = await req.json();

  await sql`
    DELETE FROM tooth_chart WHERE patient_id = ${id} AND tooth_number = ${toothNumber}
  `;
  return Response.json({ ok: true });
}