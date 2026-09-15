import { useEffect } from "react";
import { useAppDispatch } from "../store/hooks";
import { getSocket, joinProject, leaveProject } from "../services/socket";
import { fetchSprints } from "../store/slices/sprintSlice";
import { fetchIssues } from "../store/slices/issueSlice";

/**
 * Joins the project's socket room and refreshes issues + sprints whenever
 * another user triggers a `project:changed` event (create/update/delete issue,
 * sprint, status move, etc). Reruns when filters change so refetches honor
 * the current board filters.
 */
export function useProjectRealtime(
  projectId: string,
  filters?: Record<string, string | number | undefined>
): void {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!projectId) return;

    const socket = getSocket();
    joinProject(projectId);

    const refresh = () => {
      dispatch(fetchIssues({ projectId, filters }));
      dispatch(fetchSprints(projectId));
    };

    socket.on("project:changed", refresh);

    return () => {
      socket.off("project:changed", refresh);
      leaveProject(projectId);
    };
  }, [dispatch, projectId, filters]);
}