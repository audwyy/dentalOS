"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

interface InvoiceItem {
  id: string;
  code: string;
  name: string;
  toothNumber: string;
  price: number;
}

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  visitNumber: number;
  visitDate: string;
  issuedAt: string;
  dueDate: string | null;
  total: number;
  medicareRebate: number;
  dvaRebate: number;
  status: string;
  notes: string;
  items: InvoiceItem[];
  // Patient
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  dob: string;
}

const CLINIC = {
  name: "Smile Dental Clinic",
  address: "123 Main Street, Sydney NSW 2000",
  phone: "(02) 9000 0000",
  email: "hello@smileclinic.com.au",
  abn: "12 345 678 901",
  providerNumber: "1234567A",
};

function InvoicePDFContent() {
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get("invoiceId");
  const [data, setData] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!invoiceId) {
      setError("No invoice ID");
      setLoading(false);
      return;
    }
    fetch(`/api/invoices/${invoiceId}`)
      .then((r) => r.json())
      .then(({ invoice, items }) => {
        setData({
          id: invoice.id,
          invoiceNumber:
            invoice.invoice_number ??
            `INV-${invoice.id.slice(0, 6).toUpperCase()}`,
          visitNumber: invoice.visit_number,
          visitDate: invoice.visit_date,
          issuedAt: invoice.issued_at,
          dueDate: invoice.due_date ?? null,
          total: Number(invoice.total),
          medicareRebate: Number(invoice.medicare_rebate ?? 0),
          dvaRebate: Number(invoice.dva_rebate ?? 0),
          status: invoice.status,
          notes: invoice.notes ?? "",
          items: items.map((i: any) => ({
            id: i.id,
            code: i.code,
            name: i.name,
            toothNumber: i.tooth_number ?? "",
            price: Number(i.price),
          })),
          firstName: invoice.first_name,
          lastName: invoice.last_name,
          email: invoice.email,
          phone: invoice.phone,
          address: invoice.address,
          dob: invoice.dob,
        });
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load invoice");
        setLoading(false);
      });
  }, [invoiceId]);

  useEffect(() => {
    if (data) {
      document.title = `Invoice ${data.invoiceNumber} - ${data.firstName} ${data.lastName}`;
    }
  }, [data]);

  const fmtDate = (d: string | null) =>
    d
      ? new Date(d).toLocaleDateString("en-AU", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "—";

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center text-gray-400">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm">Loading invoice…</p>
        </div>
      </div>
    );

  if (error || !data)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 text-red-500">
        {error}
      </div>
    );

  const patientOwes = data.total - data.medicareRebate - data.dvaRebate;

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 print:bg-white print:p-0 print:py-0">
      {/* Print button - hidden when printing */}
      <div className="max-w-3xl mx-auto mb-4 flex justify-end gap-3 print:hidden">
        <button
          onClick={() => window.print()}
          className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-teal-700 transition-colors"
        >
          Print / Save as PDF
        </button>
      </div>

      {/* Invoice document */}
      <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-2xl overflow-hidden print:shadow-none print:rounded-none">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-10 py-8 flex items-start justify-between">
          <div>
            <h1 className="text-white font-black text-2xl tracking-tight">
              {CLINIC.name}
            </h1>
            <p className="text-white/80 text-sm mt-1">{CLINIC.address}</p>
            <p className="text-white/70 text-xs mt-0.5">
              {CLINIC.phone} · {CLINIC.email}
            </p>
            <p className="text-white/60 text-xs mt-0.5">
              ABN: {CLINIC.abn} · Provider: {CLINIC.providerNumber}
            </p>
          </div>
          <div className="text-right">
            <div className="bg-white/20 border border-white/30 rounded-xl px-5 py-3 inline-block">
              <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">
                Invoice
              </p>
              <p className="text-white font-black text-xl">
                {data.invoiceNumber}
              </p>
            </div>
          </div>
        </div>

        <div className="px-10 py-8 space-y-8">
          {/* Bill to + dates */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                Bill To
              </p>
              <p className="font-bold text-gray-900 text-lg">
                {data.firstName} {data.lastName}
              </p>
              <p className="text-sm text-gray-600 mt-0.5">{data.address}</p>
              <p className="text-sm text-gray-600">{data.phone}</p>
              <p className="text-sm text-gray-600">{data.email}</p>
              <p className="text-sm text-gray-500 mt-1">
                DOB: {fmtDate(data.dob)}
              </p>
            </div>
            <div className="text-right space-y-2">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Issue Date
                </p>
                <p className="text-sm font-semibold text-gray-800">
                  {fmtDate(data.issuedAt)}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Due Date
                </p>
                <p className="text-sm font-semibold text-gray-800">
                  {fmtDate(data.dueDate)}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Visit
                </p>
                <p className="text-sm font-semibold text-gray-800">
                  Visit {data.visitNumber} · {fmtDate(data.visitDate)}
                </p>
              </div>
              <div>
                <span
                  className={`inline-block text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                    data.status === "paid"
                      ? "bg-green-100 text-green-700"
                      : data.status === "overdue"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {data.status}
                </span>
              </div>
            </div>
          </div>

          {/* Items table */}
          <div>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 text-xs font-bold text-gray-400 uppercase tracking-wider w-20">
                    Code
                  </th>
                  <th className="text-left py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Treatment
                  </th>
                  <th className="text-left py-3 text-xs font-bold text-gray-400 uppercase tracking-wider w-20">
                    Tooth
                  </th>
                  <th className="text-right py-3 text-xs font-bold text-gray-400 uppercase tracking-wider w-12">
                    Qty
                  </th>
                  <th className="text-right py-3 text-xs font-bold text-gray-400 uppercase tracking-wider w-24">
                    Unit Price
                  </th>
                  <th className="text-right py-3 text-xs font-bold text-gray-400 uppercase tracking-wider w-24">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.items.map((item, idx) => (
                  <tr
                    key={item.id}
                    className={idx % 2 === 0 ? "" : "bg-gray-50/50"}
                  >
                    <td className="py-3">
                      <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-bold">
                        {item.code}
                      </span>
                    </td>
                    <td className="py-3 font-medium text-gray-800">
                      {item.name}
                    </td>
                    <td className="py-3 font-mono text-sm text-gray-500">
                      {item.toothNumber || "—"}
                    </td>
                    <td className="py-3 text-right text-gray-500">1</td>
                    <td className="py-3 text-right text-gray-800">
                      ${item.price.toFixed(2)}
                    </td>
                    <td className="py-3 text-right font-semibold text-gray-900">
                      ${item.price.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-72 space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span className="font-semibold">${data.total.toFixed(2)}</span>
              </div>
              {data.medicareRebate > 0 && (
                <div className="flex justify-between text-sm text-blue-600">
                  <span>Medicare Rebate</span>
                  <span className="font-semibold">
                    −${data.medicareRebate.toFixed(2)}
                  </span>
                </div>
              )}
              {data.dvaRebate > 0 && (
                <div className="flex justify-between text-sm text-purple-600">
                  <span>DVA Rebate</span>
                  <span className="font-semibold">
                    −${data.dvaRebate.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="border-t-2 border-gray-200 pt-2 flex justify-between">
                <span className="font-bold text-gray-900">Patient Owes</span>
                <span className="font-black text-teal-600 text-lg">
                  ${patientOwes.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {data.notes && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
                Notes
              </p>
              <p className="text-sm text-amber-800">{data.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-gray-100 pt-6 text-center">
            <p className="text-xs text-gray-400">
              Thank you for choosing {CLINIC.name}. For enquiries, contact us at{" "}
              {CLINIC.email} or {CLINIC.phone}.
            </p>
            <p className="text-xs text-gray-300 mt-1">
              {CLINIC.name} · ABN {CLINIC.abn} · Provider{" "}
              {CLINIC.providerNumber}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InvoicePDFPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-gray-100 text-gray-400">
          Loading…
        </div>
      }
    >
      <InvoicePDFContent />
    </Suspense>
  );
}
