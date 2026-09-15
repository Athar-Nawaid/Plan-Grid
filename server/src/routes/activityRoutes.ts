import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { requireProjectAccess } from "../middleware/projectAccess";
import { getIssueActivity, getProjectActivity } from "../controllers/activityController";

const router = Router();

router.use(authenticate);

router.get("/projects/:projectId/activity", requireProjectAccess, getProjectActivity);
router.get("/issues/:issueId/activity", getIssueActivity);

export default router;