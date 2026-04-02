'use client';

import { Appointment, APPOINTMENT_COLORS } from '../../types';

interface Props {
  currentDate: Date;
  appointments: Appointment[];
  highlightedId: string | null;
  onAppointmentClick: (appt: Appointment) => void;
}

const HOURS = Array.from({ length: 11 }, (_, i) => i + 8); // 8am - 6pm

export default function WeekView({ currentDate, appointments, highlightedId, onAppointmentClick }: Props) {
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  const today = new Date();

  function getApptsForDay(date: Date) {
    return appointments.filter(a => {
      const d = new Date(a.startTime);
      return d.toDateString() === date.toDateString();
    });
  }

  function getTopPercent(appt: Appointment) {
    const start = new Date(appt.startTime);
    const totalMinutes = (start.getHours() - 8) * 60 + start.getMinutes();
    return (totalMinutes / (11 * 60)) * 100;
  }

  function getHeightPercent(appt: Appointment) {
    return (appt.duration / (11 * 60)) * 100;
  }

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <div className="grid grid-cols-8 border-b border-gray-200 sticky top-0 bg-white z-10">
        <div className="py-3 border-r border-gray-200" />
        {days.map((day, i) => {
          const isToday = day.toDateString() === today.toDateString();
          return (
            <div key={i} className="py-3 text-center border-r border-gray-200 last:border-r-0">
              <p className="text-xs font-semibold text-gray-400 uppercase">
                {day.toLocaleDateString('en-AU', { weekday: 'short' })}
              </p>
              <div className={`w-8 h-8 mx-auto flex items-center justify-center rounded-full text-sm font-bold mt-0.5 ${
                isToday ? 'bg-teal-600 text-white' : 'text-gray-800'
              }`}>
                {day.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-8" style={{ minHeight: '660px' }}>
        {/* Time column */}
        <div className="border-r border-gray-200">
          {HOURS.map(h => (
            <div key={h} className="h-16 border-b border-gray-100 px-2 flex items-start pt-1">
              <span className="text-xs text-gray-400">{h === 12 ? '12 PM' : h < 12 ? `${h} AM` : `${h - 12} PM`}</span>
            </div>
          ))}
        </div>

        {/* Day columns */}
        {days.map((day, dayIdx) => {
          const dayAppts = getApptsForDay(day);
          return (
            <div key={dayIdx} className="border-r border-gray-200 last:border-r-0 relative">
              {HOURS.map(h => (
                <div key={h} className="h-16 border-b border-gray-100" />
              ))}
              {dayAppts.map(appt => {
                const colors = APPOINTMENT_COLORS[appt.type];
                const top = getTopPercent(appt);
                const height = Math.max(getHeightPercent(appt), 3);
                const isHighlighted = highlightedId === appt.id;
                return (
                  <div
                    key={appt.id}
                    onClick={() => onAppointmentClick(appt)}
                    style={{ top: `${top}%`, height: `${height}%`, position: 'absolute', left: '2px', right: '2px' }}
                    className={`rounded px-1.5 py-0.5 text-xs cursor-pointer border overflow-hidden transition-all ${colors.bg} ${colors.text} ${colors.border} ${
                      isHighlighted ? 'ring-2 ring-yellow-400 font-bold' : 'hover:opacity-80'
                    }`}
                  >
                    <p className="font-semibold truncate">{appt.patientName.split(' ')[0]}</p>
                    <p className="truncate opacity-80">{appt.type}</p>
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