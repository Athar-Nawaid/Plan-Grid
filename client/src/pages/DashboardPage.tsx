import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchProjects } from "../store/slices/projectSlice";

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const projects = useAppSelector((s) => s.projects.projects);
  const user = useAppSelector((s) => s.auth.user);
  const status = useAppSelector((s) => s.projects.status);

  useEffect(() => {
    if (status === "idle") dispatch(fetchProjects());
  }, [dispatch, status]);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-100">Dashboard</h1>
      <p className="mt-1 text-sm text-gray-500">
        {user ? `Welcome back, ${user.name}.` : ""}
      </p>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your projects</h2>
          <Link to="/projects" className="text-sm font-medium text-indigo-600 hover:underline">
            View all
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-700 bg-gray-900 p-10 text-center">
            <p className="text-sm text-gray-500">No projects yet.</p>
            <Link
              to="/projects"
              className="mt-3 inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Create a project
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <Link
                key={p.id}
                to={`/projects/${p.id}/board`}
                className="group rounded-lg border border-gray-800 bg-gray-900 p-5 shadow-sm transition hover:border-indigo-500 hover:shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-indigo-600/15 text-xs font-bold text-indigo-300">
                    {p.key}
                  </div>
                </div>
                <h3 className="mt-3 font-semibold text-gray-100 group-hover:text-indigo-300">{p.name}</h3>
                <p className="mt-0.5 text-sm text-gray-500 line-clamp-2">{p.description || "No description"}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                  <span>{p._count?.issues ?? 0} issues</span>
                  <span>{p._count?.members ?? 0} members</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}