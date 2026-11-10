import { caseCode, referralCode } from "./format";
import {
  buildAnalysis,
  heroProfile,
  profileFor,
  shouldCreateReferral,
} from "./simulate";

export const CLINICIAN_ID = "u-memon";
export const NURSE_ID = "u-sana";
export const ADMIN_ID = "u-admin";
export const ADMIN_EMAIL = "admin@cardioaccess.local";

export function isAdminUser(account) {
  return Boolean(account && account.role === "Admin" && account.email.toLowerCase() === ADMIN_EMAIL);
}

export const DEMO_PASSWORD = "Screen123!";

export function seedUsers() {
  return [
    {
      id: CLINICIAN_ID,
      name: "Dr. A. Memon",
      email: "clinician@bhu-sukkur.pk",
      password: DEMO_PASSWORD,
      role: "Clinician",
      facility: "Basic Health Unit, Sukkur",
      verified: true,
      active: true,
      lastSignIn: "2026-11-06T09:05:00",
    },
    {
      id: NURSE_ID,
      name: "Sana Rajput",
      email: "sana.r@bhu-sukkur.pk",
      password: DEMO_PASSWORD,
      role: "Nurse",
      facility: "Basic Health Unit, Sukkur",
      verified: true,
      active: true,
      lastSignIn: "2026-11-06T08:40:00",
    },
    {
      id: "u-shaikh",
      name: "Dr. K. Shaikh",
      email: "k.shaikh@rhc-rohri.pk",
      password: DEMO_PASSWORD,
      role: "Clinician",
      facility: "Rural Health Centre, Rohri",
      verified: false,
      active: true,
      lastSignIn: null,
    },
    {
      id: "u-pilot",
      name: "Pilot User 07",
      email: "pilot07@example.org",
      password: DEMO_PASSWORD,
      role: "Nurse",
      facility: "Usability pilot",
      verified: true,
      active: false,
      lastSignIn: "2026-10-21T14:12:00",
    },
    {
      id: ADMIN_ID,
      name: "Admin User",
      email: ADMIN_EMAIL,
      password: "Admin123!",
      role: "Admin",
      facility: "CardioAccess Research",
      verified: true,
      active: true,
      lastSignIn: "2026-11-06T10:51:00",
    },
  ];
}

function stamp(day, time) {
  return `2026-11-${String(day).padStart(2, "0")}T${time}:00`;
}

function filesFor(kind, id) {
  const code = String(id).padStart(4, "0");
  if (kind.startsWith("echo")) {
    return {
      modality: "echo",
      ecgFile: null,
      echoFile: { name: `a4c_clip_${code}.avi`, sizeLabel: "14.2 MB", detail: "112 frames · 50 fps" },
    };
  }
  if (kind.startsWith("ecg")) {
    return {
      modality: "ecg",
      ecgFile: { name: `ecg_record_${code}.zip`, sizeLabel: "1.8 MB", detail: "12 leads · resampled to 250 Hz" },
      echoFile: null,
    };
  }
  return {
    modality: "both",
    ecgFile: { name: `ecg_record_${code}.zip`, sizeLabel: "1.8 MB", detail: "12 leads · resampled to 250 Hz" },
    echoFile: { name: `a4c_clip_${code}.avi`, sizeLabel: "14.2 MB", detail: "112 frames · 50 fps" },
  };
}

function timeline(iso, status) {
  if (status === "processing") {
    return [{ label: "Submitted", time: iso.slice(11, 19), done: true }, { label: "Analysing", time: null, done: false }];
  }
  if (status === "failed") {
    return [
      { label: "Submitted", time: iso.slice(11, 19), done: true },
      { label: "Analysis failed", time: iso.slice(11, 16) + ":08", done: true },
    ];
  }
  const [h, m] = iso.slice(11, 16).split(":").map(Number);
  const at = (add) => {
    const total = h * 3600 + m * 60 + add;
    const hh = String(Math.floor(total / 3600)).padStart(2, "0");
    const mm = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
    const ss = String(total % 60).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  };
  return [
    { label: "Submitted", time: at(0), done: true },
    { label: "ECG analysed", time: at(9), done: true },
    { label: "Echo analysed", time: at(12), done: true },
    { label: "Fusion + triage", time: at(13), done: true },
  ];
}

