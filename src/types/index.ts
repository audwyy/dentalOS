export type AppointmentType = 'Exam' | 'Recall' | 'Filling' | 'Endo' | 'Exo' | 'Other';

export type Gender = 'Male' | 'Female' | 'Non-binary' | 'Prefer not to say';

export interface Dentist {
  id: string;
  name: string;
  color: string;
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dob: string;
  gender: Gender;
  phone: string;
  email: string;
  address: string;
  notes: string;
  smoker: boolean;
  insurance: string;
  createdAt: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  dentistId: string;
  dentistName: string;
  startTime: string; // ISO string
  duration: number; // in minutes
  type: AppointmentType;
  notes: string;
}

export type ViewMode = 'month' | 'week' | 'day';

export const APPOINTMENT_COLORS: Record<AppointmentType, { bg: string; text: string; border: string }> = {
  Exam:    { bg: 'bg-blue-100',   text: 'text-blue-800',   border: 'border-blue-300' },
  Recall:  { bg: 'bg-green-100',  text: 'text-green-800',  border: 'border-green-300' },
  Filling: { bg: 'bg-amber-100',  text: 'text-amber-800',  border: 'border-amber-300' },
  Endo:    { bg: 'bg-red-100',    text: 'text-red-800',    border: 'border-red-300' },
  Exo:     { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
  Other:   { bg: 'bg-gray-100',   text: 'text-gray-800',   border: 'border-gray-300' },
};

export const DENTIST_COLORS = [
  { bg: 'bg-cyan-500',    light: 'bg-cyan-50',    text: 'text-cyan-700',    border: 'border-cyan-300' },
  { bg: 'bg-violet-500',  light: 'bg-violet-50',  text: 'text-violet-700',  border: 'border-violet-300' },
  { bg: 'bg-rose-500',    light: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-300' },
  { bg: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-300' },
];

export const DURATION_OPTIONS = [
  { label: '15 minutes', value: 15 },
  { label: '30 minutes', value: 30 },
  { label: '45 minutes', value: 45 },
  { label: '1 hour',     value: 60 },
  { label: '1.5 hours',  value: 90 },
];