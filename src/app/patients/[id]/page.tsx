import { notFound } from "next/navigation";
import { getPatientById, getAppointmentsByPatientId } from "../../../lib/auth/profile";
import PatientProfilePage from "../[id]/PatientProfilePage";

export default async function PatientPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const patient = await getPatientById(id);
    if (!patient) notFound();
  
    const appointments = await getAppointmentsByPatientId(id);

    console.log("APOIOSFOISDUFPDSF", appointments)
  
    return <PatientProfilePage patient={patient} appointments={appointments} />;
  }