import { formatWhen } from "./format";

export function summaryText(record) {
  const when = formatWhen(record.createdAt);
  const lines = [
    "CardioAccess AI — screening summary",
    "Simulated demonstration output. Not a diagnosis.",
    "",
    `Case: ${record.id}`,
    `Submitted: ${when.both}`,
    `Modality: ${record.modality}`,
    `Status: ${record.status}`,
    "",
    record.triage
      ? `Screening category: ${record.triage}`
      : "Screening category: No category",
    record.triageReason || "",
    "",
  ];
  if (record.ecg) {
    lines.push(`ECG class: ${record.ecg.predictedClass} (confidence ${record.ecg.confidence})`);
    lines.push(`Lead II · ${record.ecg.samplingHz} Hz · entropy ${record.ecg.entropy}`);
  }
  if (record.echo?.efAvailable) {
    lines.push(`EF ${record.echo.ef}% · EDV ${record.echo.edv} mL · ESV ${record.echo.esv} mL`);
    lines.push(`P(EF<50%) ${record.echo.pReduced50} · P(EF≤40%) ${record.echo.pReduced40}`);
  }
  if (record.fusion) {
    lines.push(
      `Fusion gates: ECG ${record.fusion.gateEcg} / Echo ${record.fusion.gateEcho}`,
    );
  }
  if (!record.triage || record.triage === "Normal") {
    lines.push("", "No referral was created for this result.");
  }
  lines.push("", "Screening support only. A qualified clinician makes the final decision.");
  return lines.join("\n");
}
