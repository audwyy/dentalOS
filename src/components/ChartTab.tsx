"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Save, X, RotateCcw } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Surface = "M" | "O" | "D" | "B" | "L";
type Condition = "caries" | "filling" | "crown" | "missing";
type ChartMode = "status" | "treatment";

interface SurfaceEntry {
  surface: Surface | "whole";
  condition: Condition;
}

interface ToothData {
  [toothNumber: number]: SurfaceEntry[];
}

interface Popup {
  toothNumber: number;
  surface: Surface | "whole";
  x: number;
  y: number;
}

interface Props {
  patientId: string;
  // treatment_items keyed by tooth number for treatment chart overlay
  treatmentItems?: { toothNumber: string; type: string }[];
}

// ─── FDI layout ───────────────────────────────────────────────────────────────
const UPPER_TEETH = [
  18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,
];
const LOWER_TEETH = [
  48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38,
];

// ─── Colours ─────────────────────────────────────────────────────────────────
const CONDITION_COLORS: Record<Condition, string> = {
  caries: "#8B4513", // brown
  filling: "#4A90D9", // blue
  crown: "#E91E8C", // pink
  missing: "#EF4444", // red (used for line)
};

const CONDITION_LABELS: Record<Condition, string> = {
  caries: "Caries",
  filling: "Filling",
  crown: "Crown",
  missing: "Missing",
};

// ─── Surface hit areas inside a tooth square (SVG coords, tooth = 40x40) ─────
// We draw a diamond/cross shape divided into 5 triangles:
// Top=B, Bottom=L, Left=M, Right=D, Center=O
// (for upper teeth: B=buccal on top, L=lingual on bottom)
// (labels flip for lower arch but colours stay consistent)

function getSurfacePath(surface: Surface): string {
  // Tooth viewBox: 0 0 40 40
  const cx = 20,
    cy = 20,
    r = 14;
  switch (surface) {
    case "B":
      return `M ${cx},${cy} L ${cx - r},${cy - r} L ${cx + r},${cy - r} Z`; // top triangle
    case "L":
      return `M ${cx},${cy} L ${cx - r},${cy + r} L ${cx + r},${cy + r} Z`; // bottom triangle
    case "M":
      return `M ${cx},${cy} L ${cx - r},${cy - r} L ${cx - r},${cy + r} Z`; // left triangle
    case "D":
      return `M ${cx},${cy} L ${cx + r},${cy - r} L ${cx + r},${cy + r} Z`; // right triangle
    case "O":
      return `M ${cx - 7},${cy - 7} L ${cx + 7},${cy - 7} L ${cx + 7},${cy + 7} L ${cx - 7},${cy + 7} Z`; // center square
    default:
      return "";
  }
}

function getSurfaceHitArea(surface: Surface): string {
  return getSurfacePath(surface);
}

function getSurfaceFromPoint(x: number, y: number): Surface {
  // x,y relative to tooth centre (0,0), range roughly -14..14
  const absX = Math.abs(x),
    absY = Math.abs(y);
  // Centre square
  if (absX < 7 && absY < 7) return "O";
  if (absY > absX) return y < 0 ? "B" : "L";
  return x < 0 ? "M" : "D";
}

// ─── Single tooth SVG ─────────────────────────────────────────────────────────
interface ToothProps {
  number: number;
  entries: SurfaceEntry[];
  isUpper: boolean;
  mode: ChartMode;
  onSurfaceClick: (
    tooth: number,
    surface: Surface | "whole",
    e: React.MouseEvent
  ) => void;
  treatmentEntries?: SurfaceEntry[]; // for treatment chart
}

