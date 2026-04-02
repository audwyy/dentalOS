"use client";

import { useState } from "react";
import {
  Appointment,
  AppointmentType,
  DURATION_OPTIONS,
  Patient,
} from "../../types";
import { Dentist } from "../../types";
import { X } from "lucide-react";

interface Props {
  onClose: () => void;
  onSave: (appt: Appointment) => void;
  defaultDate?: Date;
  defaultDentistId?: string;
  defaultPatientId?: string;
  dentists: Dentist[];
  patients: Patient[];
}

const APPT_TYPES: AppointmentType[] = [
  "Exam",
  "Recall",
  "Filling",
  "Endo",
  "Exo",
  "Other",
];

export default function NewAppointmentModal({
  onClose,
  onSave,
  defaultDate,
  defaultDentistId,
  defaultPatientId,
  dentists,
  patients,
}: Props) {
  const defaultDateStr = defaultDate
    ? `${defaultDate.getFullYear()}-${String(defaultDate.getMonth() + 1).padStart(2, "0")}-${String(defaultDate.getDate()).padStart(2, "0")}`
    : new Date().toISOString().slice(0, 10);

  const [dentistId, setDentistId] = useState(
    defaultDentistId ?? dentists[0]?.id ?? ""
  );
  const [patientId, setPatientId] = useState(
    defaultPatientId ?? patients[0]?.id ?? ""
  );
  const [date, setDate] = useState(defaultDateStr);
  const [time, setTime] = useState("09:00");
  const [duration, setDuration] = useState(30);
  const [type, setType] = useState<AppointmentType>("Exam");
  const [notes, setNotes] = useState("");

  async function handleSave() {
    if (!dentistId || !patientId) {
      console.log("dentist", dentistId)
      console.log("patient", patientId)
      console.error("Missing dentistId or patientId");
      return;
    }

    const dentist = dentists.find((d) => d.id === dentistId);
    const patient = patients.find((p) => p.id === patientId);

    if (!dentist || !patient) {
      console.error("Dentist or patient not found", {
        dentistId,
        patientId,
        dentists,
        patients,
      });
      return;
    }

    const startTime = new Date(`${date}T${time}`).toISOString();

    const appt: Appointment = {
      id: `temp_${Date.now()}`,
      patientId,
      patientName: `${patient.firstName} ${patient.lastName}`,
      dentistId,
      dentistName: dentist.name,
      startTime,
      duration,
      type,
      notes,
    };

    onSave(appt);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-4 flex items-center justify-between">
          <h2 className="text-white font-semibold text-lg">New Appointment</h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Dentist
              </label>
              <select
                value={dentistId}
                onChange={(e) => setDentistId(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              >
                {dentists.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Patient
              </label>
              <select
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Duration
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              >
                {DURATION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as AppointmentType)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              >
                {APPT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Optional notes..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Create Appointment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