const ROSTER = [
  ["PT-10421", "Amina Khoso", 67, "Female", "Breathlessness on exertion."],
  ["PT-10488", "Hassan Brohi", 54, "Male", "Chest discomfort. Known hypertension."],
  ["PT-10502", "Rukhsana Soomro", 71, "Female", "Reduced exercise tolerance over three weeks."],
  ["PT-10544", "Imran Chandio", 46, "Male", "Palpitations. No prior echo on file."],
  ["PT-10590", "Saima Bhatti", 63, "Female", "Diabetes. Screening before specialist visit."],
  ["PT-10617", "Farooq Magsi", 58, "Male", "Ankle swelling and fatigue."],
  ["PT-10655", "Nadia Qureshi", 49, "Female", "Atypical chest pain. ECG requested."],
  ["PT-10703", "Bilal Shar", 74, "Male", "Prior myocardial infarction. Follow-up screen."],
  ["PT-10741", "Hina Laghari", 39, "Female", "Pre-operative cardiovascular screen."],
  ["PT-10788", "Tariq Abro", 61, "Male", "Irregular pulse noted in clinic."],
  ["PT-10820", "Mehwish Junejo", 55, "Female", "Dyspnoea. Echo requested."],
  ["PT-10864", "Shahid Rahimoon", 68, "Male", "Combined ECG and echo for referral support."],
];

function patientFor(id) {
  if (id === 131) {
    return {
      patientId: "PT-10502",
      patientName: "Rukhsana Soomro",
      age: 71,
      sex: "Female",
      clinical: "Reduced exercise tolerance. Paired ECG and echo submitted for screening support.",
    };
  }
  const row = ROSTER[id % ROSTER.length];
  return {
    patientId: `PT-${10000 + id}`,
    patientName: row[1],
    age: row[2] + (id % 3),
    sex: row[3],
    clinical: row[4],
  };
}

function makeCase(spec) {
  const id = caseCode(spec.id);
  const createdAt = stamp(spec.day, spec.time);
  const files = filesFor(spec.kind, spec.id);
  const person = patientFor(spec.id);
  const base = {
    id,
    createdAt,
    screeningDate: createdAt.slice(0, 10),
    ownerId: spec.ownerId || CLINICIAN_ID,
    notes: spec.notes || person.clinical,
    ...person,
    clinical: spec.notes || person.clinical,
    sample: true,
    paired: spec.paired !== false && files.modality === "both",
    durationSec: 9,
    ...files,
  };

  if (spec.kind.endsWith("processing")) {
    return {
      ...base,
      status: "processing",
      ecg: null,
      echo: null,
      fusion: null,
      triage: null,
      triageSource: null,
      triageReason: "Analysis is still running for this sample case.",
      lowConfidenceModalities: [],
      error: null,
      timeline: timeline(createdAt, "processing"),
      completesAt: null,
    };
  }

  if (spec.kind.endsWith("failed")) {
    return {
      ...base,
      status: "failed",
      ecg: null,
      echo: null,
      fusion: null,
      triage: null,
      triageSource: null,
      triageReason: "The ECG file could not be read. No prediction is shown.",
      lowConfidenceModalities: [],
      error: "Failed (unreadable file)",
      timeline: timeline(createdAt, "failed"),
      completesAt: null,
    };
  }

  const profile = spec.kind === "fusion-hero" ? heroProfile() : profileFor(spec.kind, spec.id);
  const analysis = buildAnalysis({
    modality: files.modality,
    paired: base.paired && files.modality === "both",
    profile,
  });

  const record = {
    ...base,
    status: "completed",
    ...analysis,
    error: null,
    timeline:
      spec.kind === "fusion-hero"
        ? [
            { label: "Submitted", time: "10:42:19", done: true },
            { label: "ECG analysed", time: "10:42:28", done: true },
            { label: "Echo analysed", time: "10:42:31", done: true },
            { label: "Fusion + triage", time: "10:42:32", done: true },
          ]
        : timeline(createdAt, "completed").filter((step) => {
            if (files.modality === "ecg") return !step.label.startsWith("Echo") && !step.label.startsWith("Fusion");
            if (files.modality === "echo") return !step.label.startsWith("ECG") && !step.label.startsWith("Fusion");
            return true;
          }),
    completesAt: null,
  };

  if (spec.kind === "fusion-hero") {
    record.triageReason =
      "Screening category from multimodal fusion. Fused probabilities — Normal 0.22 · Needs Review 0.58 · Urgent 0.20. Modality reliance: ECG 0.41 / Echo 0.59.";
  }
  if (spec.id === 125 && record.echo) {
    record.echo.ef = 47.4;
    record.echo.uncertainty = 0.42;
    record.echo.lowConfidence = true;
    record.echo.pReduced50 = 0.69;
    record.lowConfidenceModalities = ["Echo"];
    record.triage = "Needs Review";
    record.triageReason =
      "EF uncertainty is above the review threshold, so the EF band was overridden to Needs Review.";
  }
  return record;
}

