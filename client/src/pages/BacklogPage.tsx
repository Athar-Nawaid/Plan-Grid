import { FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchProject, fetchMembers } from "../store/slices/projectSlice";
import { fetchIssues } from "../store/slices/issueSlice";
import { completeSprint, createSprint, fetchSprints, startSprint } from "../store/slices/sprintSlice";
import { useProjectRealtime } from "../hooks/useProjectRealtime";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import IssueModal from "../components/issue/IssueModal";
import { sprintApi } from "../services";
import type { Sprint } from "../types";

export default function BacklogPage() {
  const params = useParams();
  const projectId = params.projectId!;
  const dispatch = useAppDispatch();

  const project = useAppSelector((s) => s.projects.current);
  const sprints = useAppSelector((s) => s.sprints.sprints);
  const issues = useAppSelector((s) => s.issues.issues);

  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [addingTo, setAddingTo] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchProject(projectId));
    dispatch(fetchMembers(projectId));
    dispatch(fetchSprints(projectId));
    dispatch(fetchIssues({ projectId }));
  }, [dispatch, projectId]);

  useProjectRealtime(projectId);

  const backlogIssues = issues.filter((i) => !i.sprintId);
  const issuesInSprint = (sprintId: string) => issues.filter((i) => i.sprintId === sprintId);

  async function refresh() {
    await dispatch(fetchSprints(projectId));
    await dispatch(fetchIssues({ projectId }));
  }

  async function handleCreateSprint(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const result = await dispatch(createSprint({ projectId, data: { name, goal: goal || undefined } }));
    if (createSprint.fulfilled.match(result)) {
      setName("");
      setGoal("");
      setModalOpen(false);
    }
  }

  async function handleAddIssues(sprint: Sprint, issueId: string) {
    if (!issueId) return;
    await sprintApi.addIssues(projectId, sprint.id, [issueId]);
    setAddingTo(null);
    await refresh();
  }

  async function handleRemoveIssue(sprintId: string, issueId: string) {
    await sprintApi.remove(projectId, sprintId, issueId);
    await refresh();
  }

  const field = "w-full rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100 focus:border-indigo-500 focus:outline-none";

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <nav className="text-xs text-gray-500">
            <Link to="/projects" className="hover:text-gray-300">Projects</Link>
            <span className="mx-1">/</span>
            <Link to={`/projects/${projectId}/board`} className="hover:text-gray-300">{project?.name}</Link>
          </nav>
          <h1 className="mt-1 text-2xl font-bold text-gray-100">Backlog &amp; Sprints</h1>
        </div>
        <Button onClick={() => setModalOpen(true)}>New sprint</Button>
      </div>

      {/* Backlog */}
      <section className="mb-8">
        <h2 className="mb-2 text-lg font-semibold text-gray-100">Backlog</h2>
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-4 shadow-sm">
          {backlogIssues.length === 0 ? (
            <p className="text-sm text-gray-500">No issues in the backlog.</p>
          ) : (
            <ul className="divide-y divide-gray-800 text-sm">
              {backlogIssues.map((issue) => (
                <li key={issue.id} className="flex items-center justify-between gap-3 py-2">
                  <span className="font-medium text-gray-200">{issue.title}</span>
                  <span className="text-xs text-gray-500">
                    {issue.type} · {issue.priority}
                    {issue.storyPoints ? ` · ${issue.storyPoints} pts` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Sprints */}
      <section>
        <h2 className="mb-2 text-lg font-semibold text-gray-100">Sprints</h2>
        {sprints.length === 0 && (
          <p className="text-sm text-gray-500">No sprints yet. Create one to organise work.</p>
        )}
        <div className="space-y-4">
          {sprints.map((sprint) => {
            const sprintIssues = issuesInSprint(sprint.id);
            const count = sprintIssues.length;
            const done = sprintIssues.filter((i) => i.status === "DONE").length;
            return (
              <div key={sprint.id} className="rounded-lg border border-gray-800 bg-gray-900 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-100">{sprint.name}</h3>
                    {sprint.goal && <p className="text-sm text-gray-500">{sprint.goal}</p>}
                    <p className="text-xs text-gray-500">
                      {sprint.status.toLowerCase()} · {done}/{count} issues done
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {sprint.status === "PLANNED" && (
                      <Button variant="secondary" onClick={() => dispatch(startSprint(sprint.id))}>
                        Start sprint
                      </Button>
                    )}
                    {sprint.status === "ACTIVE" && (
                      <Button onClick={() => dispatch(completeSprint(sprint.id))}>Complete sprint</Button>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  {sprintIssues.length === 0 ? (
                    <p className="text-sm text-gray-600">No issues assigned yet.</p>
                  ) : (
                    <ul className="divide-y divide-gray-800 text-sm">
                      {sprintIssues.map((issue) => (
                        <li key={issue.id} className="flex items-center justify-between gap-3 py-2">
                          <span className="flex items-center gap-2 font-medium text-gray-200">
                            <span
                              className={`h-2 w-2 rounded-full ${
                                issue.status === "DONE"
                                  ? "bg-emerald-500"
                                  : issue.status === "IN_PROGRESS"
                                  ? "bg-sky-500"
                                  : issue.status === "IN_REVIEW"
                                  ? "bg-amber-500"
                                  : "bg-gray-500"
                              }`}
                            />
                            {issue.title}
                          </span>
                          <span className="flex items-center gap-3 text-xs text-gray-500">
                            {issue.storyPoints ? `${issue.storyPoints} pts` : ""}
                            <button
                              className="text-gray-500 hover:text-red-400"
                              onClick={() => handleRemoveIssue(sprint.id, issue.id)}
                              title="Remove from sprint"
                            >
                              Remove
                            </button>
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {addingTo === sprint.id ? (
                    <div className="mt-3 flex items-center gap-2">
                      <select
                        className={field}
                        value=""
                        onChange={(e) => handleAddIssues(sprint, e.target.value)}
                        autoFocus
                      >
                        <option value="">Select an issue…</option>
                        {backlogIssues.map((issue) => (
                          <option key={issue.id} value={issue.id}>
                            {issue.title}
                          </option>
                        ))}
                      </select>
                      <Button variant="secondary" onClick={() => setAddingTo(null)}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    backlogIssues.length > 0 &&
                    sprint.status !== "COMPLETED" && (
                      <button
                        className="mt-3 text-sm font-medium text-gray-500 hover:text-indigo-300"
                        onClick={() => setAddingTo(sprint.id)}
                      >
                        + Add from backlog
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create sprint">
        <form onSubmit={handleCreateSprint} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">Name *</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={field}
              placeholder="Sprint 2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">Goal</label>
            <input
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className={field}
              placeholder="Ship the dashboard"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      </Modal>

      <IssueModal />
    </div>
  );
}