import { BrowserRouter, Routes, Route } from "react-router-dom";

import Sidebar from "./Components/Sidebar";
import Navbar from "./Components/Navbar";
import Dashboard from "./pages/Dashboard";

import Devices from "./pages/Devices";
import NetworkTraffic from "./pages/NetworkTraffic";
import Alerts from "./pages/Alerts";
import Incidents from "./pages/Incidents";

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />

        <div className="main-layout">
          <Navbar />

          <main className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/devices" element={<Devices />} />
              <Route path="/traffic" element={<NetworkTraffic />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/incidents" element={<Incidents />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}