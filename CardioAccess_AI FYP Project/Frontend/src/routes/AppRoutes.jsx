
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

import AdminDashboardPage from "../pages/AdminDashboardPage";
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
import ScreeningReviewPage from "../pages/ScreeningReviewPage";
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

function RoleDashboard() {
  const { user } = useAuth();
  const role = String(user?.role || "").toLowerCase();

  if (role === "admin") {
    return <AdminDashboardPage />;
  }

  if (role === "clinician" || role === "nurse") {
    return <DashboardPage />;
  }

  return (
    <div className="p-8 text-sm text-slate-600">
      Your account does not have an assigned dashboard role.
      Please contact an administrator.
    </div>
  );
}

function LegacyReferralRedirect() {
  const { caseId } = useParams();

  return <Navigate to={`/cases/${caseId}`} replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
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

      <Route
        element={
          <Protected>
            <AppLayout />
          </Protected>
        }
      >
        <Route
          index
          element={<RoleDashboard />}
          handle={{
            crumb: "Home",
            title: "Dashboard",
          }}
        />

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

        <Route
          path="screening-review"
          element={
            <RoleAccess>
              <ScreeningReviewPage />
            </RoleAccess>
          }
          handle={{
            crumb: "Screening",
            title: "Screening Review",
          }}
        />

        <Route
          path="referrals"
          element={<Navigate to="/screening-review" replace />}
        />

        <Route
          path="referrals/:caseId"
          element={<LegacyReferralRedirect />}
          handle={{
            crumb: "Screening Review",
            title: "Case Results",
          }}
        />

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

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
}
