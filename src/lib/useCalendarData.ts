'use client';
import { useState, useEffect } from 'react';
import { Appointment, Patient } from '@/types';

export function useCalendarData() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/appointments').then(r => r.json()),
      fetch('/api/patients').then(r => r.json()),
      fetch('/api/staff').then(r => r.json()),
    ]).then(([appts, pts, staffList]) => {
      setAppointments(appts.map((a: any) => ({
        id: a.id,
        patientId: a.patient_id,
        patientName: a.patient_name,
        dentistId: a.dentist_id,
        dentistName: a.dentist_name,
        startTime: a.start_time,
        duration: a.duration,
        type: a.appointment_type,
        notes: a.notes,
      })));
      setPatients(pts.map((p: any) => ({
        id: p.id,
        firstName: p.first_name,
        lastName: p.last_name,
        dob: p.dob,
        gender: p.gender,
        phone: p.phone,
        email: p.email,
        address: p.address,
        notes: p.notes,
        smoker: p.smoker ?? false,
        insurance: p.insurance ?? '',
        createdAt: p.created_at,
      })));
      setStaff(staffList);
      setLoading(false);
    });
  }, []);

  async function addAppointment(data: {
    patientId: string; dentistId: string; startTime: string;
    duration: number; type: string; notes: string;
  }) {
    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  
    if (!res.ok) {
      const error = await res.text();
      console.error('API error:', error);
      throw new Error(error);
    }
  
    const a = await res.json();
  
    const newAppt: Appointment = {
      id: a.id,
      patientId: a.patient_id,
      patientName: patients.find(p => p.id === a.patient_id)
        ? `${patients.find(p => p.id === a.patient_id)!.firstName} ${patients.find(p => p.id === a.patient_id)!.lastName}`
        : '',
      dentistId: a.dentist_id,
      dentistName: staff.find(s => s.id === a.dentist_id)?.name ?? '', // ← use staff
      startTime: a.start_time,
      duration: a.duration,
      type: a.appointment_type,
      notes: a.notes,
    };
  
    setAppointments(prev => [...prev, newAppt]);
  }

  async function editAppointment(id: string, startTime: string, duration: number) {
    await fetch(`/api/appointments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startTime, duration }),
    });
    setAppointments(prev => prev.map(a =>
      a.id === id ? { ...a, startTime, duration } : a
    ));
  }

  async function addPatient(patient: Patient) {
    setPatients(prev => [...prev, patient]);
    return patient;
  }

  return { appointments, patients, staff, loading, addAppointment, editAppointment, addPatient };
}