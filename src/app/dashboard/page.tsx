import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/profile";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const { data: session } = await auth.getSession();
  const profile = await getProfile();

  if (!session) redirect("/");
  if (!profile || !profile.role || profile.role === "user")
    redirect("/onboarding");

  return (
    <DashboardClient
      userName={session.user.name || "User"}
      profileId={session.user.id}
    />
  );
}
