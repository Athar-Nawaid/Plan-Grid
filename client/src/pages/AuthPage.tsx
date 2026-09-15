import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { login, register } from "../store/slices/authSlice";

export default function AuthPage({ mode }: { mode: "login" | "register" }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const status = useAppSelector((s) => s.auth.status);
  const error = useAppSelector((s) => s.auth.error);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (mode === "login") {
      const result = await dispatch(login({ email, password }));
      if (login.fulfilled.match(result)) navigate("/");
    } else {
      const result = await dispatch(register({ email, name, password }));
      if (register.fulfilled.match(result)) navigate("/");
    }
  }

  const loading = status === "loading";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 p-4">
      <div className="w-full max-w-md rounded-lg border border-gray-800 bg-gray-900 p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-md bg-indigo-600 text-xl font-bold text-white">
            PG
          </div>
          <h1 className="text-2xl font-bold text-gray-100">Plan Grid</h1>
          <p className="mt-1 text-sm text-gray-500">
            {mode === "login" ? "Welcome back. Sign in to continue." : "Create your account to get started."}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">Name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100 focus:border-indigo-500 focus:outline-none"
                placeholder="Jane Doe"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">Email</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100 focus:border-indigo-500 focus:outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">Password</label>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100 focus:border-indigo-500 focus:outline-none"
              placeholder={mode === "register" ? "At least 6 chars with a number" : "••••••••"}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-500">
          {mode === "login" ? (
            <>
              No account?{" "}
              <Link to="/register" className="font-medium text-indigo-600 hover:underline">
                Create one
              </Link>
            </>
          ) : (
            <>
              Already registered?{" "}
              <Link to="/login" className="font-medium text-indigo-600 hover:underline">
                Sign in
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}