'use client';

import { Appointment, APPOINTMENT_COLORS } from '../../types';
import { X, Clock, User, Stethoscope, Edit2, ExternalLink } from 'lucide-react';

interface Props {
  appointment: Appointment;
  onClose: () => void;
  onEdit: (appt: Appointment) => void;
  onOpenProfile: (patientId: string) => void;
}

export default function AppointmentDetailModal({ appointment, onClose, onEdit, onOpenProfile }: Props) {
  const colors = APPOINTMENT_COLORS[appointment.type];
  const start = new Date(appointment.startTime);
  const end = new Date(start.getTime() + appointment.duration * 60000);

  const fmt = (d: Date) => d.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
  const fmtDate = (d: Date) => d.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className={`px-6 py-4 flex items-center justify-between ${colors.bg} border-b ${colors.border}`}>
          <div>
            <span className={`text-xs font-bold uppercase tracking-widest ${colors.text}`}>{appointment.type}</span>
            <h2 className="text-gray-900 font-bold text-lg mt-0.5">{appointment.patientName}</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Clock size={16} className="text-teal-500 shrink-0" />
            <div>
              <p className="font-medium text-gray-800">{fmtDate(start)}</p>
              <p>{fmt(start)} – {fmt(end)} ({appointment.duration} min)</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Stethoscope size={16} className="text-teal-500 shrink-0" />
            <p>{appointment.dentistName}</p>
          </div>

          <div className="flex items-center gap-3 text-sm text-gray-600">
            <User size={16} className="text-teal-500 shrink-0" />
            <p>{appointment.patientName}</p>
          </div>

          {appointment.notes && (
            <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-600">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Notes</p>
              <p>{appointment.notes}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => { onEdit(appointment); onClose(); }}
              className="flex items-center justify-center gap-2 border border-gray-200 text-gray-700 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <Edit2 size={14} />
              Edit Time
            </button>
            <button
              onClick={() => { onOpenProfile(appointment.patientId); onClose(); }}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <ExternalLink size={14} />
              Patient Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}