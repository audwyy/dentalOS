// app/api/ada-codes/route.ts
import { auth } from '@/lib/auth/server';
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  const { data: session } = await auth.getSession();
  if (!session) return new Response('Unauthorized', { status: 401 });
  const rows = await sql`SELECT * FROM ada_codes ORDER BY category, code`;
  return Response.json(rows);
}