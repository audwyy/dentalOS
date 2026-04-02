// app/api/treatment/items/route.ts
import { auth } from '@/lib/auth/server';
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL!);

export async function POST(req: Request) {
  const { data: session } = await auth.getSession();
  if (!session) return new Response('Unauthorized', { status: 401 });
  const { visitId, patientId, code, name, price, toothNumber, sortOrder } = await req.json();

  const [item] = await sql`
    INSERT INTO treatment_items (visit_id, patient_id, code, name, price, tooth_number, sort_order)
    VALUES (${visitId}, ${patientId}, ${code}, ${name}, ${price}, ${toothNumber ?? null}, ${sortOrder ?? 0})
    RETURNING *
  `;
  return Response.json(item);
}

export async function PATCH(req: Request) {
  const { data: session } = await auth.getSession();
  if (!session) return new Response('Unauthorized', { status: 401 });
  const { id, toothNumber, sortOrder, visitId } = await req.json();

  const [item] = await sql`
    UPDATE treatment_items SET
      tooth_number = COALESCE(${toothNumber ?? null}, tooth_number),
      sort_order   = COALESCE(${sortOrder ?? null}, sort_order),
      visit_id     = COALESCE(${visitId ?? null}, visit_id)
    WHERE id = ${id}
    RETURNING *
  `;
  return Response.json(item);
}

export async function DELETE(req: Request) {
  const { data: session } = await auth.getSession();
  if (!session) return new Response('Unauthorized', { status: 401 });
  const { id } = await req.json();
  await sql`DELETE FROM treatment_items WHERE id = ${id}`;
  return Response.json({ ok: true });
}