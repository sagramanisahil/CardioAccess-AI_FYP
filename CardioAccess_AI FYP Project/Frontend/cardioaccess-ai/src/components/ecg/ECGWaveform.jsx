import { useEffect, useMemo, useState } from "react";
import { Pause, Play, ZoomIn, ZoomOut } from "lucide-react";
import { downsample, synthesizeLeadII } from "../../data/simulate";

function rhythmFor(predictedClass) {
  if (predictedClass === "Arrhythmia") return { rhythm: "arrhythmia", stElevation: false };
  if (predictedClass === "Ischemic (MI-related)") return { rhythm: "regular", stElevation: true };
  if (predictedClass === "Other Abnormal") return { rhythm: "other", stElevation: false };
  return { rhythm: "regular", stElevation: false };
}

function tracePath(samples, width, height, gain) {
  const min = Math.min(...samples);
  const max = Math.max(...samples);
  const mid = (min + max) / 2;
  const span = (max - min) / gain || 1;
  return samples
    .map((value, index) => {
      const x = (index / Math.max(1, samples.length - 1)) * width;
      const y = height / 2 - ((value - mid) / span) * (height * 0.72);
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

export default function ECGWaveform({ predictedClass = "Normal", seed = 1, quality = "Suitable" }) {
  const fs = 250;
  const seconds = 10;
  const [span, setSpan] = useState(10);
  const [start, setStart] = useState(0);
  const [gain, setGain] = useState("Standard");
  const [marks, setMarks] = useState(true);
  const [playing, setPlaying] = useState(false);

  const samples = useMemo(
    () => synthesizeLeadII({ ...rhythmFor(predictedClass), seed, seconds, fs }),
    [predictedClass, seed],
  );

  useEffect(() => {
    if (!playing) return undefined;
    const timer = setInterval(() => {
      setStart((current) => {
        const next = current + 0.04;
        return next > seconds - span ? 0 : next;
      });
    }, 40);
    return () => clearInterval(timer);
  }, [playing, span]);

  const gainValue = gain === "High" ? 1.45 : gain === "Low" ? 0.72 : 1;
  const startIndex = Math.min(samples.length - 2, Math.floor(start * fs));
  const count = Math.max(20, Math.floor(span * fs));
  const windowed = samples.slice(startIndex, startIndex + count);
  const drawn = downsample(windowed, Math.min(900, windowed.length));
  const width = 960;
  const height = 280;
  const path = tracePath(drawn, width, height, gainValue);
  const maxStart = Math.max(0, seconds - span);

  const zoom = (direction) => {
    setSpan((current) => {
      const next = direction === "in" ? Math.max(2, current / 2) : Math.min(10, current * 2);
      setStart((value) => Math.min(value, Math.max(0, seconds - next)));
      return next;
    });
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button type="button" className="tool-btn" onClick={() => zoom("in")} aria-label="Zoom in"><ZoomIn size={15} /> Zoom in</button>
        <button type="button" className="tool-btn" onClick={() => zoom("out")} aria-label="Zoom out"><ZoomOut size={15} /> Zoom out</button>
        <button type="button" className="tool-btn" onClick={() => setPlaying((value) => !value)}>
          {playing ? <Pause size={15} /> : <Play size={15} />} {playing ? "Pause" : "Play sweep"}
        </button>
        <label className="tool-btn">
          Time range
          <select
            className="bg-transparent text-sm font-medium outline-none"
            value={span}
            onChange={(event) => {
              const next = Number(event.target.value);
              setSpan(next);
              setStart((value) => Math.min(value, Math.max(0, seconds - next)));
            }}
          >
            <option value={10}>10 s</option>
            <option value={5}>5 s</option>
            <option value={2.5}>2.5 s</option>
          </select>
        </label>
        <label className="tool-btn">
          Signal
          <select className="bg-transparent text-sm font-medium outline-none" value={gain} onChange={(event) => setGain(event.target.value)}>
            <option>Standard</option>
            <option>High</option>
            <option>Low</option>
          </select>
        </label>
        <label className="tool-btn">
          <input type="checkbox" checked={marks} onChange={(event) => setMarks(event.target.checked)} />
          Illustrative marks
        </label>
        <span className={`ml-auto rounded-md px-2 py-1 text-xs font-semibold ${quality === "Limited" ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-800"}`}>
          Signal quality · {quality}
        </span>
      </div>

      <div className="ecg-paper ecg-glow relative overflow-hidden rounded-xl border border-rose-100">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-64 w-full" role="img" aria-label="Simulated Lead II waveform">
          {marks && [0.18, 0.42, 0.66, 0.86].map((mark) => (
            <rect key={mark} x={mark * width} y="0" width={width * 0.045} height={height} fill="rgba(220, 38, 38, 0.08)" />
          ))}
          <path d={path} className="ecg-trace" />
          {playing && (
            <line x1={(start / seconds) * 0 + width * 0.5} x2={width * 0.5} y1="8" y2={height - 8} stroke="#2563EB" strokeWidth="1.2" opacity="0.7" />
          )}
        </svg>
        <div className="pointer-events-none absolute left-3 top-3 rounded bg-white/85 px-2 py-1 text-[11px] font-semibold text-slate-600">
          Lead II · simulated demo · {fs} Hz
        </div>
      </div>

      <label className="mt-3 block text-xs font-medium text-slate-500">
        Window start {start.toFixed(1)} s
        <input
          className="mt-1 w-full accent-clinic-blue"
          type="range"
          min="0"
          max={maxStart}
          step="0.1"
          value={Math.min(start, maxStart)}
          onChange={(event) => setStart(Number(event.target.value))}
        />
      </label>
      <p className="mt-2 text-xs leading-5 text-slate-500">
        This trace is generated in the browser to illustrate the screening class. Pink marks are explanatory highlights, not device measurements.
      </p>
    </div>
  );
}
