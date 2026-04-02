"use client";

import TreatmentTab from "@/components/TreatmentTab";
import {
  Patient,
  Appointment,
  APPOINTMENT_COLORS,
  AppointmentType,
} from "../../../types/index";
import {
  ArrowLeft,
  Plus,
  Edit2,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileText,
  Shield,
  Cigarette,
  Heart,
  Wind,
  MoreHorizontal,
  User,
  LayoutList,
  Stethoscope,
  Image,
  Receipt,
  DollarSign,
  ClipboardList,
  PanelLeftClose,
  PanelLeftOpen,
  Save,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import InvoicesTab from "@/components/InvoicesTab";
import ChartTab from "@/components/ChartTab";
import MediaTab from "@/components/MediaTab";

interface Allergy {
  id: string;
  name: string;
}
interface MedicalEntry {
  id: string;
  system: string;
  condition: string;
  checked: boolean;
  notes: string;
}

interface Props {
  patient: Patient;
  appointments: Appointment[];
}

const INSURANCE_OPTIONS = [
  "None",
  "Medibank",
  "HCF",
  "BUPA",
  "NIB",
  "AHM",
  "Other",
];

const MEDICAL_SYSTEMS = [
  {
    key: "smoker",
    label: "Smoking",
    icon: Cigarette,
    conditions: ["Current smoker", "Ex-smoker"],
  },
  {
    key: "heart",
    label: "Cardiovascular",
    icon: Heart,
    conditions: [
      "High blood pressure",
      "Stroke history",
      "Heart disease",
      "Pacemaker",
    ],
  },
  {
    key: "lungs",
    label: "Respiratory",
    icon: Wind,
    conditions: ["Asthma", "COPD", "Sleep apnoea"],
  },
  {
    key: "other",
    label: "Other",
    icon: MoreHorizontal,
    conditions: [
      "Diabetes",
      "Epilepsy",
      "Bleeding disorder",
      "Immunosuppressed",
      "Pregnant",
    ],
  },
];

const NAV_ITEMS = [
  { key: "info", icon: User, label: "Patient Info" },
  { key: "chart", icon: LayoutList, label: "Chart" },
  { key: "treatment", icon: ClipboardList, label: "Treatment Plan" },
  { key: "media", icon: Image, label: "Media" },
  { key: "invoices", icon: Receipt, label: "Invoices" },
  { key: "pricing", icon: DollarSign, label: "Pricing" },
];

export default function PatientProfilePage({ patient, appointments }: Props) {
  const router = useRouter();
  const now = new Date();
  const [activeTab, setActiveTab] = useState("info");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Patient editable fields
  const [insurance, setInsurance] = useState(patient.insurance || "None");
  const [savingInsurance, setSavingInsurance] = useState(false);

  // Allergies
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [newAllergy, setNewAllergy] = useState("");
  const [addingAllergy, setAddingAllergy] = useState(false);

  // Medical
  const [medical, setMedical] = useState<MedicalEntry[]>([]);
  const [expandedSystems, setExpandedSystems] = useState<string[]>([]);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState("");

  // Edit profile
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState({
    firstName: patient.firstName,
    lastName: patient.lastName,
    phone: patient.phone,
    email: patient.email,
    address: patient.address,
  });

  const patientId = patient.id;

  const age = Math.floor(
    (now.getTime() - new Date(patient.dob).getTime()) /
      (1000 * 60 * 60 * 24 * 365)
  );

  const upcoming = appointments
    .filter((a) => new Date(a.startTime) >= now)
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

  const past = appointments
    .filter((a) => new Date(a.startTime) < now)
    .sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-AU", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-AU", {
      hour: "2-digit",
      minute: "2-digit",
    });

  // Load allergies
  useEffect(() => {
    fetch(`/api/patients/${patientId}/allergies`)
      .then((r) => r.json())
      .then(setAllergies)
      .catch(console.error);
  }, [patientId]);

  // Load medical
  useEffect(() => {
    fetch(`/api/patients/${patientId}/medical`)
      .then((r) => r.json())
      .then(setMedical)
      .catch(console.error);
  }, [patientId]);

  // Insurance save
  async function saveInsurance(value: string) {
    setSavingInsurance(true);
    await fetch(`/api/patients/${patientId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ insurance: value }),
    });
    setSavingInsurance(false);
  }

  // Allergy add
  async function handleAddAllergy() {
    if (!newAllergy.trim()) return;
    const res = await fetch(`/api/patients/${patientId}/allergies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newAllergy.trim() }),
    });
    const row = await res.json();
    setAllergies((prev) => [...prev, row]);
    setNewAllergy("");
    setAddingAllergy(false);
  }

  // Allergy delete
  async function handleDeleteAllergy(allergyId: string) {
    await fetch(`/api/patients/${patientId}/allergies`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ allergyId }),
    });
    setAllergies((prev) => prev.filter((a) => a.id !== allergyId));
  }

  // Medical toggle condition
  async function toggleCondition(system: string, condition: string) {
    const existing = medical.find(
      (m) => m.system === system && m.condition === condition
    );
    if (existing) {
      const updated = { ...existing, checked: !existing.checked };
      await fetch(`/api/patients/${patientId}/medical`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: existing.id,
          checked: updated.checked,
          notes: existing.notes,
        }),
      });
      setMedical((prev) =>
        prev.map((m) => (m.id === existing.id ? updated : m))
      );
    } else {
      const res = await fetch(`/api/patients/${patientId}/medical`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system, condition, checked: true, notes: "" }),
      });
      const row = await res.json();
      if (row) setMedical((prev) => [...prev, row]);
    }
  }

  // Medical save notes
  async function saveNotes(entryId: string) {
    const entry = medical.find((m) => m.id === entryId);
    if (!entry) return;
    await fetch(`/api/patients/${patientId}/medical`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: entryId,
        checked: entry.checked,
        notes: notesDraft,
      }),
    });
    setMedical((prev) =>
      prev.map((m) => (m.id === entryId ? { ...m, notes: notesDraft } : m))
    );
    setEditingNotes(null);
  }

  // Save profile
  async function saveProfile() {
    await fetch(`/api/patients/${patientId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profileDraft),
    });
    setEditingProfile(false);
  }

  function toggleSystem(key: string) {
    setExpandedSystems((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]
    );
  }

  const getConditionEntry = (system: string, condition: string) =>
    medical.find((m) => m.system === system && m.condition === condition);

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      {/* Collapsible Sidebar */}
      <aside
        className={`bg-white border-r border-gray-100 flex flex-col transition-all duration-200 shrink-0 ${
          sidebarCollapsed ? "w-14" : "w-48"
        }`}
      >
        {/* Toggle button */}
        <button
          onClick={() => setSidebarCollapsed((v) => !v)}
          className="flex items-center justify-center h-12 border-b border-gray-100 text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
        >
          {sidebarCollapsed ? (
            <PanelLeftOpen size={18} />
          ) : (
            <PanelLeftClose size={18} />
          )}
        </button>

        <nav className="flex-1 py-2">
          {NAV_ITEMS.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                activeTab === key
                  ? "bg-teal-50 text-teal-700 font-semibold border-r-2 border-teal-600"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
              }`}
            >
              <Icon size={17} className="shrink-0" />
              {!sidebarCollapsed && <span className="truncate">{label}</span>}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-4 flex items-center gap-4 shrink-0">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-white/80 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <div className="flex items-center gap-4 flex-1">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white text-lg font-bold shrink-0">
              {patient.firstName[0]}
              {patient.lastName[0]}
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">
                {patient.firstName} {patient.lastName}
              </h1>
              <p className="text-white/70 text-xs">
                {age} yrs · {patient.gender} · DOB:{" "}
                {new Date(patient.dob).toLocaleDateString("en-AU", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {patient.smoker && (
              <span className="flex items-center gap-1.5 bg-red-500/20 border border-red-300/30 text-white text-xs px-2.5 py-1 rounded-full">
                <Cigarette size={12} />
                Smoker
              </span>
            )}
            <button
              onClick={() => setEditingProfile(true)}
              className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-xs px-3 py-1.5 rounded-lg transition-colors border border-white/20"
            >
              <Edit2 size={13} />
              Edit Profile
            </button>
          </div>
        </header>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "info" && (
            <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
              {/* Contact details */}
              <section>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                  Contact Information
                </h3>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
                  {[
                    { icon: Phone, value: patient.phone },
                    { icon: Mail, value: patient.email },
                    { icon: MapPin, value: patient.address },
                    {
                      icon: Calendar,
                      value: `DOB: ${new Date(patient.dob).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}`,
                    },
                  ].map(({ icon: Icon, value }) => (
                    <div
                      key={value}
                      className="flex items-center gap-3 text-sm text-gray-700"
                    >
                      <Icon size={15} className="text-teal-500 shrink-0" />
                      <span>{value}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Insurance */}
              <section>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                  Insurance
                </h3>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-center gap-3">
                    <Shield size={15} className="text-teal-500 shrink-0" />
                    <select
                      value={insurance}
                      onChange={(e) => {
                        setInsurance(e.target.value);
                        saveInsurance(e.target.value);
                      }}
                      className="flex-1 text-sm text-gray-700 bg-transparent border-none outline-none cursor-pointer"
                    >
                      {INSURANCE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                    {savingInsurance && (
                      <span className="text-xs text-gray-400">Saving…</span>
                    )}
                  </div>
                </div>
              </section>

              {/* Allergies */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Allergies
                  </h3>
                  <button
                    onClick={() => setAddingAllergy(true)}
                    className="text-xs text-teal-600 hover:text-teal-800 font-medium flex items-center gap-1"
                  >
                    <Plus size={13} /> Add
                  </button>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <div className="flex flex-wrap gap-2">
                    {allergies.length === 0 && !addingAllergy && (
                      <p className="text-sm text-gray-400 italic">
                        No allergies recorded
                      </p>
                    )}
                    {allergies.map((a) => (
                      <span
                        key={a.id}
                        className="flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-700 text-xs font-medium px-2.5 py-1 rounded-full"
                      >
                        {a.name}
                        <button
                          onClick={() => handleDeleteAllergy(a.id)}
                          className="hover:text-red-900 transition-colors"
                        >
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                    {addingAllergy && (
                      <div className="flex items-center gap-1.5">
                        <input
                          autoFocus
                          value={newAllergy}
                          onChange={(e) => setNewAllergy(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddAllergy();
                            if (e.key === "Escape") setAddingAllergy(false);
                          }}
                          placeholder="e.g. Penicillin"
                          className="text-xs border border-gray-200 rounded-full px-3 py-1 outline-none focus:ring-2 focus:ring-teal-400"
                        />
                        <button
                          onClick={handleAddAllergy}
                          className="text-teal-600 hover:text-teal-800"
                        >
                          <Check size={15} />
                        </button>
                        <button
                          onClick={() => setAddingAllergy(false)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Medical Info */}
              <section>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                  Medical History
                </h3>
                <div className="space-y-2">
                  {MEDICAL_SYSTEMS.map(
                    ({ key, label, icon: Icon, conditions }) => {
                      const isExpanded = expandedSystems.includes(key);
                      const checkedCount = conditions.filter(
                        (c) => getConditionEntry(key, c)?.checked
                      ).length;
                      return (
                        <div
                          key={key}
                          className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
                        >
                          <button
                            onClick={() => toggleSystem(key)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                          >
                            <Icon
                              size={16}
                              className="text-teal-500 shrink-0"
                            />
                            <span className="flex-1 text-left text-sm font-semibold text-gray-700">
                              {label}
                            </span>
                            {checkedCount > 0 && (
                              <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium">
                                {checkedCount} flagged
                              </span>
                            )}
                            {isExpanded ? (
                              <ChevronUp size={15} className="text-gray-400" />
                            ) : (
                              <ChevronDown
                                size={15}
                                className="text-gray-400"
                              />
                            )}
                          </button>

                          {isExpanded && (
                            <div className="border-t border-gray-100 px-4 py-3 space-y-3">
                              {conditions.map((condition) => {
                                const entry = getConditionEntry(key, condition);
                                const isChecked = entry?.checked ?? false;
                                return (
                                  <div key={condition} className="space-y-2">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                      <div
                                        onClick={() =>
                                          toggleCondition(key, condition)
                                        }
                                        className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${
                                          isChecked
                                            ? "bg-teal-600 border-teal-600"
                                            : "border-gray-300 group-hover:border-teal-400"
                                        }`}
                                      >
                                        {isChecked && (
                                          <Check
                                            size={10}
                                            className="text-white"
                                          />
                                        )}
                                      </div>
                                      <span
                                        className={`text-sm ${isChecked ? "text-gray-900 font-medium" : "text-gray-600"}`}
                                      >
                                        {condition}
                                      </span>
                                    </label>

                                    {isChecked && entry && (
                                      <div className="ml-7">
                                        {editingNotes === entry.id ? (
                                          <div className="flex gap-2">
                                            <textarea
                                              autoFocus
                                              value={notesDraft}
                                              onChange={(e) =>
                                                setNotesDraft(e.target.value)
                                              }
                                              placeholder="Add clinical notes…"
                                              rows={2}
                                              className="flex-1 text-xs border border-gray-200 rounded-lg p-2 outline-none focus:ring-2 focus:ring-teal-400 resize-none"
                                            />
                                            <div className="flex flex-col gap-1">
                                              <button
                                                onClick={() =>
                                                  saveNotes(entry.id)
                                                }
                                                className="text-teal-600 hover:text-teal-800 p-1"
                                              >
                                                <Save size={14} />
                                              </button>
                                              <button
                                                onClick={() =>
                                                  setEditingNotes(null)
                                                }
                                                className="text-gray-400 hover:text-gray-600 p-1"
                                              >
                                                <X size={14} />
                                              </button>
                                            </div>
                                          </div>
                                        ) : (
                                          <button
                                            onClick={() => {
                                              setEditingNotes(entry.id);
                                              setNotesDraft(entry.notes || "");
                                            }}
                                            className="text-xs text-gray-400 hover:text-teal-600 transition-colors flex items-center gap-1.5"
                                          >
                                            <FileText size={12} />
                                            {entry.notes
                                              ? entry.notes
                                              : "Add notes…"}
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>
              </section>

              {/* Media thumbnails */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Media
                  </h3>
                  <button
                    onClick={() => setActiveTab("media")}
                    className="text-xs text-teal-600 hover:text-teal-800 font-medium"
                  >
                    View all
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="aspect-square bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors group"
                    >
                      <Image
                        size={20}
                        className="text-gray-300 group-hover:text-gray-400 transition-colors"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2 italic">
                  Media upload coming soon
                </p>
              </section>

              {/* Appointments */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Upcoming Appointments
                  </h3>
                  <button
                    onClick={() =>
                      router.push(`/?newAppt=true&patientId=${patientId}`)
                    }
                    className="flex items-center gap-1.5 text-xs bg-teal-600 text-white px-3 py-1.5 rounded-full hover:bg-teal-700 transition-colors"
                  >
                    <Plus size={12} /> New
                  </button>
                </div>
                {upcoming.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">
                    No upcoming appointments
                  </p>
                ) : (
                  <div className="space-y-2">
                    {upcoming.map((appt) => {
                      const colors = APPOINTMENT_COLORS[
                        appt.type as AppointmentType
                      ] ?? {
                        bg: "bg-gray-100",
                        text: "text-gray-800",
                        border: "border-gray-200",
                      };
                      return (
                        <div
                          key={appt.id}
                          className={`flex items-center gap-3 p-3 rounded-xl border ${colors.border} ${colors.bg}`}
                        >
                          <div
                            className={`text-xs font-bold px-2 py-0.5 rounded-full border ${colors.border} ${colors.bg} ${colors.text}`}
                          >
                            {appt.type}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm font-semibold ${colors.text}`}
                            >
                              {fmtDate(appt.startTime)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {fmtTime(appt.startTime)} · {appt.duration} min ·{" "}
                              {appt.dentistName}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              <section>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                  Appointment History
                </h3>
                {past.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">
                    No past appointments
                  </p>
                ) : (
                  <div className="space-y-2">
                    {past.map((appt) => {
                      const colors = APPOINTMENT_COLORS[
                        appt.type as AppointmentType
                      ] ?? {
                        bg: "bg-gray-100",
                        text: "text-gray-800",
                        border: "border-gray-200",
                      };
                      return (
                        <div
                          key={appt.id}
                          className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-white shadow-sm"
                        >
                          <div
                            className={`text-xs font-bold px-2 py-0.5 rounded-full border ${colors.border} ${colors.bg} ${colors.text}`}
                          >
                            {appt.type}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-700">
                              {fmtDate(appt.startTime)}
                            </p>
                            <p className="text-xs text-gray-400">
                              {fmtTime(appt.startTime)} · {appt.duration} min ·{" "}
                              {appt.dentistName}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* Placeholder tabs */}

          {activeTab === "treatment" && <TreatmentTab patientId={patient.id} />}
          {activeTab === "invoices" && (
            <InvoicesTab patientId={patient.id} patient={patient} />
          )}
          {activeTab === "chart" && (
            <ChartTab patientId={patient.id} treatmentItems={[]} />
          )}
          {activeTab === "media" && <MediaTab patientId={patient.id} />}
          {["pricing"].includes(activeTab) && (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                {(() => {
                  const item = NAV_ITEMS.find((n) => n.key === activeTab);
                  const Icon = item?.icon ?? FileText;
                  return (
                    <>
                      <Icon size={40} className="mx-auto mb-3 text-gray-200" />
                      <p className="text-sm font-medium text-gray-400">
                        {item?.label}
                      </p>
                      <p className="text-xs text-gray-300 mt-1">Coming soon</p>
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {editingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-4 flex items-center justify-between">
              <h2 className="text-white font-bold">Edit Profile</h2>
              <button
                onClick={() => setEditingProfile(false)}
                className="text-white/80 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: "First Name", key: "firstName" },
                { label: "Last Name", key: "lastName" },
                { label: "Phone", key: "phone" },
                { label: "Email", key: "email" },
                { label: "Address", key: "address" },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                    {label}
                  </label>
                  <input
                    value={profileDraft[key as keyof typeof profileDraft]}
                    onChange={(e) =>
                      setProfileDraft((prev) => ({
                        ...prev,
                        [key]: e.target.value,
                      }))
                    }
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setEditingProfile(false)}
                  className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveProfile}
                  className="flex-1 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
