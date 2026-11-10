import { Outlet, useNavigate } from "react-router-dom";
import AppHeader from "../components/layout/AppHeader";
import { useAuth } from "../hooks/useAuth";
import { useCases } from "../hooks/useCases";

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { referrals } = useCases();
  const navigate = useNavigate();
  const alerts = referrals.filter((item) => item.status !== "Actioned" && item.status !== "Closed");

  return (
    <div className="app-shell min-h-screen">
      <AppHeader
        user={user}
        alerts={alerts}
        onSignOut={() => {
          logout();
          navigate("/signin");
        }}
      />
      <main className="page-enter mx-auto w-full max-w-[1180px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Outlet />
      </main>
    </div>
  );
}
