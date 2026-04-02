// app/api/patients/[id]/invoices/route.ts
import { auth } from '@/lib/auth/server';
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL!);

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { data: session } = await auth.getSession();
  if (!session) return new Response('Unauthorized', { status: 401 });
  const { id } = await params;

  const invoices = await sql`
    SELECT 
      i.*,
      tv.visit_number,
      tv.visit_date
    FROM invoices i
    LEFT JOIN treatment_visits tv ON tv.id = i.visit_id
    WHERE i.patient_id = ${id}
    ORDER BY i.created_at DESC
  `;

  const invoiceIds = invoices.map((i: any) => i.id);
  let items: any[] = [];
  if (invoiceIds.length > 0) {
    items = await sql`
      SELECT * FROM invoice_items WHERE invoice_id = ANY(${invoiceIds}::uuid[])
    `;
  }

  return Response.json({ invoices, items });
}