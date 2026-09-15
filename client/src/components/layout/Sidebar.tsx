import { NavLink } from "react-router-dom";
import { useAppSelector } from "../../store/hooks";

const nav = [
  { to: "/", label: "Dashboard", icon: "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" },
  { to: "/projects", label: "Projects", icon: "M3 3h18v18H3V3zm2 2v14h14V5H5zm2 2h10v2H7V7zm0 4h10v2H7v-2zm0 4h6v2H7v-2z" },
];

export default function Sidebar() {
  const user = useAppSelector((s) => s.auth.user);

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-gray-800 bg-gray-900">
      <div className="flex h-14 items-center gap-2 border-b border-gray-800 px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-600 font-bold text-white">
          PG
        </div>
        <span className="text-lg font-semibold text-gray-100">Plan Grid</span>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? "bg-indigo-600/15 text-indigo-300"
                  : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
              }`
            }
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d={item.icon} />
            </svg>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {user && (
        <div className="border-t border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500 text-sm font-semibold text-white">
              {user.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-100">{user.name}</p>
              <p className="truncate text-xs text-gray-500">{user.email}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}