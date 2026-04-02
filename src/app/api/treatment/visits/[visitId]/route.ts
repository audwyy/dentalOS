// app/api/treatment/visits/[visitId]/route.ts
import { auth } from '@/lib/auth/server';
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL!);

export async function PATCH(req: Request, { params }: { params: Promise<{ visitId: string }> }) {
  const { data: session } = await auth.getSession();
  if (!session) return new Response('Unauthorized', { status: 401 });
  const { visitId } = await params;
  const body = await req.json();

  // Update notes or completed status
  if (body.notes !== undefined) {
    const [visit] = await sql`
      UPDATE treatment_visits SET notes = ${body.notes} WHERE id = ${visitId} RETURNING *
    `;
    return Response.json(visit);
  }

  if (body.completed !== undefined) {
    if (body.completed) {
      // Auto-create invoice when completing
      const items = await sql`
        SELECT * FROM treatment_items WHERE visit_id = ${visitId}
      `;
      const total = items.reduce((sum: number, i: any) => sum + Number(i.price), 0);

      const [visit] = await sql`SELECT * FROM treatment_visits WHERE id = ${visitId}`;

      const [invoice] = await sql`
        INSERT INTO invoices (patient_id, visit_id, total, status)
        VALUES (${visit.patient_id}, ${visitId}, ${total}, 'unpaid')
        RETURNING *
      `;

      // Snapshot invoice items
      for (const item of items) {
        await sql`
          INSERT INTO invoice_items (invoice_id, code, name, tooth_number, price)
          VALUES (${invoice.id}, ${item.code}, ${item.name}, ${item.tooth_number}, ${item.price})
        `;
      }

      const [updated] = await sql`
        UPDATE treatment_visits
        SET completed = true, invoice_id = ${invoice.id}
        WHERE id = ${visitId}
        RETURNING *
      `;

      return Response.json({ visit: updated, invoice });
    } else {
      const [updated] = await sql`
        UPDATE treatment_visits SET completed = false WHERE id = ${visitId} RETURNING *
      `;
      return Response.json({ visit: updated });
    }
  }

  return new Response('Bad request', { status: 400 });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ visitId: string }> }) {
  const { data: session } = await auth.getSession();
  if (!session) return new Response('Unauthorized', { status: 401 });
  const { visitId } = await params;
  await sql`DELETE FROM treatment_visits WHERE id = ${visitId}`;
  return Response.json({ ok: true });
}


// ─── Items ────────────────────────────────────────────────────────────────────
// app/api/treatment/items/route.ts
export async function POST_ITEM(req: Request) {
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