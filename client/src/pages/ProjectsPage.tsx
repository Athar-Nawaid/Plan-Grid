import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Modal from "../components/common/Modal";
import Button from "../components/common/Button";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { createProject, fetchProjects } from "../store/slices/projectSlice";
import { setProjectModal } from "../store/slices/uiSlice";

const KEY_PATTERN = /^[A-Z]+$/;

export default function ProjectsPage() {
  const dispatch = useAppDispatch();
  const projects = useAppSelector((s) => s.projects.projects);
  const status = useAppSelector((s) => s.projects.status);
  const modalOpen = useAppSelector((s) => s.ui.projectModalOpen);
  const error = useAppSelector((s) => s.projects.error);

  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (status === "idle") dispatch(fetchProjects());
  }, [dispatch, status]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    const normalizedKey = key.toUpperCase();
    if (!KEY_PATTERN.test(normalizedKey)) {
      setLocalError("Key must be uppercase letters only, e.g. PROJ");
      return;
    }
    const result = await dispatch(
      createProject({ name, key: normalizedKey, description: description || undefined })
    );
    if (createProject.fulfilled.match(result)) {
      setLocalError("");
      setName("");
      setKey("");
      setDescription("");
      dispatch(setProjectModal(false));
    } else {
      setLocalError(error ?? "Failed to create project");
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Projects</h1>
          <p className="mt-1 text-sm text-gray-500">All your projects in one place.</p>
        </div>
        <Button onClick={() => dispatch(setProjectModal(true))}>New project</Button>
      </div>

      {projects.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed border-gray-700 bg-gray-900 p-12 text-center">
          <p className="text-sm text-gray-500">No projects yet. Create your first project to get started.</p>
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-lg border border-gray-800 bg-gray-900 shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-800 bg-gray-800/50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-3">Key</th>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Issues</th>
                <th className="px-5 py-3">Members</th>
                <th className="px-5 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id} className="border-b border-gray-800 last:border-0 hover:bg-gray-800">
                  <td className="px-5 py-3">
                    <span className="rounded bg-indigo-600/15 px-2 py-0.5 text-xs font-bold text-indigo-300">
                      {p.key}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-medium text-gray-100">
                    <Link to={`/projects/${p.id}/board`} className="hover:text-indigo-300">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-gray-500">{p._count?.issues ?? 0}</td>
                  <td className="px-5 py-3 text-gray-500">{p._count?.members ?? 0}</td>
                  <td className="px-5 py-3 text-gray-500">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => dispatch(setProjectModal(false))} title="Create project">
        <form onSubmit={handleCreate} className="space-y-4">
          {localError && (
            <div className="rounded-md bg-red-500/15 px-3 py-2 text-sm text-red-300">{localError}</div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100 focus:border-indigo-500 focus:outline-none"
              placeholder="My awesome project"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">
              Key <span className="text-gray-500">(uppercase, 1-10 chars)</span>
            </label>
            <input
              required
              value={key}
              onChange={(e) => setKey(e.target.value.toUpperCase())}
              className="w-full rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100 focus:border-indigo-500 focus:outline-none"
              placeholder="MYPROJ"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100 focus:border-indigo-500 focus:outline-none"
              placeholder="What is this project about?"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => dispatch(setProjectModal(false))}>
              Cancel
            </Button>
            <Button type="submit" disabled={status === "loading"}>
              Create
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}