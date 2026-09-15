import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { requireProjectAccess, requireRole } from "../middleware/projectAccess";
import {
  addMember,
  createProject,
  deleteProject,
  getProject,
  listMembers,
  listProjects,
  removeMember,
  updateProject,
} from "../controllers/projectController";
import initIssuesRoutes from "./issueRoutes";
import initSprintRoutes from "./sprintRoutes";

const router = Router();

router.use(authenticate);

router.get("/", listProjects);
router.post("/", createProject);

router.param("id", (req, _res, next) => {
  req.params.projectId = req.params.id;
  next();
});

router.get("/:id", requireProjectAccess, getProject);
router.put("/:id", requireProjectAccess, requireRole("ADMIN"), updateProject);
router.delete("/:id", requireProjectAccess, requireRole("ADMIN"), deleteProject);

router.get("/:id/members", requireProjectAccess, listMembers);
router.post("/:id/members", requireProjectAccess, requireRole("ADMIN"), addMember);
router.delete("/:id/members/:userId", requireProjectAccess, requireRole("ADMIN"), removeMember);

router.use("/:projectId/issues", requireProjectAccess, initIssuesRoutes);
router.use("/:projectId/sprints", requireProjectAccess, initSprintRoutes);

export default router;