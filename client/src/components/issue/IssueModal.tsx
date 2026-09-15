import { FormEvent, useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { closeIssueModal } from "../../store/slices/uiSlice";
import { createIssue, updateIssue } from "../../store/slices/issueSlice";
import Button from "../common/Button";
import { issueApi } from "../../services";
import type { Comment, Issue } from "../../types";
import Avatar from "../common/Avatar";

export default function IssueModal() {
  const dispatch = useAppDispatch();
  const { open, issueId, createFor } = useAppSelector((s) => s.ui.issueModal);
  const members = useAppSelector((s) => s.projects.members);
  const sprints = useAppSelector((s) => s.sprints.sprints);
  const currentProject = useAppSelector((s) => s.projects.current);
  const storedIssue = useAppSelector((s) =>
    issueId ? s.issues.issues.find((i) => i.id === issueId) : undefined
  );

  const [issue, setIssue] = useState<Issue | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<Issue["type"]>("TASK");
  const [priority, setPriority] = useState<Issue["priority"]>("MEDIUM");
  const [status, setStatus] = useState<Issue["status"]>("TODO");
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [sprintId, setSprintId] = useState<string | null>(null);
  const [storyPoints, setStoryPoints] = useState("");

  const projectId = storedIssue?.projectId ?? currentProject?.id ?? "";

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setDescription("");
    setType("TASK");
    setPriority("MEDIUM");
    setStatus((createFor?.status ?? "TODO") as Issue["status"]);
    setAssigneeId(null);
    setSprintId(null);
    setStoryPoints("");
    setIssue(null);
    setComments([]);
    setCommentText("");

    if (issueId && projectId) {
      issueApi.get(projectId, issueId).then((data) => {
        setIssue(data);
        setTitle(data.title);
        setDescription(data.description ?? "");
        setType(data.type);
        setPriority(data.priority);
        setStatus(data.status);
        setAssigneeId(data.assigneeId ?? null);
        setSprintId(data.sprintId ?? null);
        setStoryPoints(data.storyPoints != null ? String(data.storyPoints) : "");
        setComments(data.comments ?? []);
      }).catch(console.error);
    }
  }, [open, issueId, createFor, projectId]);

  if (!open) return null;

  function close() {
    dispatch(closeIssueModal());
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!projectId) return;

    const payload = {
      title,
      description: description || undefined,
      type,
      priority,
      status,
      assigneeId,
      sprintId,
      storyPoints: storyPoints ? parseInt(storyPoints, 10) : null,
    };

    if (issue) {
      await dispatch(updateIssue({ id: issue.id, data: payload }));
    } else {
      await dispatch(createIssue({ projectId, data: payload }));
    }
    close();
  }

  async function handleAddComment() {
    if (!commentText.trim() || !issue) return;
    try {
      const comment = await issueApi.addComment(projectId, issue.id, commentText);
      setComments([...comments, comment]);
      setCommentText("");
    } catch (err) {
      console.error(err);
    }
  }

  const field = "w-full rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100 focus:border-indigo-500 focus:outline-none";

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 py-8"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="w-full max-w-2xl rounded-lg border border-gray-800 bg-gray-900 shadow-xl">
        <form onSubmit={handleSubmit}>
          <div className="border-b border-gray-800 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-100">{issue ? "Edit issue" : "Create issue"}</h2>
          </div>

          <div className="space-y-4 px-6 py-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">Title *</label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={field}
                placeholder="Short summary of the issue"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className={field}
                placeholder="Add more context…"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-300">Type</label>
                <select value={type} onChange={(e) => setType(e.target.value as Issue["type"])} className={field}>
                  <option value="TASK">Task</option>
                  <option value="BUG">Bug</option>
                  <option value="FEATURE">Feature</option>
                  <option value="STORY">Story</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-300">Priority</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value as Issue["priority"])} className={field}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-300">Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value as Issue["status"])} className={field}>
                  <option value="TODO">To do</option>
                  <option value="IN_PROGRESS">In progress</option>
                  <option value="IN_REVIEW">In review</option>
                  <option value="DONE">Done</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-300">Story points</label>
                <input
                  type="number"
                  min={0}
                  value={storyPoints}
                  onChange={(e) => setStoryPoints(e.target.value)}
                  className={field}
                  placeholder="3"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-300">Assignee</label>
                <select
                  value={assigneeId ?? ""}
                  onChange={(e) => setAssigneeId(e.target.value || null)}
                  className={field}
                >
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.user?.name ?? m.userId}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-300">Sprint</label>
                <select
                  value={sprintId ?? ""}
                  onChange={(e) => setSprintId(e.target.value || null)}
                  className={field}
                >
                  <option value="">Backlog</option>
                  {sprints.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {issue && (
              <div className="rounded-lg border border-gray-800 bg-gray-950/50 p-4">
                <h3 className="mb-3 text-sm font-semibold text-gray-300">Comments ({comments.length})</h3>
                {comments.length === 0 ? (
                  <p className="mb-3 text-sm text-gray-600">No comments yet.</p>
                ) : (
                  <ul className="mb-3 space-y-3">
                    {comments.map((c) => (
                      <li key={c.id} className="flex gap-3">
                        {c.user && <Avatar name={c.user.name} size="sm" />}
                        <div className="min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className="text-sm font-medium text-gray-200">{c.user?.name}</span>
                            <span className="text-xs text-gray-600">
                              {new Date(c.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap break-words text-sm text-gray-400">{c.content}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex gap-2">
                  <input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddComment();
                    }}
                    className={field}
                    placeholder="Write a comment… (Enter to post)"
                  />
                  <Button variant="secondary" onClick={handleAddComment} disabled={!commentText.trim()}>
                    Post
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-gray-800 px-6 py-4">
            <div className="flex items-center gap-2">
              {issue?.assignee && <Avatar name={issue.assignee.name} size="sm" />}
              {issue && (
                <span className="text-xs text-gray-500">
                  Reported by {issue.reporter?.name ?? "unknown"}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={close}>
                Cancel
              </Button>
              <Button type="submit">{issue ? "Save changes" : "Create"}</Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}