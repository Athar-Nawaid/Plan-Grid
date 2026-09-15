import { useAppDispatch } from "../../store/hooks";
import { openIssueModal } from "../../store/slices/uiSlice";
import type { Issue } from "../../types";
import Avatar from "../common/Avatar";

const typeStyles: Record<Issue["type"], string> = {
  BUG: "bg-red-500/15 text-red-300",
  FEATURE: "bg-emerald-500/15 text-emerald-300",
  TASK: "bg-sky-500/15 text-sky-300",
  STORY: "bg-purple-500/15 text-purple-300",
};

const priorityDot: Record<Issue["priority"], string> = {
  LOW: "bg-gray-300",
  MEDIUM: "bg-sky-400",
  HIGH: "bg-amber-500",
  CRITICAL: "bg-red-500",
};

interface IssueCardProps {
  issue: Issue;
  assignee?: Issue["assignee"];
}

export default function IssueCard({ issue, assignee }: IssueCardProps) {
  const dispatch = useAppDispatch();

  return (
    <div
      className="cursor-pointer rounded-md border border-gray-700 bg-gray-800 p-3 shadow-sm transition hover:border-indigo-500 hover:shadow-lg"
      onClick={() => dispatch(openIssueModal({ issueId: issue.id }))}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") dispatch(openIssueModal({ issueId: issue.id }));
      }}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${typeStyles[issue.type]}`}>
          {issue.type}
        </span>
        <span className="flex items-center gap-1" title={`Priority: ${issue.priority}`}>
          <span className={`h-2 w-2 rounded-full ${priorityDot[issue.priority]}`} />
        </span>
      </div>

      <p className="line-clamp-2 text-sm font-medium text-gray-100">{issue.title}</p>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {issue.sprint?.name ?? ""} {issue.storyPoints ? `· ${issue.storyPoints} pts` : ""}
        </span>
        {assignee && <Avatar name={assignee.name} size="sm" />}
      </div>
    </div>
  );
}