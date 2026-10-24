import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import NAS from "./pages/NAS";
import SMB from "./pages/SMB";
import Docker from "./pages/Docker";
import Kubernetes from "./pages/Kubernetes";
import Network from "./pages/Network";
import Schedules from "./pages/Schedules";
import Alerts from "./pages/Alerts";
import Reports from "./pages/Reports";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="nas" element={<NAS />} />
          <Route path="smb" element={<SMB />} />
          <Route path="docker" element={<Docker />} />
          <Route path="kubernetes" element={<Kubernetes />} />
          <Route path="network" element={<Network />} />
          <Route path="schedules" element={<Schedules />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="reports" element={<Reports />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
