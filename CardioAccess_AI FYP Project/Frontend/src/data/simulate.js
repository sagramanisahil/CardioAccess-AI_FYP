export const ECG_CLASSES = [
  "Normal",
  "Arrhythmia",
  "Ischemic (MI-related)",
  "Other Abnormal",
];

export const TRIAGE = {
  normal: "Normal",
  review: "Needs Review",
  urgent: "Urgent Referral",
};

export const THRESHOLDS = {
  ecgConfidence: 0.7,
  ecgEntropy: 0.8,
  echoUncertainty: 0.35,
  fusionUncertainty: 0.45,
};

export function round1(n) {
  return Math.round(n * 10) / 10;
}

export function round2(n) {
  return Math.round(n * 100) / 100;
}

export function classProbabilities(winner, winnerValue) {
  const rest = (1 - winnerValue) / (ECG_CLASSES.length - 1);
  const raw = {};
  ECG_CLASSES.forEach((name) => {
    raw[name] = name === winner ? winnerValue : rest;
  });
  const entries = Object.entries(raw).map(([key, value]) => [key, round2(value)]);
  const sum = entries.reduce((total, [, value]) => total + value, 0);
  const drift = round2(1 - sum);
  const winnerIndex = entries.findIndex(([key]) => key === winner);
  entries[winnerIndex][1] = round2(entries[winnerIndex][1] + drift);
  return Object.fromEntries(entries);
}

export function ecgLowConfidence(confidence, entropy) {
  return confidence < THRESHOLDS.ecgConfidence || entropy > THRESHOLDS.ecgEntropy;
}

export function decideEcho(ef, uncertainty) {
  if (ef == null || Number.isNaN(ef)) {
    return {
      triage: null,
      reason: "EF is unavailable because the required measurements could not be obtained.",
    };
  }
  if (uncertainty > THRESHOLDS.echoUncertainty) {
    return {
      triage: TRIAGE.review,
      reason:
        "EF uncertainty is above the review threshold, so the EF band was overridden to Needs Review.",
    };
  }
  if (ef > 50) {
    return {
      triage: TRIAGE.normal,
      reason: "Estimated EF is above 50%. A Normal result does not create a referral.",
    };
  }
  if (ef > 40) {
    return {
      triage: TRIAGE.review,
      reason: "Echo-only band: 40% < EF ≤ 50% is Needs Review.",
    };
  }
  return {
    triage: TRIAGE.urgent,
    reason: "Echo-only band: EF ≤ 40% is Urgent Referral.",
  };
}

export function decideFusion(probabilities, uncertainty) {
  const ranked = Object.entries(probabilities).sort((a, b) => b[1] - a[1]);
  if (uncertainty > THRESHOLDS.fusionUncertainty) {
    return {
      triage: TRIAGE.review,
      reason:
        "Fusion uncertainty is above the review threshold, so the category was set to Needs Review.",
    };
  }
  return {
    triage: ranked[0][0],
    reason: `Screening category from multimodal fusion. Highest fused probability is ${ranked[0][0]} (${round2(ranked[0][1])}).`,
  };
}

export function decideEcgOnly() {
  return {
    triage: null,
    reason:
      "ECG-only cases show the four-class screening result and do not receive a triage category. No referral is created.",
  };
}

export function shouldCreateReferral(triage) {
  return triage === TRIAGE.review || triage === TRIAGE.urgent;
}

export function reducedEfLabel(ef) {
  if (ef == null) return "Unavailable";
  if (ef <= 40) return "Reduced EF (≤ 40%)";
  if (ef <= 50) return "Borderline EF (40–50%)";
  return "EF above 50%";
}

function gauss(x, mu, sigma) {
  const z = (x - mu) / sigma;
  return Math.exp(-0.5 * z * z);
}

export function synthesizeLeadII({ rhythm = "regular", stElevation = false, seed = 1, seconds = 10, fs = 250 }) {
  const n = seconds * fs;
  const samples = new Array(n);
  const beats = [];
  let cursor = 0.18;
  let beat = 0;
  while (cursor < seconds + 0.8) {
    beats.push(cursor);
    const jitter = rhythm === "arrhythmia" ? (((seed + beat * 17) % 23) - 11) / 100 : 0;
    const pause = rhythm === "arrhythmia" && beat % 5 === 3 ? 0.28 : 0;
    cursor += 0.8 + jitter + pause;
    beat += 1;
  }

  for (let i = 0; i < n; i += 1) {
    const time = i / fs;
    let value = 0;
    beats.forEach((bt) => {
      const dt = time - bt;
      if (dt < -0.22 || dt > 0.62) return;
      value += 0.12 * gauss(dt, -0.12, 0.018);
      value += -0.16 * gauss(dt, 0, 0.008);
      value += 1.12 * gauss(dt, 0.018, 0.009);
      value += -0.28 * gauss(dt, 0.042, 0.01);
      if (stElevation && dt > 0.055 && dt < 0.16) value += 0.22;
      value += (rhythm === "other" ? 0.16 : 0.3) * gauss(dt, 0.28, rhythm === "other" ? 0.07 : 0.045);
    });
    const noise = (((i * 13 + seed * 7) % 17) - 8) / 450;
    samples[i] = value + noise;
  }
  return samples;
}

