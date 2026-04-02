import { auth } from "@/lib/auth/server";
import { AppointmentType } from "@/types";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function getProfile() {
  const { data: session } = await auth.getSession();

  if (!session) return null;

  const rows = await sql`
    SELECT * FROM public.profiles
    WHERE id = ${session.user.id}
  `;

  return rows[0] ?? null;
}

export async function getPatientById(id: string) {
  const { data: session } = await auth.getSession();
  if (!session) return null;

  const rows = await sql`SELECT * FROM patients WHERE id = ${id}`;
  if (!rows[0]) return null;

  const row = rows[0];
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    dob: row.dob,
    gender: row.gender,
    phone: row.phone,
    email: row.email,
    address: row.address,
    notes: row.notes,
    smoker: row.smoker,
    insurance: row.insurance,
    createdAt: row.created_at,
  };
}

export async function getAppointmentsByPatientId(patientId: string) {
  const { data: session } = await auth.getSession();
  if (!session) return [];
  const rows = await sql`
  SELECT 
    a.id,
    a.patient_id,
    a.dentist_id,
    a.start_time,
    a.duration,
    a.notes,
    a.appointment_type,
    p.first_name || ' ' || p.last_name AS patient_name,
    s.name AS dentist_name
  FROM appointments a
  JOIN patients p ON p.id = a.patient_id
  JOIN profiles s ON s.id = a.dentist_id
  WHERE a.patient_id = ${patientId}
  ORDER BY a.start_time
`;
return rows.map(row => ({
  id: row.id,
  patientId: row.patient_id,
  patientName: row.patient_name,
  dentistId: row.dentist_id,
  dentistName: row.dentist_name,
  startTime: row.start_time,
  duration: row.duration,
  type: row.appointment_type as AppointmentType,
  notes: row.notes,
}));
}