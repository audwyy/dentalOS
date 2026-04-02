"use client";

import { Appointment, APPOINTMENT_COLORS, DENTIST_COLORS } from "../../types";

interface Staff {
  id: string;
  name: string;
  role: string;
}

interface Props {
  currentDate: Date;
  appointments: Appointment[];
  highlightedId: string | null;
  filterDentistId: string | null;
  onAppointmentClick: (appt: Appointment) => void;
  staff: Staff[];
}

const HOURS = Array.from({ length: 11 }, (_, i) => i + 8);

export default function DayView({
  currentDate,
  appointments,
  highlightedId,
  filterDentistId,
  onAppointmentClick,
  staff,
}: Props) {
  const dentists = staff.filter((s) => s.role === "dentist");

  const visibleDentists = filterDentistId
    ? dentists.filter((d) => d.id === filterDentistId)
    : dentists;

  const dayAppts = appointments.filter((a) => {
    const d = new Date(a.startTime);
    return d.toDateString() === currentDate.toDateString();
  });

  function getApptsForDentist(dentistId: string) {
    return dayAppts.filter((a) => a.dentistId === dentistId);
  }

  function getTopPercent(appt: Appointment) {
    const start = new Date(appt.startTime);
    const totalMinutes = (start.getHours() - 8) * 60 + start.getMinutes();
    return (totalMinutes / (11 * 60)) * 100;
  }

  function getHeightPercent(appt: Appointment) {
    return Math.max((appt.duration / (11 * 60)) * 100, 4);
  }

  const fmt = (h: number) =>
    h === 12 ? "12 PM" : h < 12 ? `${h} AM` : `${h - 12} PM`;

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div
          className="grid border-b border-gray-100"
          style={{
            gridTemplateColumns: `80px repeat(${visibleDentists.length}, 1fr)`,
          }}
        >
          <div className="py-3" />
          {visibleDentists.map((dentist, i) => {
            const color = DENTIST_COLORS[i % DENTIST_COLORS.length];
            return (
              <div
                key={dentist.id}
                className={`py-3 px-3 text-center border-l border-gray-200 ${color.light}`}
              >
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${color.light} border ${color.border}`}
                >
                  <div className={`w-2 h-2 rounded-full ${color.bg}`} />
                  <span className={`text-xs font-semibold ${color.text}`}>
                    {dentist.name}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Time grid */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: `80px repeat(${visibleDentists.length}, 1fr)`,
          minHeight: "660px",
        }}
      >
        {/* Time labels */}
        <div className="border-r border-gray-200">
          {HOURS.map((h) => (
            <div
              key={h}
              className="h-16 border-b border-gray-100 px-3 flex items-start pt-1"
            >
              <span className="text-xs text-gray-400 whitespace-nowrap">
                {fmt(h)}
              </span>
            </div>
          ))}
        </div>

        {/* Dentist columns */}
        {visibleDentists.map((dentist, i) => {
          const dentistAppts = getApptsForDentist(dentist.id);
          const color = DENTIST_COLORS[i % DENTIST_COLORS.length];
          return (
            <div
              key={dentist.id}
              className="border-r border-gray-200 last:border-r-0 relative"
            >
              {HOURS.map((h) => (
                <div
                  key={h}
                  className={`h-16 border-b border-gray-100 ${color.light} bg-opacity-20`}
                />
              ))}
              {dentistAppts.map((appt) => {
                const apptColors = APPOINTMENT_COLORS[appt.type];
                const top = getTopPercent(appt);
                const height = getHeightPercent(appt);
                const isHighlighted = highlightedId === appt.id;
                const startFmt = new Date(appt.startTime).toLocaleTimeString(
                  "en-AU",
                  { hour: "2-digit", minute: "2-digit" }
                );
                return (
                  <div
                    key={appt.id}
                    onClick={() => onAppointmentClick(appt)}
                    style={{
                      top: `${top}%`,
                      height: `${height}%`,
                      position: "absolute",
                      left: "4px",
                      right: "4px",
                    }}
                    className={`rounded-lg px-2 py-1 text-xs cursor-pointer border overflow-hidden shadow-sm transition-all ${apptColors.bg} ${apptColors.text} ${apptColors.border} ${
                      isHighlighted
                        ? "ring-2 ring-offset-1 ring-yellow-400 font-bold shadow-md"
                        : "hover:shadow-md hover:opacity-90"
                    }`}
                  >
                    <p className="font-bold truncate">{appt.patientName}</p>
                    <p className="truncate opacity-75">{appt.type}</p>
                    <p className="truncate opacity-60">{startFmt}</p>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
