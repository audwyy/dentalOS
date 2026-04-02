import { auth } from '@/lib/auth/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  const { data: session } = await auth.getSession();
  if (!session) return new Response('Unauthorized', { status: 401 });

  const rows = await sql`
    SELECT * FROM profiles 
    WHERE role IN ('dentist', 'admin')
    ORDER BY name
  `;
  return Response.json(rows);
}