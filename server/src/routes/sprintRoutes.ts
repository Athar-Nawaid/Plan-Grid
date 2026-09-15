import { Router } from "express";
import {
  addIssuesToSprint,
  completeSprint,
  createSprint,
  deleteSprint,
  listSprints,
  removeIssueFromSprint,
  startSprint,
  updateSprint,
} from "../controllers/sprintController";

const router = Router({ mergeParams: true });

router.get("/", listSprints);
router.post("/", createSprint);

router.put("/:id", updateSprint);
router.delete("/:id", deleteSprint);
router.post("/:id/start", startSprint);
router.post("/:id/complete", completeSprint);
router.post("/:id/issues", addIssuesToSprint);
router.delete("/:id/issues/:issueId", removeIssueFromSprint);

export default router;