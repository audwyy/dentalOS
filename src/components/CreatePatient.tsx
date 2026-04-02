"use client";

import { useState } from "react";
import { Patient, Gender } from "../types";
import { ArrowRight, UserPlus } from "lucide-react";

interface Props {
  onClose: () => void;
  onContinue: (patient: Patient) => void;
}

const GENDERS: Gender[] = ["Male", "Female", "Non-binary", "Prefer not to say"];

export default function CreatePatient({ onClose, onContinue }: Props) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    dob: "",
    gender: "Male" as Gender,
    phone: "",
    email: "",
    address: "",
    notes: "",
    smoker: false,
    insurance: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = "Required";
    if (!form.lastName.trim()) e.lastName = "Required";
    if (!form.dob) e.dob = "Required";
    if (!form.phone.trim()) e.phone = "Required";
    if (!form.email.trim()) e.email = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleContinue() {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(await res.text());
      const p = await res.json();
      const patient: Patient = {
        id: p.id,
        firstName: p.first_name,
        lastName: p.last_name,
        dob: p.dob,
        gender: p.gender,
        phone: p.phone,
        email: p.email,
        address: p.address,
        notes: p.notes,
        smoker: p.smoker,
        insurance: p.insurance,
        createdAt: p.created_at,
      };
      onContinue(patient);
    } catch (err) {
      console.error("Failed to create patient:", err);
    } finally {
      setLoading(false);
    }
  }

  const field = (
    label: string,
    key: keyof typeof form,
    type = "text",
    placeholder = ""
  ) => (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={form[key] as string}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 transition-colors ${
          errors[key] ? "border-red-300 bg-red-50" : "border-gray-200"
        }`}
      />
      {errors[key] && (
        <p className="text-xs text-red-500 mt-1">{errors[key]}</p>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
            <UserPlus size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">New Patient</h2>
            <p className="text-white/70 text-xs">
              Enter patient details to get started
            </p>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {field("First Name", "firstName", "text", "Jane")}
            {field("Last Name", "lastName", "text", "Smith")}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {field("Date of Birth", "dob", "date")}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Gender
              </label>
              <select
                value={form.gender}
                onChange={(e) =>
                  setForm((f) => ({ ...f, gender: e.target.value as Gender }))
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              >
                {GENDERS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {field("Phone", "phone", "tel", "0412 345 678")}
            {field("Email", "email", "email", "jane@email.com")}
          </div>

          {field("Address", "address", "text", "12 Main St, Sydney NSW 2000")}
          {field(
            "Insurance Provider",
            "insurance",
            "text",
            "e.g. Medibank, BUPA"
          )}

          {/* Smoker toggle */}
          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-700">Smoker</p>
              <p className="text-xs text-gray-400">Does the patient smoke?</p>
            </div>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, smoker: !f.smoker }))}
              className={`relative w-11 h-6 rounded-full transition-colors ${form.smoker ? "bg-teal-600" : "bg-gray-200"}`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.smoker ? "translate-x-5" : "translate-x-0.5"}`}
              />
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              rows={3}
              placeholder="Allergies, medical history, special requirements..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
            />
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleContinue}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? "Creating..." : "Continue to Appointment"}
            {!loading && <ArrowRight size={15} />}
          </button>
        </div>
      </div>
    </div>
  );
}