export function leadVariant(samples, lead) {
  if (lead === "II") return samples;
  const scale = lead === "V2" ? 0.82 : lead === "V5" ? 1.08 : 0.9;
  const shift = lead === "V2" ? 6 : lead === "V5" ? 3 : 0;
  return samples.map((value, index) => samples[(index + shift) % samples.length] * scale);
}

export function downsample(samples, points = 480) {
  const output = [];
  const step = samples.length / points;
  for (let i = 0; i < points; i += 1) {
    output.push(samples[Math.min(samples.length - 1, Math.floor(i * step))]);
  }
  return output;
}

export function volumeSeries(edv, esv, points = 48) {
  const series = [];
  for (let i = 0; i <= points; i += 1) {
    const t = i / points;
    const drop = Math.sin(t * Math.PI);
    series.push(round1(edv - (edv - esv) * drop));
  }
  return series;
}

export function buildAnalysis({ modality, paired, profile }) {
  const hasEcg = modality === "ecg" || modality === "both";
  const hasEcho = modality === "echo" || modality === "both";
  const ecg = hasEcg
    ? {
        lead: "II",
        samplingHz: 250,
        durationSec: 10,
        predictedClass: profile.ecgClass,
        probabilities: profile.ecgProbabilities,
        confidence: profile.ecgConfidence,
        entropy: profile.ecgEntropy,
        lowConfidence: ecgLowConfidence(profile.ecgConfidence, profile.ecgEntropy),
        model: "SE-ResNet1D · v1.2",
        heartRate: profile.heartRate,
        simulated: true,
      }
    : null;

  const echo = hasEcho
    ? {
        ef: profile.ef,
        efSpread: profile.efSpread,
        edv: profile.edv,
        esv: profile.esv,
        pReduced50: profile.pReduced50,
        pReduced40: profile.pReduced40,
        uncertainty: profile.echoUncertainty,
        lowConfidence: profile.echoUncertainty > THRESHOLDS.echoUncertainty,
        edFrame: profile.edFrame,
        esFrame: profile.esFrame,
        frameCount: profile.frameCount,
        fps: profile.fps,
        model: "Lightweight U-Net · v1.1",
        efAvailable: profile.ef != null,
        simulated: true,
      }
    : null;

  let fusion = null;
  let decision;
  if (hasEcg && hasEcho && paired) {
    fusion = {
      probabilities: profile.fusionProbabilities,
      gateEcg: profile.gateEcg,
      gateEcho: profile.gateEcho,
      uncertainty: profile.fusionUncertainty,
      model: "Gated fusion · v0.9",
      simulated: true,
    };
    decision = decideFusion(fusion.probabilities, fusion.uncertainty);
    fusion.confidence = Math.max(...Object.values(fusion.probabilities));
  } else if (hasEcho) {
    decision = decideEcho(echo.ef, echo.uncertainty);
  } else if (hasEcg) {
    decision = decideEcgOnly();
  } else {
    decision = { triage: null, reason: "No valid modality was available." };
  }

  const lowConfidenceModalities = [];
  if (ecg?.lowConfidence) lowConfidenceModalities.push("ECG");
  if (echo?.lowConfidence) lowConfidenceModalities.push("Echo");

  return {
    ecg,
    echo,
    fusion,
    triage: decision.triage,
    triageSource: fusion ? "fusion" : hasEcho ? "echo" : hasEcg ? "ecg" : null,
    triageReason: decision.reason,
    lowConfidenceModalities,
  };
}

