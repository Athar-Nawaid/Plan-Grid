import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../../store/slices/authSlice";
import { toggleSidebar } from "../../store/slices/uiSlice";

export default function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-800 bg-gray-900 px-6">
      <button
        className="rounded-md p-1.5 text-gray-400 hover:bg-gray-800 hover:text-gray-200"
        onClick={() => dispatch(toggleSidebar())}
        aria-label="Toggle sidebar"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <button
        className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-gray-200"
        onClick={() => {
          dispatch(logout());
          navigate("/login");
        }}
      >
        Log out
      </button>
    </header>
  );
}