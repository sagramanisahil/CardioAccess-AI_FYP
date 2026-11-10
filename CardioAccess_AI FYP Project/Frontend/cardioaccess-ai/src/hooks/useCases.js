import { useMemo } from "react";
import { useApp } from "./useApp";

export function useCases() {
  const { cases, referrals, user, updateReferral } = useApp();
  const ownCases = useMemo(
    () => (user ? cases.filter((item) => item.ownerId === user.id) : []),
    [cases, user],
  );
  const ownReferrals = useMemo(
    () => referrals.filter((item) => ownCases.some((row) => row.id === item.caseId)),
    [referrals, ownCases],
  );
  return { cases: ownCases, allCases: cases, referrals: ownReferrals, updateReferral };
}
