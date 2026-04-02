import { auth } from '@/lib/auth/server';
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL!);

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { data: session } = await auth.getSession();
  if (!session) return new Response('Unauthorized', { status: 401 });
  const { startTime, duration } = await req.json();
  const [row] = await sql`
    UPDATE appointments SET start_time = ${startTime}, duration = ${duration}
    WHERE id = ${params.id} RETURNING *
  `;
  return Response.json(row);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const { data: session } = await auth.getSession();
  if (!session) return new Response('Unauthorized', { status: 401 });
  await sql`DELETE FROM appointments WHERE id = ${params.id}`;
  return new Response('ok');
}