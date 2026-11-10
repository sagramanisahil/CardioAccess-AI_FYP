const FALLBACK =
  "I can help with this referral queue demo: triage meanings, the selected case, filters, and how to mark a case as actioned. I cannot diagnose, recommend treatment, change a screening result, or contact a hospital. A qualified clinician makes the care decision.";

export function assistantReply(raw, referral) {
  const text = raw.trim().toLowerCase();
  if (!text) return "Type a question about the referral queue.";

  if (text.includes("urgent case")) {
    return "Urgent Referral cases are the red rows in this queue. While one stays Open or In review, the row shows an escalation-monitoring indicator. That indicator is a reminder inside this demonstration. It does not contact a hospital.";
  }
  if (text.includes("filter") || text.includes("status indicator") || text.includes("badge")) {
    return "Use the triage chips to show Needs Review or Urgent Referral. The status menu limits the table to Open, In review, or Actioned. Normal cases never enter this queue. Search matches the referral ID or case code.";
  }
  if (text.includes("mark") || text.includes("actioned") || text.includes("workflow") || text.includes("reviewing")) {
    return "Open a referral with View Details, read the available ECG and Echo findings, then choose Mark as actioned. A confirmation step appears first. Actioning a case records a local queue status only. It does not change the stored screening result or triage category.";
  }
  if (text.includes("needs review")) {
    return "Needs Review means the screening-support result should be looked at by a clinician before any referral decision. It is not a diagnosis. Amber marks this category.";
  }
  if (text.includes("urgent referral") || text.includes("triage status") || text.includes("explain the triage")) {
    return "Urgent Referral is the higher-priority screening category in this prototype. Needs Review asks for clinician review. Normal results do not create a queue entry. None of these labels is a diagnosis.";
  }
  if (text.includes("summar") || text.includes("this referral") || text.includes("selected") || text.includes("details should")) {
    if (!referral?.record) {
      return "Select a referral with View Details first. I can then summarize only the information already stored for that demonstration case.";
    }
    return summarize(referral);
  }
  if (text.includes("hello") || text.includes("help")) {
    return "I am CardioAssist, a frontend demonstration assistant for the referral queue. Ask me to summarize the selected referral, explain a triage label, or walk through marking a case as actioned.";
  }
  return FALLBACK;
}

function summarize(referral) {
  const record = referral.record;
  const parts = [
    `${referral.id} is ${record.triage}. Queue status: ${referral.status}.`,
    record.triageReason || "No additional triage sentence is stored.",
  ];
  if (record.ecg) {
    parts.push(`ECG class on file: ${record.ecg.predictedClass}, confidence ${record.ecg.confidence.toFixed(2)}.`);
  }
  if (record.echo?.efAvailable) {
    parts.push(`Echo EF on file: ${record.echo.ef.toFixed(1)}%.`);
  } else if (record.modality === "ecg") {
    parts.push("No echocardiography result is stored for this case.");
  }
  if (record.lowConfidenceModalities?.length) {
    parts.push(`Low confidence is flagged for ${record.lowConfidenceModalities.join(", ")}.`);
  }
  parts.push("This summary restates the demonstration record. It is not a diagnosis.");
  return parts.join(" ");
}
