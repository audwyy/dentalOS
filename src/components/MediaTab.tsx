"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Upload,
  X,
  Edit2,
  Save,
  ChevronLeft,
  ChevronRight,
  Filter,
  Image,
  ZoomIn,
  Calendar,
  Link2,
  Trash2,
} from "lucide-react";

type MediaType = "intraoral_xray" | "opg_xray" | "cbct" | "photo";

interface MediaItem {
  id: string;
  url: string;
  filename: string;
  mediaType: MediaType;
  takenDate: string;
  visitId: string | null;
  visitNumber: number | null;
  sizeBytes: number;
  createdAt: string;
}

interface Visit {
  id: string;
  visitNumber: number;
  visitDate: string;
}

interface Props {
  patientId: string;
}

const MEDIA_TYPES: { value: MediaType; label: string; icon: string }[] = [
  { value: "intraoral_xray", label: "Intraoral X-Ray", icon: "🦷" },
  { value: "opg_xray", label: "OPG X-Ray", icon: "🩻" },
  { value: "cbct", label: "CBCT (3D)", icon: "🔬" },
  { value: "photo", label: "Photo", icon: "📷" },
];

const TYPE_COLORS: Record<MediaType, string> = {
  intraoral_xray: "bg-blue-100 text-blue-700 border-blue-200",
  opg_xray: "bg-purple-100 text-purple-700 border-purple-200",
  cbct: "bg-teal-100 text-teal-700 border-teal-200",
  photo: "bg-amber-100 text-amber-700 border-amber-200",
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fmtBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export default function MediaTab({ patientId }: Props) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<MediaType | "all">("all");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null); // index into filtered
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{
    takenDate: string;
    mediaType: MediaType;
    visitId: string;
  }>({
    takenDate: "",
    mediaType: "photo",
    visitId: "",
  });

  // Upload modal state
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadType, setUploadType] = useState<MediaType>("photo");
  const [uploadDate, setUploadDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [uploadVisitId, setUploadVisitId] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/patients/${patientId}/media`).then((r) => r.json()),
      fetch(`/api/patients/${patientId}/treatment`).then((r) => r.json()),
    ]).then(([mediaRows, treatmentData]) => {
      setMedia(
        mediaRows.map((r: any) => ({
          id: r.id,
          url: r.url,
          filename: r.filename,
          mediaType: r.media_type,
          takenDate: r.taken_date,
          visitId: r.visit_id,
          visitNumber: r.visit_number,
          sizeBytes: r.size_bytes ?? 0,
          createdAt: r.created_at,
        }))
      );
      setVisits(
        treatmentData.visits.map((v: any) => ({
          id: v.id,
          visitNumber: v.visit_number,
          visitDate: v.visit_date,
        }))
      );
      setLoading(false);
    });
  }, [patientId]);

  const filtered = media.filter(
    (m) => filterType === "all" || m.mediaType === filterType
  );

  // Handle file selection
  function handleFiles(files: FileList | File[]) {
    const arr = Array.from(files).filter(
      (f) => f.type.startsWith("image/") || f.type === "application/dicom"
    );
    setUploadFiles(arr);
    setShowUpload(true);
  }

  async function handleUpload() {
    if (!uploadFiles.length) return;
    setUploading(true);
    const newItems: MediaItem[] = [];

    for (const file of uploadFiles) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mediaType", uploadType);
      formData.append("takenDate", uploadDate);
      if (uploadVisitId) formData.append("visitId", uploadVisitId);

      const res = await fetch(`/api/patients/${patientId}/media`, {
        method: "POST",
        body: formData,
      });
      const row = await res.json();
      newItems.push({
        id: row.id,
        url: row.url,
        filename: row.filename,
        mediaType: row.media_type,
        takenDate: row.taken_date,
        visitId: row.visit_id,
        visitNumber:
          visits.find((v) => v.id === row.visit_id)?.visitNumber ?? null,
        sizeBytes: row.size_bytes ?? 0,
        createdAt: row.created_at,
      });
    }

    setMedia((prev) => [...newItems, ...prev]);
    setShowUpload(false);
    setUploadFiles([]);
    setUploading(false);
  }

  async function handleEdit(mediaId: string) {
    const res = await fetch(`/api/media/${mediaId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        takenDate: editDraft.takenDate,
        mediaType: editDraft.mediaType,
        visitId: editDraft.visitId || null,
      }),
    });
    const row = await res.json();
    setMedia((prev) =>
      prev.map((m) =>
        m.id === mediaId
          ? {
              ...m,
              takenDate: row.taken_date,
              mediaType: row.media_type,
              visitId: row.visit_id,
              visitNumber:
                visits.find((v) => v.id === row.visit_id)?.visitNumber ?? null,
            }
          : m
      )
    );
    setEditingId(null);
  }

  async function handleDelete(mediaId: string) {
    await fetch(`/api/media/${mediaId}`, { method: "DELETE" });
    setMedia((prev) => prev.filter((m) => m.id !== mediaId));
    if (lightbox !== null) setLightbox(null);
  }

  // Lightbox navigation
  function lightboxNext() {
    if (lightbox === null) return;
    setLightbox((lightbox + 1) % filtered.length);
  }
  function lightboxPrev() {
    if (lightbox === null) return;
    setLightbox((lightbox - 1 + filtered.length) % filtered.length);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (lightbox === null) return;
      if (e.key === "ArrowRight") lightboxNext();
      if (e.key === "ArrowLeft") lightboxPrev();
      if (e.key === "Escape") setLightbox(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, filtered.length]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm">Loading media…</p>
        </div>
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Filter */}
        <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
          <button
            onClick={() => setFilterType("all")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              filterType === "all"
                ? "bg-white shadow-sm text-teal-700"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            All ({media.length})
          </button>
          {MEDIA_TYPES.map((t) => {
            const count = media.filter((m) => m.mediaType === t.value).length;
            return (
              <button
                key={t.value}
                onClick={() => setFilterType(t.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  filterType === t.value
                    ? "bg-white shadow-sm text-teal-700"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t.icon} {t.label} ({count})
              </button>
            );
          })}
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="ml-auto flex items-center gap-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Upload size={15} /> Upload Media
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.dcm"
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {/* Drag & drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${
          dragOver
            ? "border-teal-400 bg-teal-50"
            : "border-gray-200 bg-gray-50 hover:border-gray-300"
        }`}
      >
        <Upload
          size={28}
          className={`mx-auto mb-2 ${dragOver ? "text-teal-500" : "text-gray-300"}`}
        />
        <p
          className={`text-sm font-medium ${dragOver ? "text-teal-600" : "text-gray-400"}`}
        >
          {dragOver ? "Drop to upload" : "Drag & drop images here"}
        </p>
        <p className="text-xs text-gray-300 mt-1">
          or use the Upload button above
        </p>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Image size={36} className="mx-auto mb-2 text-gray-200" />
          <p className="text-sm font-medium">No media found</p>
          <p className="text-xs mt-1">Upload images using the button above</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filtered.map((item, idx) => (
            <div
              key={item.id}
              className="group relative bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
            >
              {/* Thumbnail */}
              <div
                className="aspect-square bg-gray-100 cursor-pointer overflow-hidden relative"
                onClick={() => setLightbox(idx)}
              >
                <img
                  src={item.url}
                  alt={item.filename}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <ZoomIn
                    size={24}
                    className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </div>
              </div>

              {/* Info */}
              <div className="p-2.5 space-y-1.5">
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${TYPE_COLORS[item.mediaType]}`}
                  >
                    {MEDIA_TYPES.find((t) => t.value === item.mediaType)?.icon}{" "}
                    {MEDIA_TYPES.find((t) => t.value === item.mediaType)?.label}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Calendar size={10} className="shrink-0" />
                  <span>{fmtDate(item.takenDate)}</span>
                </div>
                {item.visitNumber && (
                  <div className="flex items-center gap-1 text-xs text-teal-600">
                    <Link2 size={10} className="shrink-0" />
                    <span>Visit {item.visitNumber}</span>
                  </div>
                )}
                <p className="text-[10px] text-gray-300 truncate">
                  {item.filename}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-1 pt-0.5">
                  <button
                    onClick={() => {
                      setEditingId(item.id);
                      setEditDraft({
                        takenDate: item.takenDate,
                        mediaType: item.mediaType,
                        visitId: item.visitId ?? "",
                      });
                    }}
                    className="flex-1 flex items-center justify-center gap-1 text-[10px] border border-gray-200 text-gray-500 py-1 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Edit2 size={10} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="flex items-center justify-center w-6 h-6 border border-gray-200 text-gray-400 rounded-lg hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-4 flex items-center justify-between">
              <h2 className="text-white font-bold">Upload Media</h2>
              <button
                onClick={() => {
                  setShowUpload(false);
                  setUploadFiles([]);
                }}
                className="text-white/80 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* File list */}
              <div className="bg-gray-50 rounded-xl p-3 space-y-1.5 max-h-36 overflow-y-auto">
                {uploadFiles.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-sm text-gray-700"
                  >
                    <span className="truncate flex-1">{f.name}</span>
                    <span className="text-xs text-gray-400 ml-2 shrink-0">
                      {fmtBytes(f.size)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Media type */}
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                  Media Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {MEDIA_TYPES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setUploadType(t.value)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                        uploadType === t.value
                          ? "border-teal-400 bg-teal-50 text-teal-700"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <span>{t.icon}</span> {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                  Date Taken
                </label>
                <input
                  type="date"
                  value={uploadDate}
                  onChange={(e) => setUploadDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>

              {/* Link to visit */}
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                  Link to Visit (optional)
                </label>
                <select
                  value={uploadVisitId}
                  onChange={(e) => setUploadVisitId(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400"
                >
                  <option value="">No visit</option>
                  {visits.map((v) => (
                    <option key={v.id} value={v.id}>
                      Visit {v.visitNumber} — {fmtDate(v.visitDate)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowUpload(false);
                    setUploadFiles([]);
                  }}
                  className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex-1 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{" "}
                      Uploading…
                    </>
                  ) : (
                    <>
                      <Upload size={14} /> Upload {uploadFiles.length} file
                      {uploadFiles.length !== 1 ? "s" : ""}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-4 flex items-center justify-between">
              <h2 className="text-white font-bold">Edit Media</h2>
              <button
                onClick={() => setEditingId(null)}
                className="text-white/80 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                  Media Type
                </label>
                <select
                  value={editDraft.mediaType}
                  onChange={(e) =>
                    setEditDraft((d) => ({
                      ...d,
                      mediaType: e.target.value as MediaType,
                    }))
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400"
                >
                  {MEDIA_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.icon} {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                  Date Taken
                </label>
                <input
                  type="date"
                  value={editDraft.takenDate}
                  onChange={(e) =>
                    setEditDraft((d) => ({ ...d, takenDate: e.target.value }))
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                  Link to Visit
                </label>
                <select
                  value={editDraft.visitId}
                  onChange={(e) =>
                    setEditDraft((d) => ({ ...d, visitId: e.target.value }))
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400"
                >
                  <option value="">No visit</option>
                  {visits.map((v) => (
                    <option key={v.id} value={v.id}>
                      Visit {v.visitNumber} — {fmtDate(v.visitDate)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setEditingId(null)}
                  className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleEdit(editingId)}
                  className="flex-1 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:opacity-90 flex items-center justify-center gap-2"
                >
                  <Save size={14} /> Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox !== null && filtered[lightbox] && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          {/* Close */}
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 rounded-full p-2"
          >
            <X size={20} />
          </button>

          {/* Prev */}
          {filtered.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                lightboxPrev();
              }}
              className="absolute left-4 text-white/70 hover:text-white bg-white/10 rounded-full p-3"
            >
              <ChevronLeft size={24} />
            </button>
          )}

          {/* Image */}
          <div
            className="max-w-4xl max-h-[80vh] flex flex-col items-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={filtered[lightbox].url}
              alt={filtered[lightbox].filename}
              className="max-h-[70vh] max-w-full object-contain rounded-xl"
            />
            <div className="flex items-center gap-4 text-white/80 text-sm">
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded border ${TYPE_COLORS[filtered[lightbox].mediaType]}`}
              >
                {
                  MEDIA_TYPES.find(
                    (t) => t.value === filtered[lightbox].mediaType
                  )?.icon
                }{" "}
                {
                  MEDIA_TYPES.find(
                    (t) => t.value === filtered[lightbox].mediaType
                  )?.label
                }
              </span>
              <span>{fmtDate(filtered[lightbox].takenDate)}</span>
              {filtered[lightbox].visitNumber && (
                <span className="text-teal-400">
                  Visit {filtered[lightbox].visitNumber}
                </span>
              )}
              <span className="text-white/40">
                {filtered[lightbox].filename}
              </span>
              <span className="text-white/30">
                {lightbox + 1} / {filtered.length}
              </span>
              <button
                onClick={() => handleDelete(filtered[lightbox].id)}
                className="text-red-400 hover:text-red-300 flex items-center gap-1 ml-2"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>

          {/* Next */}
          {filtered.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                lightboxNext();
              }}
              className="absolute right-4 text-white/70 hover:text-white bg-white/10 rounded-full p-3"
            >
              <ChevronRight size={24} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
