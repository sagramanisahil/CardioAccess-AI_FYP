import { downsample, leadVariant, synthesizeLeadII } from "../../data/simulate";

function pathFrom(samples) {
  const width = 640;
  const height = 168;
  const min = Math.min(...samples);
  const max = Math.max(...samples);
  const span = max - min || 1;
  return {
    width,
    height,
    d: samples
      .map((value, index) => {
        const x = (index / (samples.length - 1)) * width;
        const y = height - ((value - min) / span) * (height - 28) - 14;
        return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" "),
  };
}

function rhythmFor(predictedClass) {
  if (predictedClass === "Arrhythmia") return { rhythm: "arrhythmia", stElevation: false };
  if (predictedClass === "Ischemic (MI-related)") return { rhythm: "regular", stElevation: true };
  if (predictedClass === "Other Abnormal") return { rhythm: "other", stElevation: false };
  return { rhythm: "regular", stElevation: false };
}

export default function LeadWaveform({ predictedClass = "Normal", seed = 1, lead = "II", highlights = true, compact = false }) {
  const profile = rhythmFor(predictedClass);
  const full = synthesizeLeadII({ ...profile, seed });
  const samples = downsample(leadVariant(full, lead));
  const { width, height, d } = pathFrom(samples);
  const bands = highlights
    ? [
        [0.12, 0.18],
        [0.34, 0.4],
        [0.58, 0.64],
        [0.8, 0.86],
      ]
    : [];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={compact ? "h-14 w-full" : "ecg-paper h-44 w-full"}>
      {bands.map(([start, end]) => (
        <rect key={start} className="saliency-band" x={start * width} y="0" width={(end - start) * width} height={height} />
      ))}
      <path className="ecg-trace" d={d} />
    </svg>
  );
}

export function TwelveLead({ predictedClass, seed }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {["I", "II", "III", "aVR", "aVL", "aVF", "V1", "V2", "V3", "V4", "V5", "V6"].map((lead) => (
        <div key={lead} className="rounded-md border border-rose-100 bg-white p-1">
          <div className="px-1 text-[10px] font-medium text-slate-500">{lead}</div>
          <LeadWaveform compact predictedClass={predictedClass} seed={seed + lead.charCodeAt(0)} lead={lead === "II" ? "II" : lead.startsWith("V") ? "V2" : "V5"} highlights={false} />
        </div>
      ))}
    </div>
  );
}
