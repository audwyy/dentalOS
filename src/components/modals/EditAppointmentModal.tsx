'use client';

import { useState } from 'react';
import { Appointment, DURATION_OPTIONS } from '../../types';
import { X } from 'lucide-react';

interface Props {
  appointment: Appointment;
  onClose: () => void;
  onSave: (updated: Appointment) => void;
}

export default function EditAppointmentModal({ appointment, onClose, onSave }: Props) {
  const start = new Date(appointment.startTime);
  const [date, setDate] = useState(start.toISOString().slice(0, 10));
  const [time, setTime] = useState(start.toTimeString().slice(0, 5));
  const [duration, setDuration] = useState(appointment.duration);

  function handleSave() {
    const newStart = new Date(`${date}T${time}`).toISOString();
    onSave({ ...appointment, startTime: newStart, duration });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-4 flex items-center justify-between">
          <h2 className="text-white font-semibold text-lg">Edit Appointment Time</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-500">Editing appointment for <span className="font-semibold text-gray-800">{appointment.patientName}</span></p>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Time</label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Duration</label>
            <select value={duration} onChange={e => setDuration(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
              {DURATION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors">Cancel</button>
            <button onClick={handleSave} className="flex-1 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity">Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  );
}