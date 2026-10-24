import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  HardDrive,
  Network,
  Server,
  Box,
  Globe,
  Clock,
  Bell,
  FileBarChart2,
} from "lucide-react";
import clsx from "clsx";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/nas", label: "NAS", icon: HardDrive },
  { to: "/smb", label: "SMB", icon: Network },
  { to: "/docker", label: "Docker", icon: Box },
  { to: "/kubernetes", label: "Kubernetes", icon: Server },
  { to: "/network", label: "Network", icon: Globe },
  { to: "/schedules", label: "Schedules", icon: Clock },
  { to: "/alerts", label: "Alerts", icon: Bell },
  { to: "/reports", label: "Reports", icon: FileBarChart2 },
];

export default function Sidebar() {
  return (
    <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col">
      <div className="px-4 py-5 border-b border-gray-800">
        <h1 className="text-sm font-bold text-blue-400 tracking-wide uppercase">
          HomeLab
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">Benchmark Center</p>
      </div>
      <nav className="flex-1 py-4 space-y-0.5">
        {links.map(({ to, label, icon: Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg mx-2 transition-colors",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-gray-100 hover:bg-gray-800"
              )
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-3 border-t border-gray-800 text-xs text-gray-600">
        v1.0.0
      </div>
    </aside>
  );
}
