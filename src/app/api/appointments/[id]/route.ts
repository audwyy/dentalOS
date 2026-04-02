import { auth } from '@/lib/auth/server';
import { neon } from '@neondatabase/serverless';
import { NextRequest } from "next/server";

const sql = neon(process.env.DATABASE_URL!);

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { data: session } = await auth.getSession();
  if (!session) return new Response('Unauthorized', { status: 401 });

  const { id } = await context.params;
  const { startTime, duration } = await req.json();

  const [row] = await sql`
    UPDATE appointments 
    SET start_time = ${startTime}, duration = ${duration}
    WHERE id = ${id} 
    RETURNING *
  `;

  return Response.json(row);
}

export async function DELETE(
  _: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { data: session } = await auth.getSession();
  if (!session) return new Response('Unauthorized', { status: 401 });

  const { id } = await context.params;

  await sql`DELETE FROM appointments WHERE id = ${id}`;
  console.log("hello");
  return new Response('ok');
}