import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useAppSelector } from "../../store/hooks";

export default function AppLayout() {
  const sidebarOpen = useAppSelector((s) => s.ui.sidebarOpen);

  return (
    <div className="flex h-screen overflow-hidden">
      {sidebarOpen && <Sidebar />}
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}