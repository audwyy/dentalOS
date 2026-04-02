import { auth } from "@/lib/auth/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function POST(req: Request) {
  const { data: session } = await auth.getSession();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { role, dob, gender } = await req.json();

  if (!role || !dob || !gender) {
    return new Response("Missing fields", { status: 400 });
  }

  await sql`
    INSERT INTO public.profiles (id, name, email, role, dob, gender)
    VALUES (
      ${session.user.id},
      ${session.user.name},
      ${session.user.email},
      ${role},
      ${dob},
      ${gender}
    )
    ON CONFLICT (id) DO UPDATE SET
      name = ${session.user.name},
      email = ${session.user.email},
      role = ${role},
      dob = ${dob},
      gender = ${gender}
  `;

  return new Response("ok");
}