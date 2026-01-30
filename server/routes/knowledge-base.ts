import { Request, Response } from "express";
import axios from "axios";

// Neon REST API endpoint - must be set in environment variables
const NEON_API_URL = process.env.NEON_API_URL;
const NEON_API_KEY = process.env.NEON_API_KEY;

/**
 * Get user's uploaded files from Neon database
 * GET /api/knowledge-base/files/:userId
 */
export const getUserFiles = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    if (!NEON_API_URL || !NEON_API_KEY) {
      console.error("NEON_API_URL or NEON_API_KEY is not configured");
      return res.status(500).json({ error: "Database configuration missing" });
    }

    // Query Neon database for files
    const response = await axios.post(
      `${NEON_API_URL}/sql`,
      {
        query: `
          SELECT DISTINCT file_name, file_url, created_at
          FROM user_vector_knowledge_base
          WHERE user_id = $1
            AND source = 'file_upload'
            AND file_name IS NOT NULL
            AND file_url IS NOT NULL
          ORDER BY created_at DESC
        `,
        params: [userId]
      },
      {
        headers: {
          Authorization: `Bearer ${NEON_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    // Deduplicate by file_url (remove chunks of same file)
    const files = response.data.rows || [];
    const uniqueFilesMap = new Map();

    files.forEach((file: any) => {
      if (!uniqueFilesMap.has(file.file_url)) {
        uniqueFilesMap.set(file.file_url, file);
      }
    });

    const uniqueFiles = Array.from(uniqueFilesMap.values());

    res.json({
      success: true,
      files: uniqueFiles
    });
  } catch (error: any) {
    console.error("Error fetching user files from Neon:", error.response?.data || error.message);
    res.status(500).json({
      error: "Failed to fetch files",
      details: error.response?.data || error.message
    });
  }
};

/**
 * Get user's custom instructions from Neon database
 * GET /api/knowledge-base/instructions/:userId
 */
export const getUserInstructions = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    if (!NEON_API_URL || !NEON_API_KEY) {
      console.error("NEON_API_URL or NEON_API_KEY is not configured");
      return res.status(500).json({ error: "Database configuration missing" });
    }

    // Query Neon database for custom instructions
    const response = await axios.post(
      `${NEON_API_URL}/sql`,
      {
        query: `
          SELECT document, created_at
          FROM user_vector_knowledge_base
          WHERE user_id = $1
            AND source = 'agent_settings'
            AND category = 'custom_instructions'
          ORDER BY created_at DESC
          LIMIT 10
        `,
        params: [userId]
      },
      {
        headers: {
          Authorization: `Bearer ${NEON_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const instructions = response.data.rows || [];

    // Combine all instruction chunks
    const combinedInstructions = instructions
      .map((item: any) => item.document)
      .join('\n\n');

    res.json({
      success: true,
      instructions: combinedInstructions
    });
  } catch (error: any) {
    console.error("Error fetching custom instructions from Neon:", error.response?.data || error.message);
    res.status(500).json({
      error: "Failed to fetch instructions",
      details: error.response?.data || error.message
    });
  }
};
