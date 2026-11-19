
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useParams,
} from "react-router-dom";

import AppLayout from "../layouts/AppLayout";
import { canAccessPath } from "../data/authorization";
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
import RegisterPage from "../pages/RegisterPage";
import SettingsPage from "../pages/SettingsPage";
import SignInPage from "../pages/SignInPage";

function Protected({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="p-8 text-sm text-slate-500">
        Checking your session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  return children;
}

function RoleAccess({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!canAccessPath(user, location.pathname)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function Guest({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="p-8 text-sm text-slate-500">
        Checking your session...
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function LegacyReferralRedirect() {
  const { caseId } = useParams();

  return (
    <Navigate
      to={`/cases/${caseId}`}
      replace
    />
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public authentication routes */}
      <Route
        path="/signin"
        element={
          <Guest>
            <SignInPage />
          </Guest>
        }
      />

      <Route
        path="/register"
        element={
          <Guest>
            <RegisterPage />
          </Guest>
        }
      />

      {/* Authenticated application */}
      <Route
        element={
          <Protected>
            <AppLayout />
          </Protected>
        }
      >
        <Route
          index
          element={<DashboardPage />}
          handle={{
            crumb: "Home",
            title: "Dashboard",
          }}
        />

        {/* Case submission */}
        <Route
          path="cases/new"
          element={
            <RoleAccess>
              <NewCasePage />
            </RoleAccess>
          }
          handle={{
            crumb: "Cases / New",
            title: "New Screening",
          }}
        />

        {/* Case history */}
        <Route
          path="cases"
          element={
            <RoleAccess>
              <CaseLogPage />
            </RoleAccess>
          }
          handle={{
            crumb: "Cases / History",
            title: "Patient Cases",
          }}
        />

        {/* Case results */}
        <Route
          path="cases/:caseId"
          element={
            <RoleAccess>
              <CaseResultPage />
            </RoleAccess>
          }
          handle={{
            crumb: "Patient Cases",
            title: "Case Results",
          }}
        />

        {/* ECG analysis */}
        <Route
          path="cases/:caseId/ecg"
          element={
            <RoleAccess>
              <EcgAnalysisPage />
            </RoleAccess>
          }
          handle={{
            crumb: "Case Results",
            title: "ECG Analysis",
          }}
        />

        {/* Echocardiography analysis */}
        <Route
          path="cases/:caseId/echo"
          element={
            <RoleAccess>
              <EchoAnalysisPage />
            </RoleAccess>
          }
          handle={{
            crumb: "Case Results",
            title: "Echo Analysis",
          }}
        />

        {/* Multimodal analysis */}
        <Route
          path="cases/:caseId/multimodal"
          element={
            <RoleAccess>
              <MultimodalPage />
            </RoleAccess>
          }
          handle={{
            crumb: "Case Results",
            title: "Multimodal Analysis",
          }}
        />

        {/* Screening review */}
        <Route
          path="referrals"
          element={
            <RoleAccess>
              <ReferralQueuePage />
            </RoleAccess>
          }
          handle={{
            crumb: "Screening",
            title: "Screening Review",
          }}
        />

        {/*
          Legacy referral-summary links now lead
          to the existing case results page.
        */}
        <Route
          path="referrals/:caseId"
          element={
            <RoleAccess>
              <LegacyReferralRedirect />
            </RoleAccess>
          }
          handle={{
            crumb: "Screening Review",
            title: "Case Results",
          }}
        />

        {/* Analytics */}
        <Route
          path="analytics"
          element={
            <RoleAccess>
              <AnalyticsPage />
            </RoleAccess>
          }
          handle={{
            crumb: "Insights",
            title: "Analytics",
          }}
        />

        {/* Screening protocols */}
        <Route
          path="protocols"
          element={
            <RoleAccess>
              <ProtocolsPage />
            </RoleAccess>
          }
          handle={{
            crumb: "Help & Guide",
            title: "Screening Protocols",
          }}
        />

        {/* Account settings */}
        <Route
          path="settings"
          element={
            <RoleAccess>
              <SettingsPage />
            </RoleAccess>
          }
          handle={{
            crumb: "Account",
            title: "Settings",
          }}
        />

        {/* Administration */}
        <Route
          path="admin/users"
          element={
            <RoleAccess>
              <AdminUsersPage />
            </RoleAccess>
          }
          handle={{
            crumb: "Administration",
            title: "Users",
          }}
        />
      </Route>

      {/* Unknown routes */}
      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
}
