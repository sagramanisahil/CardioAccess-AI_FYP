import { Activity, HeartPulse, Sparkles } from "lucide-react";
import Logo from "../layout/Logo";

export default function HeroStage({ compact = false }) {
  return (
    <section className={`auth-stage ${compact ? "auth-stage-compact" : ""}`}>
      <div className="relative z-10 flex items-start justify-between gap-4">
        <Logo light />
        <span className="hidden rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-medium text-cyan-100 backdrop-blur sm:inline">
          Screening support
        </span>
      </div>

      <div className={`relative z-10 ${compact ? "max-w-md" : "max-w-xl"}`}>
        <p className="text-sm font-medium text-cyan-200">Cardiovascular screening workspace</p>
        <h1 className={`mt-3 font-display font-semibold leading-[1.05] text-white ${compact ? "text-3xl" : "text-4xl xl:text-5xl"}`}>
          Smarter Cardiovascular Screening Starts Here.
        </h1>
        <p className="mt-4 max-w-lg text-sm leading-7 text-slate-200">
          Review ECG and echocardiography screening results in one calm workspace, then decide who needs a closer look. Illustrative graphics only. Not a diagnosis.
        </p>
      </div>

      <div className={`stage ${compact ? "stage-compact" : ""}`} aria-hidden="true">
        <span className="stage-orb stage-orb-blue" />
        <span className="stage-orb stage-orb-teal" />
        <span className="stage-orb stage-orb-violet" />
        <svg className="stage-ecg" viewBox="0 0 640 160">
          <path
            className="ecg-draw"
            d="M0 90 H90 L112 90 L128 48 L146 128 L164 70 L186 90 H250 L272 90 L290 40 L310 136 L328 64 L350 90 H430 L452 90 L470 52 L488 124 L506 74 L528 90 H640"
          />
        </svg>
        <div className="stage-heart-wrap">
          <div className="stage-heart">
            <HeartGlyph />
          </div>
          <div className="stage-heart-shadow" />
        </div>
        <GlassChip className="chip-ecg" icon={Activity} label="ECG" detail="Rhythm class" />
        <GlassChip className="chip-echo" icon={HeartPulse} label="ECHO" detail="EF screening" />
        <GlassChip className="chip-ai" icon={Sparkles} label="Screening" detail="Referral support" />
      </div>

      <p className="relative z-10 text-[11px] text-slate-300">Illustrative 3D graphic. Not a clinical image or patient study.</p>
    </section>
  );
}

function GlassChip({ className, icon: Icon, label, detail }) {
  return (
    <div className={`glass-chip ${className}`}>
      <Icon size={16} />
      <span>
        <span className="block text-xs font-semibold">{label}</span>
        <span className="block text-[10px] text-slate-200">{detail}</span>
      </span>
    </div>
  );
}

function HeartGlyph() {
  return (
    <svg viewBox="0 0 200 180" className="h-full w-full">
      <defs>
        <linearGradient id="heartFill" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#67e8f9" />
          <stop offset="42%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id="heartSide" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="100%" stopColor="#102a43" />
        </linearGradient>
      </defs>
      <path
        d="M100 162 C40 122 16 92 16 60 C16 34 36 16 60 16 C78 16 92 26 100 40 C108 26 122 16 140 16 C164 16 184 34 184 60 C184 92 160 122 100 162Z"
        fill="url(#heartSide)"
        transform="translate(0 8)"
        opacity="0.55"
      />
      <path
        d="M100 154 C42 116 20 88 20 58 C20 34 38 18 60 18 C77 18 90 28 100 42 C110 28 123 18 140 18 C162 18 180 34 180 58 C180 88 158 116 100 154Z"
        fill="url(#heartFill)"
      />
      <path
        d="M78 48 C70 58 68 72 76 82"
        fill="none"
        stroke="white"
        strokeOpacity="0.55"
        strokeWidth="6"
        strokeLinecap="round"
      />
    </svg>
  );
}
