// app/api/invoices/[invoiceId]/route.ts
import { auth } from '@/lib/auth/server';
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL!);

export async function PATCH(req: Request, { params }: { params: Promise<{ invoiceId: string }> }) {
  const { data: session } = await auth.getSession();
  if (!session) return new Response('Unauthorized', { status: 401 });
  const { invoiceId } = await params;
  const body = await req.json();
  const { status, dueDate, issuedAt, medicareRebate, dvaRebate, notes } = body;

  const [invoice] = await sql`
    UPDATE invoices SET
      status          = COALESCE(${status ?? null}, status),
      due_date        = COALESCE(${dueDate ?? null}, due_date),
      issued_at       = COALESCE(${issuedAt ?? null}::timestamptz, issued_at),
      medicare_rebate = COALESCE(${medicareRebate ?? null}, medicare_rebate),
      dva_rebate      = COALESCE(${dvaRebate ?? null}, dva_rebate),
      notes           = COALESCE(${notes ?? null}, notes)
    WHERE id = ${invoiceId}
    RETURNING *
  `;
  return Response.json(invoice);
}

export async function GET(_req: Request, { params }: { params: Promise<{ invoiceId: string }> }) {
  const { data: session } = await auth.getSession();
  if (!session) return new Response('Unauthorized', { status: 401 });
  const { invoiceId } = await params;

  const [invoice] = await sql`
    SELECT i.*, tv.visit_number, tv.visit_date, p.first_name, p.last_name, p.email, p.phone, p.address, p.dob
    FROM invoices i
    LEFT JOIN treatment_visits tv ON tv.id = i.visit_id
    LEFT JOIN patients p ON p.id = i.patient_id
    WHERE i.id = ${invoiceId}
  `;
  const items = await sql`SELECT * FROM invoice_items WHERE invoice_id = ${invoiceId}`;

  return Response.json({ invoice, items });
}