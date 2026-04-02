import { Appointment, Dentist, Patient, AppointmentType } from '../types';

export const MOCK_DENTISTS: Dentist[] = [
  { id: 'd1', name: 'Dr. Sarah Chen',    color: 'cyan' },
  { id: 'd2', name: 'Dr. James Miller',  color: 'violet' },
  { id: 'd3', name: 'Dr. Priya Patel',   color: 'rose' },
  { id: 'd4', name: 'Dr. Tom Nguyen',    color: 'emerald' },
];

export const MOCK_PATIENTS: Patient[] = [
  { id: 'p1', firstName: 'Alice',   lastName: 'Johnson',   dob: '1985-03-12', gender: 'Female',           phone: '0412 345 678', email: 'alice@email.com',   address: '12 Main St, Sydney', notes: 'Allergic to latex', createdAt: '2024-01-10' },
  { id: 'p2', firstName: 'Bob',     lastName: 'Smith',     dob: '1979-07-22', gender: 'Male',             phone: '0423 456 789', email: 'bob@email.com',     address: '45 Park Ave, Sydney', notes: '', createdAt: '2024-01-15' },
  { id: 'p3', firstName: 'Carol',   lastName: 'Williams',  dob: '1992-11-05', gender: 'Female',           phone: '0434 567 890', email: 'carol@email.com',   address: '8 Oak Rd, Sydney', notes: 'Nervous patient', createdAt: '2024-02-01' },
  { id: 'p4', firstName: 'David',   lastName: 'Brown',     dob: '1968-04-30', gender: 'Male',             phone: '0445 678 901', email: 'david@email.com',   address: '22 River St, Sydney', notes: '', createdAt: '2024-02-10' },
  { id: 'p5', firstName: 'Emma',    lastName: 'Davis',     dob: '2001-09-15', gender: 'Female',           phone: '0456 789 012', email: 'emma@email.com',    address: '5 Hill Rd, Sydney', notes: 'Wisdom teeth pending', createdAt: '2024-03-01' },
  { id: 'p6', firstName: 'Frank',   lastName: 'Wilson',    dob: '1955-12-28', gender: 'Male',             phone: '0467 890 123', email: 'frank@email.com',   address: '99 Bay St, Sydney', notes: 'Diabetic', createdAt: '2024-03-15' },
  { id: 'p7', firstName: 'Grace',   lastName: 'Moore',     dob: '1988-06-14', gender: 'Female',           phone: '0478 901 234', email: 'grace@email.com',   address: '17 Palm Ave, Sydney', notes: '', createdAt: '2024-04-01' },
  { id: 'p8', firstName: 'Henry',   lastName: 'Taylor',    dob: '1975-02-09', gender: 'Male',             phone: '0489 012 345', email: 'henry@email.com',   address: '33 Elm St, Sydney', notes: '', createdAt: '2024-04-10' },
];

const now = new Date();
const y = now.getFullYear();
const m = now.getMonth();

function appt(id: string, patientId: string, dentistId: string, day: number, hour: number, min: number, duration: number, type: AppointmentType, notes = ''): Appointment {
  const patient = MOCK_PATIENTS.find(p => p.id === patientId)!;
  const dentist = MOCK_DENTISTS.find(d => d.id === dentistId)!;
  return {
    id,
    patientId,
    patientName: `${patient.firstName} ${patient.lastName}`,
    dentistId,
    dentistName: dentist.name,
    startTime: new Date(y, m, day, hour, min).toISOString(),
    duration,
    type,
    notes,
  };
}

export const MOCK_APPOINTMENTS: Appointment[] = [
  appt('a1',  'p1', 'd1', 2,  9,  0,  30, 'Exam',    'Routine check'),
  appt('a2',  'p2', 'd2', 2,  10, 0,  60, 'Filling',  'Upper left molar'),
  appt('a3',  'p3', 'd1', 2,  11, 0,  30, 'Recall',   ''),
  appt('a4',  'p4', 'd3', 3,  9,  30, 45, 'Endo',     'Root canal #14'),
  appt('a5',  'p5', 'd2', 3,  14, 0,  30, 'Exo',      'Wisdom tooth'),
  appt('a6',  'p6', 'd4', 4,  8,  0,  30, 'Exam',     ''),
  appt('a7',  'p7', 'd1', 4,  10, 30, 60, 'Filling',  'Two fillings'),
  appt('a8',  'p8', 'd3', 5,  9,  0,  30, 'Recall',   ''),
  appt('a9',  'p1', 'd2', 7,  11, 0,  30, 'Other',    'Consultation'),
  appt('a10', 'p3', 'd4', 8,  9,  0,  45, 'Endo',     ''),
  appt('a11', 'p2', 'd1', 9,  14, 0,  30, 'Exam',     ''),
  appt('a12', 'p6', 'd2', 10, 10, 0,  60, 'Filling',  'Lower right'),
  appt('a13', 'p7', 'd3', 11, 9,  0,  30, 'Recall',   ''),
  appt('a14', 'p4', 'd4', 12, 11, 0,  30, 'Exam',     ''),
  appt('a15', 'p5', 'd1', 14, 9,  0,  90, 'Endo',     'Complex case'),
  appt('a16', 'p8', 'd2', 15, 10, 30, 30, 'Exo',      ''),
  appt('a17', 'p1', 'd3', 16, 13, 0,  30, 'Recall',   ''),
  appt('a18', 'p2', 'd4', 17, 9,  0,  30, 'Exam',     ''),
  appt('a19', 'p3', 'd1', 18, 11, 0,  60, 'Filling',  ''),
  appt('a20', 'p6', 'd2', 21, 9,  0,  30, 'Other',    'Review x-rays'),
  appt('a21', 'p7', 'd1', now.getDate(), 9,  0,  30, 'Exam',   'Today appt'),
  appt('a22', 'p8', 'd2', now.getDate(), 10, 0,  45, 'Filling', 'Today appt'),
  appt('a23', 'p4', 'd3', now.getDate(), 11, 30, 30, 'Recall',  'Today appt'),
];