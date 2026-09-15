import { Router } from "express";
import {
  createComment,
  createIssue,
  deleteIssue,
  getIssue,
  listComments,
  listIssues,
  updateIssue,
  updateIssueStatus,
} from "../controllers/issueController";

const router = Router({ mergeParams: true });

router.get("/", listIssues);
router.post("/", createIssue);

router.get("/:id", getIssue);
router.put("/:id", updateIssue);
router.delete("/:id", deleteIssue);
router.put("/:id/status", updateIssueStatus);

router.get("/:id/comments", listComments);
router.post("/:id/comments", createComment);

export default router;