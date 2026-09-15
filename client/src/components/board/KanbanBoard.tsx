import { useMemo } from "react";
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from "@hello-pangea/dnd";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import type { Issue, IssueStatus } from "../../types";
import IssueCard from "./IssueCard";
import { setIssueStatus } from "../../store/slices/issueSlice";
import { openIssueModal } from "../../store/slices/uiSlice";

export const COLUMNS: { status: IssueStatus; label: string; color: string }[] = [
  { status: "TODO", label: "To do", color: "bg-gray-400" },
  { status: "IN_PROGRESS", label: "In progress", color: "bg-sky-500" },
  { status: "IN_REVIEW", label: "In review", color: "bg-amber-500" },
  { status: "DONE", label: "Done", color: "bg-emerald-500" },
];

type ColumnKey = typeof COLUMNS[number]["status"];

function groupByStatus(issues: Issue[]): Record<ColumnKey, Issue[]> {
  const groups: Record<ColumnKey, Issue[]> = {
    TODO: [],
    IN_PROGRESS: [],
    IN_REVIEW: [],
    DONE: [],
  };
  for (const issue of issues) {
    const list = groups[issue.status as ColumnKey];
    if (list) list.push(issue);
  }
  for (const key of Object.keys(groups) as ColumnKey[]) {
    groups[key].sort((a, b) => a.position - b.position);
  }
  return groups;
}

export default function KanbanBoard() {
  const dispatch = useAppDispatch();
  const issues = useAppSelector((s) => s.issues.issues);

  const groups = useMemo(() => groupByStatus(issues), [issues]);

  async function handleDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    const sourceStatus = source.droppableId as ColumnKey;
    const destStatus = destination.droppableId as ColumnKey;
    if (sourceStatus === destStatus && source.index === destination.index) return;

    const sourceList = [...groups[sourceStatus]];
    const destList =
      sourceStatus === destStatus ? sourceList : [...groups[destStatus]];

    const [moved] = sourceList.splice(source.index, 1);
    if (!moved) return;
    destList.splice(destination.index, 0, moved);

    const nextPosition = destList.length > 0 ? Math.max(...destList.map((i) => i.position)) + 1 : 1;

    dispatch(
      setIssueStatus({
        id: draggableId,
        status: destStatus,
        position: nextPosition,
      })
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const list = groups[col.status];
          const count = list.reduce((sum, i) => sum + (i.storyPoints ?? 0), 0);
          return (
            <Droppable key={col.status} droppableId={col.status}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex flex-col rounded-lg bg-gray-900 p-3 transition ${
                    snapshot.isDraggingOver ? "bg-indigo-950/60 ring-1 ring-indigo-500/40" : ""
                  }`}
                >
                  <div className="mb-3 flex items-center gap-2 px-1">
                    <span className={`h-2.5 w-2.5 rounded-full ${col.color}`} />
                    <h3 className="text-sm font-semibold text-gray-200">{col.label}</h3>
                    <span className="text-xs text-gray-500">
                      · {list.length} · {count} pts
                    </span>
                  </div>

                  <div className="flex min-h-24 flex-col gap-2">
                    {list.map((issue, index) => (
                      <Draggable key={issue.id} draggableId={issue.id} index={index}>
                        {(dProvided, dSnapshot) => (
                          <div
                            ref={dProvided.innerRef}
                            {...dProvided.draggableProps}
                            {...dProvided.dragHandleProps}
                            className={dSnapshot.isDragging ? "rotate-1" : ""}
                          >
                            <IssueCard issue={issue} assignee={issue.assignee} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>

                  <button
                    className="mt-3 rounded-md px-2 py-1.5 text-left text-sm font-medium text-gray-500 hover:bg-gray-800 hover:text-gray-200"
                    onClick={() => dispatch(openIssueModal({ createFor: { status: col.status } }))}
                  >
                    + Add issue
                  </button>
                </div>
              )}
            </Droppable>
          );
        })}
      </div>
    </DragDropContext>
  );
}