function ToothSVG({
  number,
  entries,
  isUpper,
  mode,
  onSurfaceClick,
  treatmentEntries,
}: ToothProps) {
  const treatmentMode = mode === "treatment";
  const isMissing = entries.some(
    (e) => e.surface === "whole" && e.condition === "missing"
  );
  const hasCariesOnAny =
    treatmentMode && entries.some((e) => e.condition === "caries");
  const surfaces: Surface[] = ["B", "L", "M", "D", "O"];

  function getColor(surface: Surface): string | null {
    if (treatmentMode) {
      const te = treatmentEntries?.find((e) => e.surface === surface);
      if (te) return CONDITION_COLORS[te.condition];
      return null;
    }
    const entry = entries.find((e) => e.surface === surface);
    if (!entry) return null;
    return CONDITION_COLORS[entry.condition]; // 👈 restore brown for caries in status mode
  }

  const numberSpan = (
    <span
      className={`text-[10px] font-mono font-bold ${
        hasCariesOnAny
          ? "bg-red-100 text-red-600 border border-red-400 rounded px-0.5"
          : "text-gray-400"
      }`}
    >
      {number}
    </span>
  );
  return (
    <div className="flex flex-col items-center gap-0.5 select-none">
      {/* Tooth number */}
      {isUpper && numberSpan}

      {/* SVG tooth */}
      <svg
        viewBox="0 0 40 40"
        width="52"
        height="52"
        className="cursor-pointer"
        onClick={(e) => {
          if (isMissing) return;
          const rect = (
            e.currentTarget as SVGSVGElement
          ).getBoundingClientRect();
          const sx = ((e.clientX - rect.left) / rect.width) * 40 - 20;
          const sy = ((e.clientY - rect.top) / rect.height) * 40 - 20;
          const surface = getSurfaceFromPoint(sx, sy);
          onSurfaceClick(number, surface, e);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          onSurfaceClick(number, "whole", e);
        }}
      >
        {/* Outer border */}
        <rect
          x="2"
          y="2"
          width="36"
          height="36"
          rx="4"
          ry="4"
          fill="white"
          stroke={isMissing ? "#EF4444" : "#9CA3AF"}
          strokeWidth={isMissing ? "3" : "1.5"}
        />

        {/* Missing — thick diagonal lines */}
        {isMissing && (
          <>
            <line
              x1="2"
              y1="2"
              x2="38"
              y2="38"
              stroke="#EF4444"
              strokeWidth="3"
            />
            <line
              x1="38"
              y1="2"
              x2="2"
              y2="38"
              stroke="#EF4444"
              strokeWidth="3"
            />
          </>
        )}

        {!isMissing && (
          <>
            {/* Coloured surfaces */}
            {surfaces.map((s) => {
              const color = getColor(s);
              if (!color) return null;
              return (
                <path
                  key={s}
                  d={getSurfacePath(s)}
                  fill={color}
                  opacity="0.85"
                />
              );
            })}

            {/* Surface dividers */}
            {/* Horizontal centre */}
            <line
              x1="6"
              y1="20"
              x2="34"
              y2="20"
              stroke="#D1D5DB"
              strokeWidth="0.75"
            />
            {/* Vertical centre */}
            <line
              x1="20"
              y1="6"
              x2="20"
              y2="34"
              stroke="#D1D5DB"
              strokeWidth="0.75"
            />
            {/* Inner square */}
            <rect
              x="13"
              y="13"
              width="14"
              height="14"
              fill="none"
              stroke="#D1D5DB"
              strokeWidth="0.75"
            />
            {/* Diagonals */}
            <line
              x1="6"
              y1="6"
              x2="13"
              y2="13"
              stroke="#D1D5DB"
              strokeWidth="0.75"
            />
            <line
              x1="34"
              y1="6"
              x2="27"
              y2="13"
              stroke="#D1D5DB"
              strokeWidth="0.75"
            />
            <line
              x1="6"
              y1="34"
              x2="13"
              y2="27"
              stroke="#D1D5DB"
              strokeWidth="0.75"
            />
            <line
              x1="34"
              y1="34"
              x2="27"
              y2="27"
              stroke="#D1D5DB"
              strokeWidth="0.75"
            />

            {/* Crown overlay — pink full fill */}
            {entries.some((e) => e.condition === "crown") && !treatmentMode && (
              <rect
                x="3"
                y="3"
                width="34"
                height="34"
                rx="3"
                fill={CONDITION_COLORS.crown}
                opacity="0.3"
                stroke={CONDITION_COLORS.crown}
                strokeWidth="2"
              />
            )}
          </>
        )}
      </svg>

      {/* Lower number */}
      {!isUpper && numberSpan}
    </div>
  );
}

