import express from "express";
import { getUserFiles, getUserInstructions } from "./knowledge-base";

const router = express.Router();

// GET /api/knowledge-base/files/:userId
router.get("/files/:userId", getUserFiles);

// GET /api/knowledge-base/instructions/:userId
router.get("/instructions/:userId", getUserInstructions);

export default router;
