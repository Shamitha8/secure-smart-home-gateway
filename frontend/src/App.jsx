import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import Sidebar from "./Components/Sidebar";
import Navbar from "./Components/Navbar";
import ProtectedRoute from "./Components/ProtectedRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Devices from "./pages/Devices";
import NetworkTraffic from "./pages/NetworkTraffic";
import Alerts from "./pages/Alerts";
import Incidents from "./pages/Incidents";
import Profile from "./pages/profile";

function DashboardLayout() {
  return (
    <div className="app-layout">
      <Sidebar />

      <div className="main-layout">
        <Navbar />

        <main className="main-content">
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="devices" element={<Devices />} />
            <Route path="traffic" element={<NetworkTraffic />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="incidents" element={<Incidents />} />
            <Route path="profile" element={<Profile />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard/*" element={<DashboardLayout />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}