// ─── Main ChartTab ────────────────────────────────────────────────────────────
export default function ChartTab({ patientId, treatmentItems = [] }: Props) {
  const [chartData, setChartData] = useState<ToothData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle"
  );
  const [popup, setPopup] = useState<Popup | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSaves = useRef<
    Map<
      string,
      { toothNumber: number; surface: string; condition: string | null }
    >
  >(new Map());

  // Load chart data
  useEffect(() => {
    fetch(`/api/patients/${patientId}/chart`)
      .then((r) => r.json())
      .then((rows: any[]) => {
        const data: ToothData = {};
        rows.forEach((row) => {
          if (!data[row.tooth_number]) data[row.tooth_number] = [];
          data[row.tooth_number].push({
            surface: row.surface,
            condition: row.condition,
          });
        });
        setChartData(data);
        setLoading(false);
      });
  }, [patientId]);

  // Debounced save
  const scheduleSave = useCallback(
    (toothNumber: number, surface: string, condition: string | null) => {
      const key = `${toothNumber}-${surface}`;
      pendingSaves.current.set(key, { toothNumber, surface, condition });
      setSaveStatus("saving");

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        const saves = Array.from(pendingSaves.current.values());
        pendingSaves.current.clear();
        setSaving(true);
        await Promise.all(
          saves.map((s) =>
            fetch(`/api/patients/${patientId}/chart`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                toothNumber: s.toothNumber,
                surface: s.surface,
                condition: s.condition,
              }),
            })
          )
        );
        setSaving(false);
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      }, 800);
    },
    [patientId]
  );

  function handleSurfaceClick(
    toothNumber: number,
    surface: Surface | "whole",
    e: React.MouseEvent
  ) {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement)
      .closest(".chart-wrapper")
      ?.getBoundingClientRect();
    const wrapperEl = document.getElementById("chart-wrapper");
    const wrapperRect = wrapperEl?.getBoundingClientRect();
    setPopup({
      toothNumber,
      surface,
      x: e.clientX - (wrapperRect?.left ?? 0),
      y: e.clientY - (wrapperRect?.top ?? 0),
    });
  }

  function handleSetCondition(condition: Condition | null) {
    if (!popup) return;
    const { toothNumber, surface } = popup;

    setChartData((prev) => {
      const entries = [...(prev[toothNumber] ?? [])];

      if (condition === null) {
        // Clear surface
        const filtered = entries.filter((e) => e.surface !== surface);
        return { ...prev, [toothNumber]: filtered };
      }

      if (condition === "missing") {
        // Replace all with whole missing
        return {
          ...prev,
          [toothNumber]: [{ surface: "whole", condition: "missing" }],
        };
      }

      // Remove existing entry for this surface
      const filtered = entries.filter(
        (e) => e.surface !== surface && e.surface !== "whole"
      );
      filtered.push({ surface: surface as Surface, condition });
      return { ...prev, [toothNumber]: filtered };
    });

    scheduleSave(toothNumber, surface, condition);
    setPopup(null);
  }

  function clearTooth(toothNumber: number) {
    setChartData((prev) => ({ ...prev, [toothNumber]: [] }));
    // Delete all surfaces for this tooth
    fetch(`/api/patients/${patientId}/chart`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toothNumber }),
    });
    setPopup(null);
  }

  // Build treatment overlay from treatment_items
  function getTreatmentEntries(toothNumber: number): SurfaceEntry[] {
    const items = treatmentItems.filter(
      (i) => i.toothNumber === String(toothNumber)
    );
    return items.map((i) => ({
      surface: "O" as Surface,
      condition: "filling" as Condition,
    }));
  }

  function renderArch(teeth: number[], isUpper: boolean, chartMode: ChartMode) {
    return (
      <div className="flex items-end justify-center gap-1">
        {teeth.map((num, idx) => (
          <div key={num} className="flex items-center gap-1">
            <ToothSVG
              number={num}
              entries={chartData[num] ?? []}
              isUpper={isUpper}
              mode={chartMode} // 👈 pass chartMode here
              onSurfaceClick={handleSurfaceClick}
              treatmentEntries={getTreatmentEntries(num)}
            />
            {idx === 7 && (
              <div className="w-px h-14 bg-gray-300 mx-2 self-center" />
            )}
          </div>
        ))}
      </div>
    );
  }

  if (loading)
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm">Loading chart…</p>
        </div>
      </div>
    );

  return (
    <div className="relative" id="chart-wrapper" onClick={() => setPopup(null)}>
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-gray-700">Dental Chart</h3>
          {saveStatus === "saving" && (
            <span className="text-xs text-amber-500 flex items-center gap-1">
              <div className="w-3 h-3 border border-amber-400 border-t-transparent rounded-full animate-spin" />
              Saving…
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="text-xs text-teal-600 flex items-center gap-1">
              <Save size={11} /> Saved
            </span>
          )}
        </div>
      </div>

      <div className="px-6 py-8 space-y-8">
        {/* Legend */}
        <div className="flex items-center gap-6 flex-wrap">
          {(Object.entries(CONDITION_COLORS) as [Condition, string][]).map(
            ([cond, color]) => (
              <div
                key={cond}
                className="flex items-center gap-2 text-xs text-gray-600"
              >
                <div
                  className="w-4 h-4 rounded border border-gray-200"
                  style={{
                    backgroundColor: cond === "missing" ? "white" : color,
                    borderColor: color,
                  }}
                >
                  {cond === "missing" && (
                    <svg viewBox="0 0 16 16">
                      <line
                        x1="0"
                        y1="0"
                        x2="16"
                        y2="16"
                        stroke={color}
                        strokeWidth="2"
                      />
                      <line
                        x1="16"
                        y1="0"
                        x2="0"
                        y2="16"
                        stroke={color}
                        strokeWidth="2"
                      />
                    </svg>
                  )}
                </div>
                <span className="font-medium">{CONDITION_LABELS[cond]}</span>
              </div>
            )
          )}
          <div className="flex items-center gap-2 text-xs text-gray-400 ml-4 border-l border-gray-200 pl-4">
            <span>
              Left-click = surface · Right-click = whole tooth / missing
            </span>
          </div>
        </div>

        {/* Surface key */}
        <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 flex items-center gap-8">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Surface Key
          </div>
          {[
            { s: "B", label: "Buccal (top)" },
            { s: "L", label: "Lingual (bottom)" },
            { s: "M", label: "Mesial (left)" },
            { s: "D", label: "Distal (right)" },
            { s: "O", label: "Occlusal (centre)" },
          ].map(({ s, label }) => (
            <div
              key={s}
              className="flex items-center gap-1.5 text-xs text-gray-600"
            >
              <span className="font-mono font-bold bg-gray-200 text-gray-700 w-5 h-5 flex items-center justify-center rounded text-[10px]">
                {s}
              </span>
              <span>{label}</span>
            </div>
          ))}
        </div>

        {/* Current Status Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-1">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 text-center">
            Current Status
          </div>
          {renderArch(UPPER_TEETH, true, "status")}
          <div className="flex items-center gap-2 my-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-300 font-mono">
              UPPER / LOWER
            </span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          {renderArch(LOWER_TEETH, false, "status")}
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-4 text-center">
            Lower Arch
          </div>
        </div>

        {/* Treatment Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-1">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 text-center">
            Treatment Plan — Outstanding
          </div>
          {renderArch(UPPER_TEETH, true, "treatment")}
          <div className="flex items-center gap-2 my-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-300 font-mono">
              UPPER / LOWER
            </span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          {renderArch(LOWER_TEETH, false, "treatment")}
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-4 text-center">
            Lower Arch
          </div>
        </div>

        {/* Popup */}
        {popup && (
          <div
            className="absolute z-50 bg-white rounded-xl shadow-2xl border border-gray-100 p-3 w-52"
            style={{
              left: Math.min(popup.x, window.innerWidth - 220),
              top: popup.y + 8,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Tooth {popup.toothNumber} —{" "}
                {popup.surface === "whole" ? "Whole" : popup.surface}
              </p>
              <button
                onClick={() => setPopup(null)}
                className="text-gray-300 hover:text-gray-500"
              >
                <X size={13} />
              </button>
            </div>

            <div className="space-y-1">
              {(["caries", "filling", "crown"] as Condition[]).map((cond) => {
                // Only show missing on right-click (whole surface)
                return (
                  <button
                    key={cond}
                    onClick={() => handleSetCondition(cond)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-left text-sm font-medium text-gray-700"
                  >
                    <div
                      className="w-4 h-4 rounded shrink-0"
                      style={{ backgroundColor: CONDITION_COLORS[cond] }}
                    />
                    {CONDITION_LABELS[cond]}
                  </button>
                );
              })}

              {popup.surface === "whole" && (
                <button
                  onClick={() => handleSetCondition("missing")}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors text-left text-sm font-medium text-red-600"
                >
                  <div className="w-4 h-4 rounded shrink-0 border-2 border-red-500 flex items-center justify-center">
                    <X size={10} className="text-red-500" />
                  </div>
                  Missing
                </button>
              )}

              <div className="border-t border-gray-100 pt-1 mt-1">
                <button
                  onClick={() => handleSetCondition(null)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-left text-sm text-gray-400"
                >
                  <RotateCcw size={13} />
                  Clear surface
                </button>
                <button
                  onClick={() => clearTooth(popup.toothNumber)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors text-left text-sm text-red-400"
                >
                  <RotateCcw size={13} />
                  Clear whole tooth
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
