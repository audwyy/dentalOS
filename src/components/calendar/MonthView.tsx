'use client';

import { Appointment, APPOINTMENT_COLORS } from '../../types';

interface Props {
  currentDate: Date;
  appointments: Appointment[];
  highlightedId: string | null;
  onAppointmentClick: (appt: Appointment) => void;
  onDayClick: (date: Date) => void;
}

export default function MonthView({ currentDate, appointments, highlightedId, onAppointmentClick, onDayClick }: Props) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  function getApptsForDay(day: number) {
    return appointments.filter(a => {
      const d = new Date(a.startTime);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  }

  const isToday = (day: number) =>
    today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  return (
    <div className="flex-1 overflow-auto">
      <div className="grid grid-cols-7 border-b border-gray-200">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 flex-1">
        {days.map((day, idx) => {
          const appts = day ? getApptsForDay(day) : [];
          return (
            <div
              key={idx}
              onClick={() => day && onDayClick(new Date(year, month, day))}
              className={`min-h-28 border-b border-r border-gray-100 p-1.5 cursor-pointer hover:bg-gray-50 transition-colors ${
                !day ? 'bg-gray-50/50' : ''
              }`}
            >
              {day && (
                <>
                  <div className={`w-7 h-7 flex items-center justify-center text-sm font-medium rounded-full mb-1 ${
                    isToday(day) ? 'bg-teal-600 text-white' : 'text-gray-700'
                  }`}>
                    {day}
                  </div>
                  <div className="space-y-0.5">
                    {appts.slice(0, 3).map(appt => {
                      const colors = APPOINTMENT_COLORS[appt.type];
                      const isHighlighted = highlightedId === appt.id;
                      return (
                        <div
                          key={appt.id}
                          onClick={e => { e.stopPropagation(); onAppointmentClick(appt); }}
                          className={`text-xs px-1.5 py-0.5 rounded truncate cursor-pointer transition-all ${colors.bg} ${colors.text} border ${colors.border} ${
                            isHighlighted ? 'ring-2 ring-offset-1 ring-yellow-400 font-bold' : 'hover:opacity-80'
                          }`}
                        >
                          {new Date(appt.startTime).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })} {appt.patientName.split(' ')[0]}
                        </div>
                      );
                    })}
                    {appts.length > 3 && (
                      <div className="text-xs text-gray-400 px-1">+{appts.length - 3} more</div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}