export function profileFor(kind, salt = 1) {
  const jitter = ((salt * 17) % 7) - 3;
  if (kind === "fusion-normal" || kind === "echo-normal") {
    const ef = round1(58 + (salt % 5));
    const edv = 110 + (salt % 12);
    const esv = round1(edv * (1 - ef / 100));
    return {
      ecgClass: "Normal",
      ecgProbabilities: classProbabilities("Normal", 0.9),
      ecgConfidence: 0.9,
      ecgEntropy: 0.22,
      heartRate: 70 + (salt % 8),
      ef,
      efSpread: 1.8,
      edv,
      esv,
      pReduced50: 0.08,
      pReduced40: 0.02,
      echoUncertainty: 0.12,
      edFrame: 8,
      esFrame: 24,
      frameCount: 90,
      fps: 50,
      fusionProbabilities: { Normal: 0.81, "Needs Review": 0.14, "Urgent Referral": 0.05 },
      gateEcg: 0.47,
      gateEcho: 0.53,
      fusionUncertainty: 0.18,
    };
  }
  if (kind === "echo-review" || kind === "fusion-review") {
    const ef = round1(44 + (salt % 5) * 0.8);
    const edv = 118 + (salt % 6);
    const esv = round1(edv * (1 - ef / 100));
    return {
      ecgClass: "Ischemic (MI-related)",
      ecgProbabilities: classProbabilities("Ischemic (MI-related)", 0.74),
      ecgConfidence: 0.74,
      ecgEntropy: 0.4,
      heartRate: 82,
      ef,
      efSpread: 2.4,
      edv,
      esv,
      pReduced50: 0.74,
      pReduced40: 0.11,
      echoUncertainty: 0.18,
      edFrame: 11,
      esFrame: 36,
      frameCount: 100,
      fps: 50,
      fusionProbabilities: { Normal: 0.24, "Needs Review": 0.57, "Urgent Referral": 0.19 },
      gateEcg: 0.44,
      gateEcho: 0.56,
      fusionUncertainty: 0.32,
    };
  }
  if (kind === "fusion-review-low") {
    return {
      ecgClass: "Other Abnormal",
      ecgProbabilities: classProbabilities("Other Abnormal", 0.48),
      ecgConfidence: 0.48,
      ecgEntropy: 0.91,
      heartRate: 96,
      ef: 54,
      efSpread: 4.2,
      edv: 126,
      esv: 58,
      pReduced50: 0.36,
      pReduced40: 0.09,
      echoUncertainty: 0.22,
      edFrame: 14,
      esFrame: 40,
      frameCount: 112,
      fps: 50,
      fusionProbabilities: { Normal: 0.34, "Needs Review": 0.33, "Urgent Referral": 0.33 },
      gateEcg: 0.52,
      gateEcho: 0.48,
      fusionUncertainty: 0.62,
    };
  }
  if (kind === "echo-urgent" || kind === "fusion-urgent") {
    const ef = round1(32 + (salt % 4));
    const edv = 150 + jitter;
    const esv = round1(edv * (1 - ef / 100));
    return {
      ecgClass: "Ischemic (MI-related)",
      ecgProbabilities: classProbabilities("Ischemic (MI-related)", 0.86),
      ecgConfidence: 0.86,
      ecgEntropy: 0.28,
      heartRate: 104,
      ef,
      efSpread: 2.1,
      edv,
      esv,
      pReduced50: 0.96,
      pReduced40: 0.88,
      echoUncertainty: 0.14,
      edFrame: 9,
      esFrame: 30,
      frameCount: 96,
      fps: 50,
      fusionProbabilities: { Normal: 0.06, "Needs Review": 0.18, "Urgent Referral": 0.76 },
      gateEcg: 0.38,
      gateEcho: 0.62,
      fusionUncertainty: 0.2,
    };
  }
  const classes = ["Normal", "Arrhythmia", "Other Abnormal", "Ischemic (MI-related)"];
  const winner = classes[salt % classes.length];
  const confidence = 0.78;
  return {
    ecgClass: winner,
    ecgProbabilities: classProbabilities(winner, confidence),
    ecgConfidence: confidence,
    ecgEntropy: 0.36,
    heartRate: 74 + (salt % 10),
    ef: null,
    efSpread: null,
    edv: null,
    esv: null,
    pReduced50: null,
    pReduced40: null,
    echoUncertainty: 0,
    edFrame: 1,
    esFrame: 1,
    frameCount: 1,
    fps: 0,
    fusionProbabilities: null,
    gateEcg: 0,
    gateEcho: 0,
    fusionUncertainty: 0,
  };
}

export function heroProfile() {
  return {
    ecgClass: "Ischemic (MI-related)",
    ecgProbabilities: {
      "Ischemic (MI-related)": 0.54,
      Normal: 0.23,
      "Other Abnormal": 0.14,
      Arrhythmia: 0.09,
    },
    ecgConfidence: 0.54,
    ecgEntropy: 0.92,
    heartRate: 88,
    ef: 46.8,
    efSpread: 3.1,
    edv: 118,
    esv: 63,
    pReduced50: 0.81,
    pReduced40: 0.07,
    echoUncertainty: 0.19,
    edFrame: 18,
    esFrame: 41,
    frameCount: 112,
    fps: 50,
    fusionProbabilities: { Normal: 0.22, "Needs Review": 0.58, "Urgent Referral": 0.2 },
    gateEcg: 0.41,
    gateEcho: 0.59,
    fusionUncertainty: 0.36,
  };
}

export function describeFile(file) {
  const mb = file.size / (1024 * 1024);
  const sizeLabel = mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(file.size / 1024))} KB`;
  return { name: file.name, sizeLabel };
}
