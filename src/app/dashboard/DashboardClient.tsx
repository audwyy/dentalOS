"use client";

import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  X,
  Calendar,
  LayoutGrid,
  Clock,
  Filter,
  UserPlus,
} from "lucide-react";
import {
  Appointment,
  ViewMode,
  APPOINTMENT_COLORS,
  DENTIST_COLORS,
} from "../../types";
import MonthView from "../../components/calendar/MonthView";
import WeekView from "../../components/calendar/WeekView";
import DayView from "../../components/calendar/DayView";
import NewAppointmentModal from "../../components/modals/NewAppointmentModal";
import AppointmentDetailModal from "../../components/modals/AppointmentDetailModal";
import EditAppointmentModal from "../../components/modals/EditAppointmentModal";
import CreatePatient from "../../components/CreatePatient";
import { Patient } from "../../types";
import { useCalendarData } from "@/lib/useCalendarData";
import { UserButton } from "@neondatabase/auth/react";

interface Props {
  userName: string;
  profileId: string;
}

export default function DashboardClient({ userName, profileId }: Props) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const {
    appointments,
    patients,
    loading,
    staff,
    addAppointment,
    editAppointment,
    addPatient,
  } = useCalendarData();
  const [view, setView] = useState<ViewMode>("week");
  const [filterDentistId, setFilterDentistId] = useState<string | null>(
    profileId
  );
  const [showNewAppt, setShowNewAppt] = useState(false);
  const [showCreatePatient, setShowCreatePatient] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);
  // const [profilePatientId, setProfilePatientId] = useState<string | null>(null);
  const [newApptPatientId, setNewApptPatientId] = useState<
    string | undefined
  >();

  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const filteredAppointments = useMemo(() => {
    let appts = appointments;
    if (filterDentistId)
      appts = appts.filter((a) => a.dentistId === filterDentistId);
    return appts;
  }, [appointments, filterDentistId]);

  function handleSearch(query: string) {
    setSearchQuery(query);
    if (!query.trim()) {
      setHighlightedId(null);
      return;
    }
    const q = query.toLowerCase();
    const found = appointments.find((a) =>
      a.patientName.toLowerCase().includes(q)
    );
    if (found) {
      setHighlightedId(found.id);
      setCurrentDate(new Date(found.startTime));
    } else {
      setHighlightedId(null);
    }
  }

  // Navigation
  function navigate(dir: number) {
    const d = new Date(currentDate);
    if (view === "month") d.setMonth(d.getMonth() + dir);
    else if (view === "week") d.setDate(d.getDate() + dir * 7);
    else d.setDate(d.getDate() + dir);
    setCurrentDate(d);
  }

  function goToday() {
    setCurrentDate(new Date());
  }

  function openPatientProfile(patientId: string) {
    window.open(`/patients/${patientId}`, "_blank");
  }
  // Title
  function getTitle() {
    if (view === "month")
      return currentDate.toLocaleDateString("en-AU", {
        month: "long",
        year: "numeric",
      });
    if (view === "day")
      return currentDate.toLocaleDateString("en-AU", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    const start = new Date(currentDate);
    start.setDate(currentDate.getDate() - currentDate.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `${start.toLocaleDateString("en-AU", { day: "numeric", month: "short" })} – ${end.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}`;
  }

  async function handleAddAppt(appt: Appointment) {
    console.log("Saving appointment:", appt);
    try {
      await addAppointment({
        patientId: appt.patientId,
        dentistId: appt.dentistId,
        startTime: appt.startTime,
        duration: appt.duration,
        type: appt.type,
        notes: appt.notes,
      });
      console.log("Appointment saved successfully");
    } catch (err) {
      console.error("Failed to save appointment:", err);
    }
  }

  async function handleEditAppt(updated: Appointment) {
    await editAppointment(updated.id, updated.startTime, updated.duration);
  }

  function handleDayClick(date: Date) {
    setCurrentDate(date);
    setView("day");
  }


  // Create patient → new appointment flow
  async function handlePatientCreated(patient: Patient) {
    const saved = await addPatient(patient);
    setShowCreatePatient(false);
    setNewApptPatientId(saved.id);
    setShowNewAppt(true);
  }

  // Stats
  const todayAppts = appointments.filter(
    (a) =>
      new Date(a.startTime).toDateString() === new Date().toDateString() &&
      a.dentistId === profileId
  );
  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col shrink-0">
        {/* Actions */}
        <div className="px-4 py-4 space-y-2">
          <button
            onClick={() => setShowNewAppt(true)}
            className="w-full flex items-center gap-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus size={16} />
            New Appointment
          </button>
          <button
            onClick={() => setShowCreatePatient(true)}
            className="w-full flex items-center gap-2.5 border border-gray-200 text-gray-600 rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <UserPlus size={16} />
            New Patient
          </button>
        </div>

        {/* Today stats */}
        <div className="px-4 pb-4">
          <div className="bg-teal-50 rounded-xl p-3 border border-teal-100">
            <p className="text-xs font-semibold text-teal-600 mb-2">
              Today's Summary
            </p>
            <p className="text-2xl font-bold text-teal-700">
              {todayAppts.length}
            </p>
            <p className="text-xs text-teal-500">appointments scheduled</p>
          </div>
        </div>

        {/* Staff list */}
        <div className="px-4 flex-1 overflow-y-auto">
          <div className="flex items-center gap-2 mb-3">
            <Filter size={13} className="text-gray-400" />
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Staff
            </span>
          </div>
          <div className="space-y-1">
            <button
              onClick={() => setFilterDentistId(null)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                !filterDentistId
                  ? "bg-gray-100 font-semibold text-gray-800"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              All Staff
            </button>
            {staff.map((member, i) => {
              const color = DENTIST_COLORS[i % DENTIST_COLORS.length];
              const isDentist = member.role === "dentist";
              return (
                <button
                  key={member.id}
                  onClick={() =>
                    isDentist
                      ? setFilterDentistId(
                          filterDentistId === member.id ? null : member.id
                        )
                      : null
                  }
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2.5 ${
                    filterDentistId === member.id
                      ? `${color.light} font-semibold ${color.text}`
                      : "text-gray-600 hover:bg-gray-50"
                  } ${!isDentist ? "cursor-default" : "cursor-pointer"}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${color.bg}`}
                  >
                    {member.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {member.name}
                    </p>
                    <p className="text-xs text-gray-400 capitalize">
                      {member.role}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="px-4 pb-5 mt-4 border-t border-gray-100 pt-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            Appointment Types
          </p>
          <div className="grid grid-cols-2 gap-1">
            {(Object.entries(APPOINTMENT_COLORS) as [string, any][]).map(
              ([type, colors]) => (
                <div
                  key={type}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${colors.bg}`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${colors.bg} border ${colors.border}`}
                  />
                  <span className={`text-xs font-medium ${colors.text}`}>
                    {type}
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center gap-4">
          {/* Nav */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => navigate(1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
            >
              <ChevronRight size={18} />
            </button>
            <button
              onClick={goToday}
              className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 ml-1"
            >
              Today
            </button>
          </div>

          <h2 className="text-base font-bold text-gray-800 flex-1">
            {getTitle()}
          </h2>

          {/* Search */}
          <div className="relative w-56">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search patient..."
              className="w-full pl-8 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 bg-gray-50"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setHighlightedId(null);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* View switcher */}
          <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
            {(
              [
                ["month", LayoutGrid],
                ["week", Calendar],
                ["day", Clock],
              ] as [ViewMode, any][]
            ).map(([v, Icon]) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all capitalize ${
                  view === v
                    ? "bg-white shadow-sm text-teal-700"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon size={13} />
                {v}
              </button>
            ))}
          </div>
          {/* User Button */}
          <UserButton size="icon" />
        </header>

        {/* Calendar */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {view === "month" && (
            <MonthView
              currentDate={currentDate}
              appointments={filteredAppointments}
              highlightedId={highlightedId}
              onAppointmentClick={setSelectedAppt}
              onDayClick={handleDayClick}
            />
          )}
          {view === "week" && (
            <WeekView
              currentDate={currentDate}
              appointments={filteredAppointments}
              highlightedId={highlightedId}
              onAppointmentClick={setSelectedAppt}
            />
          )}
          {view === "day" && (
            <DayView
              currentDate={currentDate}
              appointments={filteredAppointments}
              highlightedId={highlightedId}
              filterDentistId={filterDentistId}
              onAppointmentClick={setSelectedAppt}
              staff={staff}
            />
          )}
        </div>
      </div>

      {showNewAppt && (
        <NewAppointmentModal
          onClose={() => {
            setShowNewAppt(false);
            setNewApptPatientId(undefined);
          }}
          onSave={handleAddAppt}
          defaultPatientId={newApptPatientId}
          dentists={staff
            .filter((s) => s.role === "dentist")
            .map((s) => ({ id: s.id, name: s.name, color: "cyan" }))}
          patients={patients}
        />
      )}

      {showCreatePatient && (
        <CreatePatient
          onClose={() => setShowCreatePatient(false)}
          onContinue={handlePatientCreated}
        />
      )}

      {selectedAppt && (
        <AppointmentDetailModal
          appointment={selectedAppt}
          onClose={() => setSelectedAppt(null)}
          onEdit={setEditingAppt}
          onOpenProfile={openPatientProfile}
        />
      )}

      {editingAppt && (
        <EditAppointmentModal
          appointment={editingAppt}
          onClose={() => setEditingAppt(null)}
          onSave={handleEditAppt}
        />
      )}
    </div>
  );
}
