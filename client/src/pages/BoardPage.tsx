import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchProject, fetchMembers } from "../store/slices/projectSlice";
import { fetchIssues } from "../store/slices/issueSlice";
import { fetchSprints } from "../store/slices/sprintSlice";
import KanbanBoard from "../components/board/KanbanBoard";
import IssueModal from "../components/issue/IssueModal";
import Button from "../components/common/Button";
import MembersModal from "../components/project/MembersModal";
import { useProjectRealtime } from "../hooks/useProjectRealtime";
import { ActivityLog } from "../types";
import { activityApi } from "../services";

export default function BoardPage() {
  const params = useParams();
  const projectId = params.projectId!;
  const dispatch = useAppDispatch();

  const project = useAppSelector((s) => s.projects.current);
  const issuesStatus = useAppSelector((s) => s.issues.status);
  const members = useAppSelector((s) => s.projects.members);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("");
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [membersOpen, setMembersOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchProject(projectId));
    dispatch(fetchMembers(projectId));
    dispatch(fetchSprints(projectId));
  }, [dispatch, projectId]);

  useEffect(() => {
    dispatch(fetchIssues({ projectId, filters: undefined }));
    activityApi.project(projectId).then(setActivity).catch(() => setActivity([]));
  }, [dispatch, projectId]);

  const filters = useMemo(() => {
    const f: Record<string, string | undefined> = {};
    if (search) f.search = search;
    if (filterStatus) f.status = filterStatus;
    if (filterAssignee) f.assigneeId = filterAssignee;
    return f;
  }, [search, filterStatus, filterAssignee]);

  useEffect(() => {
    const t = setTimeout(() => dispatch(fetchIssues({ projectId, filters })), 300);
    return () => clearTimeout(t);
  }, [dispatch, projectId, filters]);

  useProjectRealtime(projectId, filters);

  const field = "rounded-md border border-gray-700 bg-gray-950 px-3 py-1.5 text-sm text-gray-100 focus:border-indigo-500 focus:outline-none";

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <nav className="text-xs text-gray-500">
            <Link to="/projects" className="hover:text-gray-300">Projects</Link>
            <span className="mx-1">/</span>
            <span className="text-gray-400">{project?.key ?? projectId.slice(0, 8)}</span>
          </nav>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold text-gray-100">
            {project?.name ?? "Loading…"}
            <span className="rounded bg-indigo-600/15 px-1.5 py-0.5 text-xs font-bold text-indigo-300">
              {project?.key}
            </span>
          </h1>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setMembersOpen(true)}>
            Members
          </Button>
          <Link to={`/projects/${projectId}/backlog`}>
            <Button variant="secondary">Backlog &amp; Sprints</Button>
          </Link>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${field} w-64`}
          placeholder="Search issues…"
        />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={field}>
          <option value="">All statuses</option>
          <option value="TODO">To do</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="IN_REVIEW">In review</option>
          <option value="DONE">Done</option>
        </select>
        <select value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)} className={field}>
          <option value="">All assignees</option>
          {members.map((m) => (
            <option key={m.userId} value={m.userId}>
              {m.user?.name ?? m.userId}
            </option>
          ))}
        </select>
      </div>

      {issuesStatus === "loading" && <p className="text-sm text-gray-400">Loading board…</p>}
      <KanbanBoard />
      {activity.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-semibold text-gray-100">Recent activity</h2>
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-4 text-sm shadow-sm">
            {activity.map((log) => (
              <div key={log._id} className="border-b border-gray-800 py-2 text-gray-400 last:border-0">
                <span className="font-medium text-gray-200">{log.actorName}</span>{" "}
                {log.action} <span className="capitalize">{log.entityType.toLowerCase()}</span>
                {log.changes?.map((c) => (
                  <span key={c.field} className="text-xs text-gray-500">
                    {" "}· {c.field}: {c.oldValue || "—"} → {c.newValue || "—"}
                  </span>
                ))}
                <span className="ml-2 text-xs text-gray-500">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <IssueModal />
      <MembersModal open={membersOpen} onClose={() => setMembersOpen(false)} projectId={projectId} />
    </div>
  );
}