import { auth } from '@/lib/auth/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  const { data: session } = await auth.getSession();
  if (!session) return new Response('Unauthorized', { status: 401 });

  const rows = await sql`
    SELECT * FROM patients ORDER BY last_name, first_name
  `;
  return Response.json(rows);
}

export async function POST(req: Request) {
  const { data: session } = await auth.getSession();
  if (!session) return new Response('Unauthorized', { status: 401 });

  try {
    const { firstName, lastName, dob, gender, phone, email, address, notes, smoker, insurance } = await req.json();

    const [row] = await sql`
      INSERT INTO patients (first_name, last_name, dob, gender, phone, email, address, notes, smoker, insurance)
      VALUES (${firstName}, ${lastName}, ${dob}, ${gender}, ${phone}, ${email}, ${address}, ${notes}, ${smoker}, ${insurance})
      RETURNING *
    `;

    return Response.json(row);
  } catch (err) {
    console.error('DB error:', err);
    return new Response(String(err), { status: 500 });
  }
}