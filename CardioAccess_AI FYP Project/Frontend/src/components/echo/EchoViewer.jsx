import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { efBand } from "../../data/format";
import { volumeSeries } from "../../data/simulate";

export default function EchoViewer({ echo }) {
  const frames = echo?.frameCount || 1;
  const [frame, setFrame] = useState(echo?.edFrame || 1);
  const [overlay, setOverlay] = useState(true);

  const series = useMemo(() => (echo?.edv && echo?.esv ? volumeSeries(echo.edv, echo.esv, frames) : []), [echo, frames]);

  if (!echo?.efAvailable) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-sm text-slate-600">
        ECHO measurements are unavailable for this case. No ejection fraction was invented.
      </div>
    );
  }

  const safeFrame = Math.min(frames, Math.max(1, frame));
  const progress = frames <= 1 ? 0 : (safeFrame - 1) / (frames - 1);
  const cavity = 0.62 + Math.sin(progress * Math.PI) * 0.38;
  const band = efBand(echo.ef);
  const volume = series[Math.min(series.length - 1, safeFrame - 1)];
  const min = Math.min(...series);
  const max = Math.max(...series);
  const curve = series
    .map((value, index) => {
      const x = (index / Math.max(1, series.length - 1)) * 360;
      const y = 86 - ((value - min) / (max - min || 1)) * 68;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  const markerX = ((safeFrame - 1) / Math.max(1, series.length - 1)) * 360;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,280px)_1fr]">
      <div>
        <div className="echo-stage relative flex h-64 items-end justify-center overflow-hidden rounded-lg">
          <svg viewBox="0 0 200 170" className="h-full w-full">
            <polygon points="100,6 16,166 184,166" fill="#071422" />
            <polygon points="100,6 38,166 162,166" fill="#12324c" />
            <ellipse
              cx="100"
              cy="118"
              rx={34 * cavity}
              ry={46 * cavity}
              fill={overlay ? "rgba(13,148,136,0.55)" : "#142033"}
              stroke={overlay ? "#99f6e4" : "transparent"}
              strokeWidth="2"
            />
            <ellipse cx="100" cy="118" rx={18 * cavity} ry={24 * cavity} fill="rgba(8,20,34,0.35)" />
          </svg>
          <div className="absolute left-2 top-2 rounded bg-black/55 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-100">
            Simulated A4C
          </div>
          <div className="absolute bottom-2 left-2 rounded bg-black/55 px-2 py-1 text-[11px] text-slate-100">
            Frame {safeFrame}/{frames}
            {safeFrame === echo.edFrame ? " · ED" : ""}
            {safeFrame === echo.esFrame ? " · ES" : ""}
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button type="button" className="icon-btn border border-slate-200" aria-label="Previous frame" onClick={() => setFrame((value) => Math.max(1, value - 1))}>
            <ChevronLeft size={16} />
          </button>
          <input
            className="flex-1 accent-teal-700"
            type="range"
            min="1"
            max={frames}
            value={safeFrame}
            onChange={(event) => setFrame(Number(event.target.value))}
            aria-label="Frame"
          />
          <button type="button" className="icon-btn border border-slate-200" aria-label="Next frame" onClick={() => setFrame((value) => Math.min(frames, value + 1))}>
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" className="tool-btn" onClick={() => setFrame(echo.edFrame)}>End-diastole</button>
          <button type="button" className="tool-btn" onClick={() => setFrame(echo.esFrame)}>End-systole</button>
          <label className="tool-btn">
            <input type="checkbox" checked={overlay} onChange={(event) => setOverlay(event.target.checked)} />
            LV overlay
          </label>
        </div>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Metric label="EDV" value={`${echo.edv} mL`} detail="End-diastolic volume" />
          <Metric label="ESV" value={`${echo.esv} mL`} detail="End-systolic volume" />
          <Metric label="EF" value={`${Number(echo.ef).toFixed(1)}%`} detail={band ? `Band: ${band}` : "Band unavailable"} />
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
            <span>Illustrative LV volume · demo</span>
            <span>{volume != null ? `${volume} mL at this frame` : ""}</span>
          </div>
          <svg viewBox="0 0 360 96" className="h-24 w-full">
            <path d={curve} fill="none" stroke="#0D9488" strokeWidth="2.4" />
            <line x1={markerX} x2={markerX} y1="8" y2="90" stroke="#102A43" strokeDasharray="3 3" />
          </svg>
        </div>
        <p className="text-xs leading-5 text-slate-500">
          Sample frames and the segmentation overlay are simulated demo content. EF &gt; 50% Normal · 40% &lt; EF ≤ 50% Needs Review · EF ≤ 40% Urgent Referral.
          {echo.lowConfidence ? " Uncertainty on this case overrides the band to Needs Review." : ""}
        </p>
      </div>
    </div>
  );
}

function Metric({ label, value, detail }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 font-display text-xl font-semibold text-navy-950">{value}</div>
      <div className="text-xs text-slate-500">{detail}</div>
    </div>
  );
}
