import { useMemo } from "react";
import { useCases } from "./useCases";

export function useScreening(caseId) {
  const { cases, referrals } = useCases();
  return useMemo(() => {
    const record = cases.find((item) => item.id === caseId) || null;
    const referral = referrals.find((item) => item.caseId === caseId) || null;
    return { record, referral };
  }, [cases, referrals, caseId]);
}
