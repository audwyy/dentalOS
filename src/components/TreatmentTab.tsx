"use client";

import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Trash2,
  GripVertical,
  Check,
  ChevronDown,
  ChevronUp,
  Save,
  Search,
  X,
  FileText,
  Image,
  AlertCircle,
  Receipt,
} from "lucide-react";

interface ADACode {
  id: string;
  code: string;
  name: string;
  category: string;
  price: number;
}

interface TreatmentItem {
  id: string;
  visitId: string;
  code: string;
  name: string;
  price: number;
  toothNumber: string;
  sortOrder: number;
}

interface TreatmentVisit {
  id: string;
  visitNumber: number;
  visitDate: string;
  completed: boolean;
  notes: string;
  invoiceId: string | null;
  items: TreatmentItem[];
}

interface Props {
  patientId: string;
}

// FDI tooth numbers
const FDI_TEETH = [
  [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28],
  [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38],
];

export default function TreatmentTab({ patientId }: Props) {
  const [visits, setVisits] = useState<TreatmentVisit[]>([]);
  const [adaCodes, setAdaCodes] = useState<ADACode[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedVisits, setExpandedVisits] = useState<string[]>([]);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [addingItemTo, setAddingItemTo] = useState<string | null>(null);
  const [codeSearch, setCodeSearch] = useState("");
  const [selectedCode, setSelectedCode] = useState<ADACode | null>(null);
  const [toothInput, setToothInput] = useState("");
  const [showToothPicker, setShowToothPicker] = useState(false);
  const [addingVisit, setAddingVisit] = useState(false);
  const [newVisitDate, setNewVisitDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [dragging, setDragging] = useState<{
    itemId: string;
    fromVisitId: string;
  } | null>(null);
  const [dragOverVisit, setDragOverVisit] = useState<string | null>(null);

  // Load visits + items + ada codes
  useEffect(() => {
    Promise.all([
      fetch(`/api/patients/${patientId}/treatment`).then((r) => r.json()),
      fetch("/api/ada-codes").then((r) => r.json()),
    ]).then(([treatmentData, codes]) => {
      const { visits: rawVisits, items: rawItems } = treatmentData;
      const merged: TreatmentVisit[] = rawVisits.map((v: any) => ({
        id: v.id,
        visitNumber: v.visit_number,
        visitDate: v.visit_date,
        completed: v.completed,
        notes: v.notes || "",
        invoiceId: v.invoice_id,
        items: rawItems
          .filter((i: any) => i.visit_id === v.id)
          .map((i: any) => ({
            id: i.id,
            visitId: i.visit_id,
            code: i.code,
            name: i.name,
            price: Number(i.price),
            toothNumber: i.tooth_number || "",
            sortOrder: i.sort_order,
          }))
          .sort(
            (a: TreatmentItem, b: TreatmentItem) => a.sortOrder - b.sortOrder
          ),
      }));
      setVisits(merged);
      setAdaCodes(codes.map((c: any) => ({ ...c, price: Number(c.price) })));
      if (merged.length > 0) setExpandedVisits([merged[0].id]);
      setLoading(false);
    });
  }, [patientId]);

  const totalPlanned = visits
    .filter((v) => !v.completed)
    .flatMap((v) => v.items)
    .reduce((s, i) => s + i.price, 0);

  const totalCompleted = visits
    .filter((v) => v.completed)
    .flatMap((v) => v.items)
    .reduce((s, i) => s + i.price, 0);

  const pendingVisits = visits.filter((v) => !v.completed);
  const completedVisits = visits.filter((v) => v.completed);

  function toggleExpand(visitId: string) {
    setExpandedVisits((prev) =>
      prev.includes(visitId)
        ? prev.filter((v) => v !== visitId)
        : [...prev, visitId]
    );
  }

  // Add visit
  async function handleAddVisit() {
    const res = await fetch(`/api/patients/${patientId}/treatment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitDate: newVisitDate }),
    });
    const visit = await res.json();
    const newVisit: TreatmentVisit = {
      id: visit.id,
      visitNumber: visit.visit_number,
      visitDate: visit.visit_date,
      completed: false,
      notes: "",
      invoiceId: null,
      items: [],
    };
    setVisits((prev) => [...prev, newVisit]);
    setExpandedVisits((prev) => [...prev, newVisit.id]);
    setAddingVisit(false);
    setNewVisitDate(new Date().toISOString().split("T")[0]);
  }

  // Add item
  async function handleAddItem(visitId: string) {
    if (!selectedCode) return;
    const visit = visits.find((v) => v.id === visitId)!;
    const sortOrder = visit.items.length;

    const res = await fetch("/api/treatment/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visitId,
        patientId,
        code: selectedCode.code,
        name: selectedCode.name,
        price: selectedCode.price,
        toothNumber: toothInput,
        sortOrder,
      }),
    });
    const item = await res.json();
    const newItem: TreatmentItem = {
      id: item.id,
      visitId,
      code: item.code,
      name: item.name,
      price: Number(item.price),
      toothNumber: item.tooth_number || "",
      sortOrder: item.sort_order,
    };
    setVisits((prev) =>
      prev.map((v) =>
        v.id === visitId ? { ...v, items: [...v.items, newItem] } : v
      )
    );
    setSelectedCode(null);
    setCodeSearch("");
    setToothInput("");
    setAddingItemTo(null);
    setShowToothPicker(false);
  }

  // Delete item
  async function handleDeleteItem(visitId: string, itemId: string) {
    await fetch("/api/treatment/items", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: itemId }),
    });
    setVisits((prev) =>
      prev.map((v) =>
        v.id === visitId
          ? { ...v, items: v.items.filter((i) => i.id !== itemId) }
          : v
      )
    );
  }

  // Complete visit → auto invoice
  async function handleCompleteVisit(visitId: string, completed: boolean) {
    const res = await fetch(`/api/treatment/visits/${visitId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed }),
    });
    const data = await res.json();
    setVisits((prev) =>
      prev.map((v) =>
        v.id === visitId
          ? {
              ...v,
              completed: data.visit.completed,
              invoiceId: data.invoice?.id ?? v.invoiceId,
            }
          : v
      )
    );
  }

  // Save notes
  async function handleSaveNotes(visitId: string) {
    await fetch(`/api/treatment/visits/${visitId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: notesDraft }),
    });
    setVisits((prev) =>
      prev.map((v) => (v.id === visitId ? { ...v, notes: notesDraft } : v))
    );
    setEditingNotes(null);
  }

  // Drag item between visits
  async function handleDropOnVisit(toVisitId: string) {
    if (!dragging || dragging.fromVisitId === toVisitId) {
      setDragging(null);
      setDragOverVisit(null);
      return;
    }
    const fromVisit = visits.find((v) => v.id === dragging.fromVisitId)!;
    const item = fromVisit.items.find((i) => i.id === dragging.itemId)!;
    const toVisit = visits.find((v) => v.id === toVisitId)!;

    // Optimistic update
    setVisits((prev) =>
      prev.map((v) => {
        if (v.id === dragging.fromVisitId)
          return {
            ...v,
            items: v.items.filter((i) => i.id !== dragging.itemId),
          };
        if (v.id === toVisitId)
          return {
            ...v,
            items: [
              ...v.items,
              { ...item, visitId: toVisitId, sortOrder: v.items.length },
            ],
          };
        return v;
      })
    );

    await fetch("/api/treatment/items", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: dragging.itemId,
        visitId: toVisitId,
        sortOrder: toVisit.items.length,
      }),
    });

    setDragging(null);
    setDragOverVisit(null);
  }

  const filteredCodes = adaCodes.filter(
    (c) =>
      c.code.includes(codeSearch) ||
      c.name.toLowerCase().includes(codeSearch.toLowerCase()) ||
      c.category.toLowerCase().includes(codeSearch.toLowerCase())
  );

  const groupedCodes = filteredCodes.reduce(
    (acc, c) => {
      if (!acc[c.category]) acc[c.category] = [];
      acc[c.category].push(c);
      return acc;
    },
    {} as Record<string, ADACode[]>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm">Loading treatment plan…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
            Total Visits
          </p>
          <p className="text-3xl font-bold text-gray-800">{visits.length}</p>
          <p className="text-xs text-gray-400 mt-1">
            {completedVisits.length} completed · {pendingVisits.length} pending
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
            Planned Value
          </p>
          <p className="text-3xl font-bold text-amber-600">
            ${totalPlanned.toFixed(2)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            across {pendingVisits.length} pending visits
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
            Completed Value
          </p>
          <p className="text-3xl font-bold text-teal-600">
            ${totalCompleted.toFixed(2)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {completedVisits.length} invoices created
          </p>
        </div>
      </div>

      {/* Pending visits */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Treatment Plan
          </h3>
          <button
            onClick={() => setAddingVisit(true)}
            className="flex items-center gap-1.5 text-xs bg-teal-600 text-white px-3 py-1.5 rounded-lg hover:bg-teal-700 transition-colors font-medium"
          >
            <Plus size={13} /> Add Visit
          </button>
        </div>

        {/* Add visit form */}
        {addingVisit && (
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 mb-3 flex items-center gap-3">
            <div>
              <label className="text-xs font-semibold text-teal-700 block mb-1">
                Visit Date
              </label>
              <input
                type="date"
                value={newVisitDate}
                onChange={(e) => setNewVisitDate(e.target.value)}
                className="text-sm border border-teal-300 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleAddVisit}
                className="text-sm bg-teal-600 text-white px-4 py-1.5 rounded-lg hover:bg-teal-700 transition-colors font-medium"
              >
                Create
              </button>
              <button
                onClick={() => setAddingVisit(false)}
                className="text-sm border border-gray-200 text-gray-600 px-4 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {pendingVisits.length === 0 && !addingVisit && (
          <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
            <FileText size={32} className="mx-auto mb-2 text-gray-200" />
            <p className="text-sm">No treatment visits planned</p>
            <p className="text-xs mt-1">Click "Add Visit" to get started</p>
          </div>
        )}

        <div className="space-y-3">
          {pendingVisits.map((visit) => (
            <VisitCard
              key={visit.id}
              visit={visit}
              expanded={expandedVisits.includes(visit.id)}
              onToggle={() => toggleExpand(visit.id)}
              onComplete={(c) => handleCompleteVisit(visit.id, c)}
              onDeleteItem={(itemId) => handleDeleteItem(visit.id, itemId)}
              onAddItem={() => {
                setAddingItemTo(visit.id);
                setSelectedCode(null);
                setCodeSearch("");
                setToothInput("");
              }}
              onSaveNotes={() => handleSaveNotes(visit.id)}
              editingNotes={editingNotes === visit.id}
              onEditNotes={() => {
                setEditingNotes(visit.id);
                setNotesDraft(visit.notes);
              }}
              notesDraft={notesDraft}
              onNotesDraftChange={setNotesDraft}
              dragging={dragging}
              dragOver={dragOverVisit === visit.id}
              onDragStart={(itemId) =>
                setDragging({ itemId, fromVisitId: visit.id })
              }
              onDragOver={() => setDragOverVisit(visit.id)}
              onDrop={() => handleDropOnVisit(visit.id)}
              isCompleted={false}
            />
          ))}
        </div>
      </section>

      {/* Completed visits */}
      {completedVisits.length > 0 && (
        <section>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
            Completed
          </h3>
          <div className="space-y-3">
            {completedVisits.map((visit) => (
              <VisitCard
                key={visit.id}
                visit={visit}
                expanded={expandedVisits.includes(visit.id)}
                onToggle={() => toggleExpand(visit.id)}
                onComplete={(c) => handleCompleteVisit(visit.id, c)}
                onDeleteItem={(itemId) => handleDeleteItem(visit.id, itemId)}
                onAddItem={() => {}}
                onSaveNotes={() => handleSaveNotes(visit.id)}
                editingNotes={editingNotes === visit.id}
                onEditNotes={() => {
                  setEditingNotes(visit.id);
                  setNotesDraft(visit.notes);
                }}
                notesDraft={notesDraft}
                onNotesDraftChange={setNotesDraft}
                dragging={null}
                dragOver={false}
                onDragStart={() => {}}
                onDragOver={() => {}}
                onDrop={() => {}}
                isCompleted={true}
              />
            ))}
          </div>
        </section>
      )}

      {/* Add item modal */}
      {addingItemTo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col overflow-hidden">
            <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-4 flex items-center justify-between shrink-0">
              <h2 className="text-white font-bold">Add Treatment Item</h2>
              <button
                onClick={() => setAddingItemTo(null)}
                className="text-white/80 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 border-b border-gray-100 shrink-0">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  autoFocus
                  value={codeSearch}
                  onChange={(e) => setCodeSearch(e.target.value)}
                  placeholder="Search by code or name…"
                  className="w-full pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
            </div>

            <div className="overflow-y-auto flex-1 p-4 space-y-4">
              {Object.entries(groupedCodes).map(([category, codes]) => (
                <div key={category}>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                    {category}
                  </p>
                  <div className="space-y-1">
                    {codes.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedCode(c)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center justify-between ${
                          selectedCode?.id === c.id
                            ? "bg-teal-50 border border-teal-300 text-teal-800"
                            : "hover:bg-gray-50 border border-transparent"
                        }`}
                      >
                        <div>
                          <span className="font-mono font-bold text-xs text-gray-500 mr-2">
                            {c.code}
                          </span>
                          <span className="font-medium">{c.name}</span>
                        </div>
                        <span className="text-teal-600 font-semibold">
                          ${c.price.toFixed(2)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {selectedCode && (
              <div className="p-4 border-t border-gray-100 bg-gray-50 shrink-0 space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-mono bg-teal-100 text-teal-800 px-2 py-0.5 rounded font-bold">
                    {selectedCode.code}
                  </span>
                  <span className="font-semibold text-gray-800">
                    {selectedCode.name}
                  </span>
                  <span className="ml-auto text-teal-600 font-bold">
                    ${selectedCode.price.toFixed(2)}
                  </span>
                </div>

                {/* Tooth picker */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-gray-500">
                      Tooth (FDI)
                    </label>
                    <button
                      onClick={() => setShowToothPicker((v) => !v)}
                      className="text-xs text-teal-600 hover:text-teal-800"
                    >
                      {showToothPicker ? "Hide chart" : "Show chart"}
                    </button>
                  </div>
                  {showToothPicker && (
                    <div className="space-y-1 mb-2">
                      {FDI_TEETH.map((row, ri) => (
                        <div key={ri} className="flex gap-1 justify-center">
                          {row.map((tooth) => (
                            <button
                              key={tooth}
                              onClick={() => setToothInput(String(tooth))}
                              className={`w-7 h-7 text-xs rounded border transition-colors font-mono ${
                                toothInput === String(tooth)
                                  ? "bg-teal-600 text-white border-teal-600"
                                  : "bg-white border-gray-200 hover:border-teal-400 text-gray-600"
                              }`}
                            >
                              {tooth}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                  <input
                    value={toothInput}
                    onChange={(e) => setToothInput(e.target.value)}
                    placeholder="e.g. 36 (optional)"
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>

                <button
                  onClick={() => handleAddItem(addingItemTo)}
                  className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  Add to Visit
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Visit Card ────────────────────────────────────────────────────────────────
interface VisitCardProps {
  visit: TreatmentVisit;
  expanded: boolean;
  onToggle: () => void;
  onComplete: (completed: boolean) => void;
  onDeleteItem: (itemId: string) => void;
  onAddItem: () => void;
  onSaveNotes: () => void;
  editingNotes: boolean;
  onEditNotes: () => void;
  notesDraft: string;
  onNotesDraftChange: (v: string) => void;
  dragging: { itemId: string; fromVisitId: string } | null;
  dragOver: boolean;
  onDragStart: (itemId: string) => void;
  onDragOver: () => void;
  onDrop: () => void;
  isCompleted: boolean;
}

function VisitCard({
  visit,
  expanded,
  onToggle,
  onComplete,
  onDeleteItem,
  onAddItem,
  onSaveNotes,
  editingNotes,
  onEditNotes,
  notesDraft,
  onNotesDraftChange,
  dragging,
  dragOver,
  onDragStart,
  onDragOver,
  onDrop,
  isCompleted,
}: VisitCardProps) {
  const visitTotal = visit.items.reduce((s, i) => s + i.price, 0);
  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-AU", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <div
      className={`rounded-xl border shadow-sm overflow-hidden transition-all ${
        visit.completed
          ? "bg-green-50 border-green-200"
          : dragOver
            ? "bg-teal-50 border-teal-300 border-dashed"
            : "bg-white border-gray-100"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver();
      }}
      onDrop={onDrop}
    >
      {/* Visit header */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
        onClick={onToggle}
      >
        {/* Complete checkbox */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            onComplete(!visit.completed);
          }}
          className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
            visit.completed
              ? "bg-green-500 border-green-500"
              : "border-gray-300 hover:border-teal-400"
          }`}
        >
          {visit.completed && <Check size={12} className="text-white" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`text-sm font-bold ${visit.completed ? "text-green-700" : "text-gray-800"}`}
            >
              Visit {visit.visitNumber}
            </span>
            <span
              className={`text-xs ${visit.completed ? "text-green-600" : "text-gray-400"}`}
            >
              {fmtDate(visit.visitDate)}
            </span>
            {visit.invoiceId && (
              <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                <Receipt size={10} /> Invoice created
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            {visit.items.length} items · ${visitTotal.toFixed(2)}
          </p>
        </div>

        {expanded ? (
          <ChevronUp size={16} className="text-gray-400 shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-gray-400 shrink-0" />
        )}
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 py-4 space-y-4">
          {/* Items table */}
          {visit.items.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-gray-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <th className="px-3 py-2 text-left w-6"></th>
                    <th className="px-3 py-2 text-left">Code</th>
                    <th className="px-3 py-2 text-left">Treatment</th>
                    <th className="px-3 py-2 text-left">Tooth</th>
                    <th className="px-3 py-2 text-right">Price</th>
                    {!isCompleted && <th className="px-3 py-2 w-8"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {visit.items.map((item) => (
                    <tr
                      key={item.id}
                      draggable={!isCompleted}
                      onDragStart={() => onDragStart(item.id)}
                      className={`group transition-colors ${
                        visit.completed
                          ? "bg-green-50/50"
                          : dragging?.itemId === item.id
                            ? "opacity-40"
                            : "hover:bg-gray-50"
                      }`}
                    >
                      <td className="px-3 py-2.5">
                        {!isCompleted && (
                          <GripVertical
                            size={14}
                            className="text-gray-300 cursor-grab group-hover:text-gray-400"
                          />
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="font-mono text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-bold">
                          {item.code}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`font-medium ${visit.completed ? "text-green-800" : "text-gray-700"}`}
                        >
                          {item.name}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="text-xs text-gray-500 font-mono">
                          {item.toothNumber || "—"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <span
                          className={`font-semibold ${visit.completed ? "text-green-700" : "text-teal-600"}`}
                        >
                          ${item.price.toFixed(2)}
                        </span>
                      </td>
                      {!isCompleted && (
                        <td className="px-3 py-2.5">
                          <button
                            onClick={() => onDeleteItem(item.id)}
                            className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-200 bg-gray-50">
                    <td colSpan={isCompleted ? 3 : 3} className="px-3 py-2" />
                    <td className="px-3 py-2 text-xs font-bold text-gray-500 uppercase text-right">
                      Total
                    </td>
                    <td className="px-3 py-2 text-right font-bold text-gray-800">
                      ${visitTotal.toFixed(2)}
                    </td>
                    {!isCompleted && <td />}
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="text-center py-6 text-gray-300 border border-dashed border-gray-200 rounded-lg">
              <AlertCircle size={24} className="mx-auto mb-1" />
              <p className="text-xs">
                No items yet — drag from another visit or add below
              </p>
            </div>
          )}

          {/* Add item button */}
          {!isCompleted && (
            <button
              onClick={onAddItem}
              className="flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-800 font-medium transition-colors"
            >
              <Plus size={13} /> Add treatment item
            </button>
          )}

          {/* Notes */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <FileText size={13} className="text-gray-400" />
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Notes
              </span>
            </div>
            {editingNotes ? (
              <div className="space-y-2">
                <textarea
                  autoFocus
                  value={notesDraft}
                  onChange={(e) => onNotesDraftChange(e.target.value)}
                  rows={3}
                  placeholder="Clinical notes for this visit…"
                  className="w-full text-sm border border-gray-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-teal-400 resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={onSaveNotes}
                    className="flex items-center gap-1.5 text-xs bg-teal-600 text-white px-3 py-1.5 rounded-lg hover:bg-teal-700 transition-colors font-medium"
                  >
                    <Save size={12} /> Save
                  </button>
                  <button
                    onClick={() => onNotesDraftChange("")}
                    className="text-xs border border-gray-200 text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={onEditNotes}
                className="w-full text-left text-sm text-gray-400 hover:text-gray-600 transition-colors bg-gray-50 hover:bg-gray-100 rounded-lg px-3 py-2.5 border border-dashed border-gray-200"
              >
                {visit.notes || "Click to add notes…"}
              </button>
            )}
          </div>

          {/* Media placeholder */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Image size={13} className="text-gray-400" />
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Visit Media
              </span>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-16 h-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center"
                >
                  <Image size={16} className="text-gray-300" />
                </div>
              ))}
              <div className="w-16 h-16 bg-gray-50 rounded-lg border border-dashed border-gray-200 flex items-center justify-center">
                <Plus size={16} className="text-gray-300" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
