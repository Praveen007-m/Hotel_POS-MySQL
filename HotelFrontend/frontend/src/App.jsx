import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Sidebar from "./components/layout/Sidebar";
import Topbar from "./components/layout/Topbar";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Rooms from "./pages/Rooms";
import Customers from "./pages/Customers";
import Kitchen from "./pages/Kitchen";
import Billing from "./pages/Billing";
import Booking from "./pages/Booking";
import AddOns from "./pages/AddOns";
import Expenses from "./pages/Expenses";
import FinanceOverview from "./pages/FinanceOverview";
import ProtectedRoute from "./components/ProtectedRoute";
import StaffManagement from "./pages/StaffManagement";
import ChangePassword from "./components/layout/ChangePasswordModal";
import RoomCalendar from "./pages/RoomCalendar";


/* ==========================
   PROTECTED APP LAYOUT
========================== */
const AppLayout = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) return <Navigate to="/login" replace />;

  if (user.role === "kitchen" && location.pathname !== "/kitchen") {
    return <Navigate to="/kitchen" replace />;
  }

  return (
    <div className="flex min-h-screen bg-royal-50 text-royal-900 overflow-x-hidden">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/rooms" element={<Rooms />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/kitchen" element={<Kitchen />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/addons" element={<AddOns />} />
            <Route path="/expense" element={<Expenses />} />
            <Route path="/change-password" element={<ChangePassword />} />
            <Route path="/calendar" element={<RoomCalendar />} />

            {/* ADMIN ONLY */}
            <Route
              path="/finance"
              element={
                <ProtectedRoute role="admin">
                  <FinanceOverview />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staffs"
              element={
                <ProtectedRoute role="admin">
                  <StaffManagement />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </div>
  );
};

/* ==========================
   ROOT APP
========================== */
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* PUBLIC */}
          <Route path="/login" element={<Login />} />
          <Route path="/kitchen-login" element={<Navigate to="/login" replace />} />

          {/* PROTECTED */}
          <Route path="/*" element={<AppLayout />} />
        </Routes>
      </BrowserRouter>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </AuthProvider>
  );
}
