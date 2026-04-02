"use client";

import { useState, useEffect } from "react";
import {
  Receipt, Check, ChevronDown, ChevronUp, Edit2, X, Save,
  ExternalLink, AlertCircle, Clock, CheckCircle2, FileText
} from "lucide-react";
import { Patient } from "../types/index";

interface InvoiceItem {
  id: string;
  invoiceId: string;
  code: string;
  name: string;
  toothNumber: string;
  price: number;
}

interface Invoice {
  id: string;
  visitId: string;
  visitNumber: number;
  visitDate: string;
  total: number;
  status: "unpaid" | "paid" | "overdue";
  issuedAt: string;
  dueDate: string | null;
  medicareRebate: number;
  dvaRebate: number;
  notes: string;
  invoiceNumber: string;
  items: InvoiceItem[];
}

interface Props {
  patientId: string;
  patient: Patient;
}

const STATUS_STYLES = {
  unpaid: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    icon: Clock,
  },
  paid: {
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-700",
    badge: "bg-green-100 text-green-700 border-green-200",
    icon: CheckCircle2,
  },
  overdue: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
    badge: "bg-red-100 text-red-700 border-red-200",
    icon: AlertCircle,
  },
};

export default function InvoicesTab({ patientId, patient }: Props) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<Invoice>>({});

  useEffect(() => {
    fetch(`/api/patients/${patientId}/invoices`)
      .then((r) => r.json())
      .then(({ invoices: raw, items }) => {
        const merged: Invoice[] = raw.map((inv: any) => ({
          id: inv.id,
          visitId: inv.visit_id,
          visitNumber: inv.visit_number,
          visitDate: inv.visit_date,
          total: Number(inv.total),
          status: inv.status,
          issuedAt: inv.issued_at,
          dueDate: inv.due_date ?? null,
          medicareRebate: Number(inv.medicare_rebate ?? 0),
          dvaRebate: Number(inv.dva_rebate ?? 0),
          notes: inv.notes ?? "",
          invoiceNumber: inv.invoice_number ?? `INV-${inv.id.slice(0, 6).toUpperCase()}`,
          items: items
            .filter((i: any) => i.invoice_id === inv.id)
            .map((i: any) => ({
              id: i.id,
              invoiceId: i.invoice_id,
              code: i.code,
              name: i.name,
              toothNumber: i.tooth_number ?? "",
              price: Number(i.price),
            })),
        }));
        setInvoices(merged);
        if (merged.length > 0) setExpandedIds([merged[0].id]);
        setLoading(false);
      });
  }, [patientId]);

  const totalOwing = invoices
    .filter((i) => i.status !== "paid")
    .reduce((s, i) => s + i.total - i.medicareRebate - i.dvaRebate, 0);

  const totalPaid = invoices
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + i.total, 0);

  function toggleExpand(id: string) {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  }

  async function handleStatusChange(invoiceId: string, status: Invoice["status"]) {
    const res = await fetch(`/api/invoices/${invoiceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const updated = await res.json();
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === invoiceId ? { ...inv, status: updated.status } : inv))
    );
  }

  function startEdit(invoice: Invoice) {
    setEditingId(invoice.id);
    setEditDraft({
      issuedAt: invoice.issuedAt?.split("T")[0] ?? "",
      dueDate: invoice.dueDate ?? "",
      medicareRebate: invoice.medicareRebate,
      dvaRebate: invoice.dvaRebate,
      notes: invoice.notes,
    });
  }

  async function saveEdit(invoiceId: string) {
    const res = await fetch(`/api/invoices/${invoiceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        issuedAt: editDraft.issuedAt,
        dueDate: editDraft.dueDate || null,
        medicareRebate: editDraft.medicareRebate,
        dvaRebate: editDraft.dvaRebate,
        notes: editDraft.notes,
      }),
    });
    const updated = await res.json();
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId
          ? {
              ...inv,
              issuedAt: updated.issued_at,
              dueDate: updated.due_date,
              medicareRebate: Number(updated.medicare_rebate),
              dvaRebate: Number(updated.dva_rebate),
              notes: updated.notes,
            }
          : inv
      )
    );
    setEditingId(null);
  }

  function openPDF(invoice: Invoice) {
    const params = new URLSearchParams({
      invoiceId: invoice.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      patientAddress: patient.address,
      patientEmail: patient.email,
      patientPhone: patient.phone,
      patientDob: patient.dob,
    });
    window.open(`/invoice-pdf?${params.toString()}`, "_blank");
  }

  const fmtDate = (d: string | null) =>
    d
      ? new Date(d).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })
      : "—";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm">Loading invoices…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Invoices</p>
          <p className="text-3xl font-bold text-gray-800">{invoices.length}</p>
          <p className="text-xs text-gray-400 mt-1">
            {invoices.filter((i) => i.status === "paid").length} paid ·{" "}
            {invoices.filter((i) => i.status === "unpaid").length} unpaid ·{" "}
            {invoices.filter((i) => i.status === "overdue").length} overdue
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Outstanding</p>
          <p className="text-3xl font-bold text-amber-600">${totalOwing.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-1">after rebates</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Paid</p>
          <p className="text-3xl font-bold text-teal-600">${totalPaid.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-1">lifetime</p>
        </div>
      </div>

      {/* Invoice list */}
      {invoices.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200 text-gray-400">
          <Receipt size={36} className="mx-auto mb-2 text-gray-200" />
          <p className="text-sm font-medium">No invoices yet</p>
          <p className="text-xs mt-1">Invoices are created automatically when a visit is completed</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((invoice) => {
            const style = STATUS_STYLES[invoice.status];
            const StatusIcon = style.icon;
            const isExpanded = expandedIds.includes(invoice.id);
            const isEditing = editingId === invoice.id;
            const patientOwes = invoice.total - invoice.medicareRebate - invoice.dvaRebate;

            return (
              <div
                key={invoice.id}
                className={`rounded-xl border shadow-sm overflow-hidden ${style.bg} ${style.border}`}
              >
                {/* Header */}
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
                  onClick={() => toggleExpand(invoice.id)}
                >
                  {/* Status checkbox */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusChange(
                        invoice.id,
                        invoice.status === "paid" ? "unpaid" : "paid"
                      );
                    }}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                      invoice.status === "paid"
                        ? "bg-green-500 border-green-500"
                        : "border-gray-300 hover:border-teal-400 bg-white"
                    }`}
                  >
                    {invoice.status === "paid" && <Check size={12} className="text-white" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-bold ${style.text}`}>
                        {invoice.invoiceNumber}
                      </span>
                      <span className="text-xs text-gray-500">
                        Visit {invoice.visitNumber} · {fmtDate(invoice.visitDate)}
                      </span>
                      <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${style.badge}`}>
                        <StatusIcon size={10} />
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Issued {fmtDate(invoice.issuedAt)}
                      {invoice.dueDate ? ` · Due ${fmtDate(invoice.dueDate)}` : ""}
                      {" · "}
                      {invoice.items.length} items · Patient owes{" "}
                      <span className={`font-semibold ${style.text}`}>${patientOwes.toFixed(2)}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); openPDF(invoice); }}
                      className="flex items-center gap-1.5 text-xs border border-gray-200 bg-white text-gray-600 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      <ExternalLink size={12} /> PDF
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); startEdit(invoice); }}
                      className="flex items-center gap-1.5 text-xs border border-gray-200 bg-white text-gray-600 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      <Edit2 size={12} /> Edit
                    </button>
                    {isExpanded ? (
                      <ChevronUp size={16} className="text-gray-400" />
                    ) : (
                      <ChevronDown size={16} className="text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Expanded */}
                {isExpanded && (
                  <div className="border-t border-gray-200/60 bg-white/60 px-4 py-4 space-y-4">

                    {/* Items table */}
                    <div className="overflow-hidden rounded-lg border border-gray-100">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wider">
                            <th className="px-3 py-2 text-left">Code</th>
                            <th className="px-3 py-2 text-left">Treatment</th>
                            <th className="px-3 py-2 text-left">Tooth</th>
                            <th className="px-3 py-2 text-right">Qty</th>
                            <th className="px-3 py-2 text-right">Price</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {invoice.items.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="px-3 py-2.5">
                                <span className="font-mono text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-bold">
                                  {item.code}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 font-medium text-gray-700">{item.name}</td>
                              <td className="px-3 py-2.5 text-xs text-gray-500 font-mono">
                                {item.toothNumber || "—"}
                              </td>
                              <td className="px-3 py-2.5 text-right text-gray-500">1</td>
                              <td className="px-3 py-2.5 text-right font-semibold text-gray-800">
                                ${item.price.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="border-t border-gray-200">
                          <tr>
                            <td colSpan={4} className="px-3 py-2 text-xs text-right text-gray-500 font-semibold">Subtotal</td>
                            <td className="px-3 py-2 text-right font-bold text-gray-800">${invoice.total.toFixed(2)}</td>
                          </tr>
                          {invoice.medicareRebate > 0 && (
                            <tr>
                              <td colSpan={4} className="px-3 py-1.5 text-xs text-right text-blue-600 font-semibold">Medicare Rebate</td>
                              <td className="px-3 py-1.5 text-right text-blue-600 font-semibold">−${invoice.medicareRebate.toFixed(2)}</td>
                            </tr>
                          )}
                          {invoice.dvaRebate > 0 && (
                            <tr>
                              <td colSpan={4} className="px-3 py-1.5 text-xs text-right text-purple-600 font-semibold">DVA Rebate</td>
                              <td className="px-3 py-1.5 text-right text-purple-600 font-semibold">−${invoice.dvaRebate.toFixed(2)}</td>
                            </tr>
                          )}
                          <tr className="bg-gray-50">
                            <td colSpan={4} className="px-3 py-2.5 text-right text-sm font-bold text-gray-700">Patient Owes</td>
                            <td className={`px-3 py-2.5 text-right text-sm font-bold ${style.text}`}>
                              ${(invoice.total - invoice.medicareRebate - invoice.dvaRebate).toFixed(2)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Status selector */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs font-semibold text-gray-500">Status:</span>
                      {(["unpaid", "paid", "overdue"] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => handleStatusChange(invoice.id, s)}
                          className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors capitalize ${
                            invoice.status === s
                              ? STATUS_STYLES[s].badge
                              : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>

                    {/* Notes */}
                    {invoice.notes && (
                      <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2.5 flex gap-2">
                        <FileText size={14} className="text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-800">{invoice.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit modal */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-4 flex items-center justify-between">
              <h2 className="text-white font-bold">Edit Invoice</h2>
              <button onClick={() => setEditingId(null)} className="text-white/80 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                  Issue Date
                </label>
                <input
                  type="date"
                  value={editDraft.issuedAt as string}
                  onChange={(e) => setEditDraft((d) => ({ ...d, issuedAt: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={editDraft.dueDate as string ?? ""}
                  onChange={(e) => setEditDraft((d) => ({ ...d, dueDate: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                    Medicare Rebate ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editDraft.medicareRebate ?? 0}
                    onChange={(e) => setEditDraft((d) => ({ ...d, medicareRebate: Number(e.target.value) }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                    DVA Rebate ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editDraft.dvaRebate ?? 0}
                    onChange={(e) => setEditDraft((d) => ({ ...d, dvaRebate: Number(e.target.value) }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                  Notes
                </label>
                <textarea
                  rows={3}
                  value={editDraft.notes as string}
                  onChange={(e) => setEditDraft((d) => ({ ...d, notes: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400 resize-none"
                  placeholder="Payment notes, reference numbers…"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setEditingId(null)}
                  className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => saveEdit(editingId)}
                  className="flex-1 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:opacity-90 flex items-center justify-center gap-2"
                >
                  <Save size={14} /> Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}