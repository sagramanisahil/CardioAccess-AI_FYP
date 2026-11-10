import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import { isAdminUser } from "../data/seed";
import { useAuth } from "../hooks/useAuth";
import AdminUsersPage from "../pages/AdminUsersPage";
import AnalyticsPage from "../pages/AnalyticsPage";
import CaseLogPage from "../pages/CaseLogPage";
import CaseResultPage from "../pages/CaseResultPage";
import DashboardPage from "../pages/DashboardPage";
import EcgAnalysisPage from "../pages/EcgAnalysisPage";
import EchoAnalysisPage from "../pages/EchoAnalysisPage";
import MultimodalPage from "../pages/MultimodalPage";
import NewCasePage from "../pages/NewCasePage";
import ProtocolsPage from "../pages/ProtocolsPage";
import ReferralQueuePage from "../pages/ReferralQueuePage";
import ReferralSummaryPage from "../pages/ReferralSummaryPage";
import RegisterPage from "../pages/RegisterPage";
import SettingsPage from "../pages/SettingsPage";
import SignInPage from "../pages/SignInPage";

function Protected({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/signin" replace />;
  return children;
}

function AdminOnly({ children }) {
  const { user } = useAuth();
  if (!isAdminUser(user)) return <Navigate to="/" replace />;
  return children;
}

function Guest({ children }) {
  const { user } = useAuth();
  if (user) return <Navigate to="/" replace />;
  return children;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/signin" element={<Guest><SignInPage /></Guest>} />
      <Route path="/register" element={<Guest><RegisterPage /></Guest>} />
      <Route element={<Protected><AppLayout /></Protected>}>
        <Route index element={<DashboardPage />} handle={{ crumb: "Home", title: "Dashboard" }} />
        <Route path="cases/new" element={<NewCasePage />} handle={{ crumb: "Cases / New", title: "New Case" }} />
        <Route path="cases" element={<CaseLogPage />} handle={{ crumb: "Cases / History", title: "Case Log" }} />
        <Route path="cases/:caseId" element={<CaseResultPage />} handle={{ crumb: "Case Log", title: "Case result" }} />
        <Route path="cases/:caseId/ecg" element={<EcgAnalysisPage />} handle={{ crumb: "Case result", title: "ECG analysis" }} />
        <Route path="cases/:caseId/echo" element={<EchoAnalysisPage />} handle={{ crumb: "Case result", title: "ECHO analysis" }} />
        <Route path="cases/:caseId/multimodal" element={<MultimodalPage />} handle={{ crumb: "Case result", title: "Multimodal analysis" }} />
        <Route path="referrals" element={<ReferralQueuePage />} handle={{ crumb: "Referrals", title: "Referral Queue" }} />
        <Route path="referrals/:caseId" element={<ReferralSummaryPage />} handle={{ crumb: "Referrals", title: "Referral summary" }} />
        <Route path="analytics" element={<AnalyticsPage />} handle={{ crumb: "Insights", title: "Analytics" }} />
        <Route path="protocols" element={<ProtocolsPage />} handle={{ crumb: "Help & Guide", title: "Screening Protocols" }} />
        <Route path="settings" element={<SettingsPage />} handle={{ crumb: "Account", title: "Settings" }} />
        <Route path="admin/users" element={<AdminOnly><AdminUsersPage /></AdminOnly>} handle={{ crumb: "Administration", title: "Users" }} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
