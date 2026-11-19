
import {
  Activity,
  GitMerge,
  HeartPulse,
  ShieldAlert,
  FileText,
  Info,
} from "lucide-react";

import { Link } from "react-router-dom";

import PageContainer from "../components/ui/PageContainer";
import PageHeader from "../components/ui/PageHeader";

export default function ProtocolsPage() {
  return (
    <PageContainer>
      <PageHeader
        eyebrow="Clinical Reference"
        title="Screening Protocols"
        description="Reference information for ECG screening tasks, echocardiography measurements, multimodal eligibility, triage, and professional review."
      />

      {/* Clinical safety notice */}
      <section className="card border-l-4 border-l-blue-600 p-5">
        <div className="flex items-start gap-3">
          <Info
            size={20}
            className="mt-0.5 shrink-0 text-blue-600"
          />

          <div>
            <h2 className="font-display text-base font-semibold text-navy-950">
              Clinical decision support
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              CardioAccess AI provides preliminary
              screening information to assist qualified
              healthcare professionals. AI-generated
              classifications, measurements, confidence
              indicators, and triage categories are not
              definitive diagnoses or treatment
              recommendations.
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Clinical interpretation and decisions
              regarding further assessment or referral
              remain the responsibility of qualified
              healthcare professionals.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* ECG screening tasks */}
        <section className="card card-hover p-5">
          <div className="flex items-center gap-2 text-clinic-blue">
            <Activity size={18} />

            <h2 className="font-display text-lg font-semibold text-navy-950">
              ECG Screening Tasks
            </h2>
          </div>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            ECG screening uses separate, task-specific
            models. The four-class PTB-XL baseline
            is a research experiment and is not
            deployed in the application.
          </p>

          <div className="mt-4 space-y-3">
            {/* Rhythm classification */}
            <div className="rounded-lg border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-navy-950">
                  Rhythm Classification
                </h3>

                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">
                  Primary ECG task
                </span>
              </div>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Lead II · 500 Hz · 10-second window
                · 5,000 samples
              </p>

              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li className="flex items-center gap-3">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-navy-950" />
                  Sinus Rhythm (SR)
                </li>

                <li className="flex items-center gap-3">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-navy-950" />
                  Atrial Fibrillation (AF)
                </li>
              </ul>

              <p className="mt-3 text-xs leading-5 text-slate-500">
                The model produces task-specific
                probabilities and available confidence,
                uncertainty, and signal-quality
                information. AF-positive or uncertain
                findings are flagged for professional
                review.
              </p>
            </div>

            {/* Conditional MI screening */}
            <div className="rounded-lg border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-navy-950">
                  MI-Related Screening
                </h3>

                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900">
                  Conditional deployment
                </span>
              </div>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                12 leads · 250 Hz · 10-second window
                · 2,500 samples per lead
              </p>

              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li className="flex items-center gap-3">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-navy-950" />
                  MI-related
                </li>

                <li className="flex items-center gap-3">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-navy-950" />
                  Normal
                </li>
              </ul>

              <p className="mt-3 text-xs leading-5 text-slate-500">
                This check runs only if the MI model
                has passed its deployment gate and
                all 12 leads are available. Otherwise,
                the MI check is reported as
                Not available.
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-lg bg-blue-50 px-4 py-3">
            <p className="text-xs leading-5 text-blue-900">
              <strong>ECG-only interpretation:</strong>{" "}
              The backend automatically runs each
              deployed ECG check supported by the
              recording. Users do not select an ECG
              task. ECG-only results do not receive
              Normal, Needs Review, or Urgent
              Referral triage categories unless an
              explicitly configured and validated
              ECG-only triage policy supports them.
            </p>
          </div>

          <p className="mt-3 text-xs leading-5 text-slate-500">
            These checks screen for AF and, where
            supported, MI-related patterns. They do
            not rule out other cardiovascular conditions.
          </p>
        </section>

        {/* Echo measurements */}
        <section className="card card-hover p-5">
          <div className="flex items-center gap-2 text-teal-700">
            <HeartPulse size={18} />

            <h2 className="font-display text-lg font-semibold text-navy-950">
              Echocardiography Measurements
            </h2>
          </div>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            Echocardiography analysis uses left
            ventricular segmentation to support
            estimation of ventricular measurements
            and ejection fraction where the required
            outputs are available.
          </p>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
            <div className="rounded-lg bg-slate-50 px-2 py-3">
              <div className="text-xs text-slate-500">
                EDV
              </div>

              <div className="mt-1 font-semibold text-navy-950">
                End-diastolic volume
              </div>
            </div>

            <div className="rounded-lg bg-slate-50 px-2 py-3">
              <div className="text-xs text-slate-500">
                ESV
              </div>

              <div className="mt-1 font-semibold text-navy-950">
                End-systolic volume
              </div>
            </div>

            <div className="rounded-lg bg-slate-50 px-2 py-3">
              <div className="text-xs text-slate-500">
                EF
              </div>

              <div className="mt-1 font-semibold text-navy-950">
                Ejection fraction
              </div>
            </div>
          </div>

          <h3 className="mt-5 text-sm font-semibold text-navy-950">
            EF-based screening categories
          </h3>

          <div className="mt-3 space-y-3">
            <Band
              label="EF > 50%"
              name="Normal"
              tone="bg-emerald-500"
              width="w-full"
            />

            <Band
              label="40% < EF ≤ 50%"
              name="Needs Review"
              tone="bg-amber-500"
              width="w-4/5"
            />

            <Band
              label="EF ≤ 40%"
              name="Urgent Referral"
              tone="bg-red-600"
              width="w-3/5"
            />
          </div>

          <p className="mt-4 text-xs leading-5 text-slate-500">
            These are the proposed screening-rule
            thresholds. If required EF measurements
            are unavailable, an EF-based category
            must not be generated. High EF
            uncertainty triggers Needs Review
            according to the configured rules.
            A triage label is not a definitive
            clinical diagnosis.
          </p>
        </section>

        {/* Multimodal analysis */}
        <section className="card card-hover p-5">
          <div className="flex items-center gap-2 text-clinic-blue">
            <GitMerge size={18} />

            <h2 className="font-display text-lg font-semibold text-navy-950">
              Multimodal Analysis Eligibility
            </h2>
          </div>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            Multimodal analysis combines ECG and
            echocardiography outputs only when
            the backend confirms that the inputs
            form a valid, genuinely patient-paired
            and compatible record.
          </p>

          <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm">
            <div className="rounded-lg border border-slate-200 px-3 py-4 text-center font-medium text-navy-950">
              Eligible ECG
            </div>

            <span className="text-slate-400">
              +
            </span>

            <div className="rounded-lg border border-slate-200 px-3 py-4 text-center font-medium text-navy-950">
              Eligible Echo
            </div>
          </div>

          <p className="mt-3 text-center text-sm text-slate-500">
            Patient linkage, temporal compatibility,
            modality validity, and a shared
            screening target must be verified.
          </p>

          <div className="mx-auto mt-2 h-6 w-px bg-slate-300" />

          <div className="mx-auto w-fit rounded-lg bg-navy-950 px-4 py-2 text-sm font-semibold text-white">
            Eligible Gated Fusion
          </div>

          <p className="mt-3 text-center text-xs leading-5 text-slate-500">
            When eligible, the fusion model produces
            combined screening probabilities and
            modality-reliance information.
          </p>

          <div className="mt-4 rounded-lg bg-slate-50 px-4 py-3">
            <p className="text-xs leading-5 text-slate-600">
              <strong>Fusion eligibility:</strong>{" "}
              Uploading ECG and Echo files to the
              same case does not, by itself, prove
              that they are eligible for fusion.
              If pairing requirements are not
              satisfied, the system must not
              fabricate a fused prediction.
              Available modality-specific results
              remain separate.
            </p>
          </div>
        </section>

        {/* Screening triage */}
        <section className="card card-hover p-5">
          <div className="flex items-center gap-2 text-red-700">
            <ShieldAlert size={18} />

            <h2 className="font-display text-lg font-semibold text-navy-950">
              Screening Triage and Review
            </h2>
          </div>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            Screening results may receive a triage
            category only when the applicable
            modality-specific or eligible fusion
            decision logic supports one.
          </p>

          <ul className="mt-4 space-y-3 text-sm">
            <li className="rounded-lg bg-emerald-50 px-3 py-3 text-emerald-900">
              <strong>Normal.</strong>{" "}
              The available screening result falls
              within the applicable Normal category.
              This does not rule out cardiovascular
              disease or replace clinical assessment.
            </li>

            <li className="rounded-lg bg-amber-50 px-3 py-3 text-amber-950">
              <strong>Needs Review.</strong>{" "}
              The screening result requires
              professional assessment according
              to the applicable screening and
              uncertainty rules.
            </li>

            <li className="rounded-lg bg-red-50 px-3 py-3 text-red-900">
              <strong>Urgent Referral.</strong>{" "}
              The screening output indicates a
              higher-priority review category.
              A qualified healthcare professional
              determines whether an actual
              referral or other clinical action
              is appropriate.
            </li>
          </ul>

          <div className="mt-4 rounded-lg border border-purple-200 bg-purple-50 px-4 py-3">
            <p className="text-xs leading-5 text-purple-900">
              <strong>Confidence and review:</strong>{" "}
              Low-confidence or uncertain findings
              and positive AF or MI screening
              checks are flagged for professional
              review. These flags do not
              automatically create an ECG-only
              triage category. Relevant flags
              are highlighted in Screening Review
              when the backend provides them.
            </p>
          </div>

          <p className="mt-4 text-xs leading-5 text-slate-500">
            Screening Review does not generate
            referral letters, initiate referrals,
            notify external providers, or make
            treatment decisions automatically.
          </p>

          <Link
            to="/referrals"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-clinic-blue hover:underline"
          >
            Open Screening Review
          </Link>
        </section>
      </div>

      {/* AI summary report */}
      <section className="card p-5">
        <div className="flex items-start gap-3">
          <FileText
            size={21}
            className="mt-0.5 shrink-0 text-clinic-blue"
          />

          <div>
            <h2 className="font-display text-lg font-semibold text-navy-950">
              AI Summary Report
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              After successful analysis, the backend
              workflow is designed to generate an
              informational AI Summary Report using
              structured screening outputs and
              relevant guideline-based information.
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              The report must accurately reflect
              available ECG, Echo, and fusion
              findings, confidence or uncertainty
              information, and applicable triage
              outputs. It must not present an
              unverified prediction as a diagnosis.
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              The report is not a referral letter,
              automated escalation, prescription,
              or substitute for professional
              clinical judgment.
            </p>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Report availability depends on
              successful backend processing,
              generation, and safety validation.
              A report must not be displayed as
              completed until it has actually
              been produced and validated.
            </p>
          </div>
        </div>
      </section>
    </PageContainer>
  );
}

function Band({
  label,
  name,
  tone,
  width,
}) {
  return (
    <div>
      <div className="mb-1 flex justify-between gap-3 text-xs text-slate-500">
        <span>{label}</span>
        <span>{name}</span>
      </div>

      <div className="h-2 rounded-full bg-slate-100">
        <div
          className={`h-2 rounded-full ${tone} ${width}`}
        />
      </div>
    </div>
  );
}
