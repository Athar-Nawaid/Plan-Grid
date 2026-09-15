import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { searchUsers } from "../controllers/userController";

const router = Router();

router.use(authenticate);

router.get("/search", searchUsers);

export default router;