import { auth } from '@/lib/auth/server';
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL!);

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { data: session } = await auth.getSession();
  if (!session) return new Response('Unauthorized', { status: 401 });
  const { id } = await params;
  const body = await req.json();
 
  const { insurance, firstName, lastName, phone, email, address, dob, gender, smoker, notes } = body;
 
  const [row] = await sql`
    UPDATE patients SET
      insurance = COALESCE(${insurance ?? null}, insurance),
      first_name = COALESCE(${firstName ?? null}, first_name),
      last_name = COALESCE(${lastName ?? null}, last_name),
      phone = COALESCE(${phone ?? null}, phone),
      email = COALESCE(${email ?? null}, email),
      address = COALESCE(${address ?? null}, address),
      dob = COALESCE(${dob ?? null}, dob),
      gender = COALESCE(${gender ?? null}, gender),
      smoker = COALESCE(${smoker ?? null}, smoker),
      notes = COALESCE(${notes ?? null}, notes)
    WHERE id = ${id}
    RETURNING *
  `;
  return Response.json(row);
}
 
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { data: session } = await auth.getSession();
  if (!session) return new Response('Unauthorized', { status: 401 });
  const { id } = await params;
  const [patient] = await sql`SELECT * FROM patients WHERE id = ${id}`;
  if (!patient) return new Response('Not found', { status: 404 });
  return Response.json(patient);
}