function extraPlan() {
  const kinds = [
    "fusion-review",
    "echo-review",
    "fusion-review-low",
    "echo-review",
    "fusion-review",
    "fusion-urgent",
    "ecg-only",
    "ecg-only",
    "ecg-only",
  ];
  for (let i = 0; i < 14; i += 1) kinds.push(i % 2 === 0 ? "fusion-normal" : "echo-normal");
  return kinds.map((kind, index) => ({
    id: 123 - index,
    day: 1 + (index % 3),
    time: `${String(8 + (index % 9)).padStart(2, "0")}:${String((index * 7) % 60).padStart(2, "0")}`,
    kind,
  }));
}

export function buildSeed() {
  const fixed = [
    { id: 131, day: 6, time: "10:42", kind: "fusion-hero", notes: "Sample paired case used on the result screen." },
    { id: 130, day: 6, time: "09:15", kind: "echo-urgent" },
    { id: 129, day: 5, time: "16:03", kind: "ecg-only" },
    { id: 128, day: 5, time: "11:20", kind: "fusion-normal" },
    { id: 127, day: 5, time: "10:58", kind: "echo-processing" },
    { id: 126, day: 4, time: "15:47", kind: "fusion-normal" },
    { id: 125, day: 4, time: "12:09", kind: "echo-review" },
    { id: 124, day: 3, time: "17:31", kind: "ecg-failed" },
    ...extraPlan(),
  ];

  const cases = fixed.map(makeCase);
  const referrals = cases
    .filter((item) => shouldCreateReferral(item.triage))
    .map((item) => ({
      id: referralCode(item.id),
      caseId: item.id,
      triage: item.triage,
      status: item.id === "CA-2026-000131" ? "Open" : "Open",
      createdAt: item.createdAt,
      ownerId: item.ownerId,
      sample: true,
    }));

  const audit = [
    { id: "a1", time: "2026-11-06T10:42:19", event: "CASE_SUBMITTED", target: "CA-2026-000131", actor: "clinician@bhu-sukkur.pk" },
    { id: "a2", time: "2026-11-06T10:42:28", event: "ECG_ANALYSED", target: "CA-2026-000131", actor: "system" },
    { id: "a3", time: "2026-11-06T10:42:31", event: "ECHO_ANALYSED", target: "CA-2026-000131", actor: "system" },
    { id: "a4", time: "2026-11-06T10:42:32", event: "TRIAGE_GENERATED", target: "CA-2026-000131", actor: "system" },
    { id: "a5", time: "2026-11-06T10:51:04", event: "ROLE_CHANGED", target: "sana.r@bhu-sukkur.pk → Nurse", actor: "admin@cardioaccess.local" },
  ];

  return { cases, referrals, audit };
}

export const LAST_MONTH_CASES = 25;
