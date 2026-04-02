import { auth } from '@/lib/auth/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  const { data: session } = await auth.getSession();
  if (!session) return new Response('Unauthorized', { status: 401 });

  const rows = await sql`
    SELECT 
      a.*,
      p_patient.first_name || ' ' || p_patient.last_name AS patient_name,
      prof.name AS dentist_name
    FROM appointments a
    JOIN patients p_patient ON p_patient.id = a.patient_id
    JOIN profiles prof ON prof.id = a.dentist_id
    ORDER BY a.start_time
  `;
  return Response.json(rows);
}

export async function POST(req: Request) {
  const { data: session } = await auth.getSession();
  if (!session) return new Response('Unauthorized', { status: 401 });

  try {
    const { patientId, dentistId, startTime, duration, type, notes } = await req.json();
    console.log('Inserting appointment:', { patientId, dentistId, startTime, duration, type, notes });

    const [row] = await sql`
      INSERT INTO appointments (patient_id, dentist_id, start_time, duration, appointment_type, notes)
      VALUES (${patientId}, ${dentistId}, ${startTime}, ${duration}, ${type}, ${notes})
      RETURNING *
    `;

    return Response.json(row);
  } catch (err) {
    console.error('DB error:', err);
    return new Response(String(err), { status: 500 });
  }
}