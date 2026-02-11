import express from "express";
import { db } from "../config/db.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * MY FUNDED PROJECTS
 */
router.get("/funded", authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        c.id,
        c.title,
        d.amount,
        d.created_at
      FROM donations d
      JOIN campaigns c ON d.campaign_id = c.id
      WHERE d.user_id = ?
      ORDER BY d.created_at DESC
    `, [req.user.id]);

    res.json(rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch funded projects" });
  }
});

/**
 * MY COMMENTS
 */
router.get("/comments", authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        comments.id,
        comments.comment,
        campaigns.title
      FROM comments
      JOIN campaigns ON comments.campaign_id = campaigns.id
      WHERE comments.user_id = ?
      ORDER BY comments.id DESC
    `, [req.user.id]);

    res.json(rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

/**
 * MY CAMPAIGNS CREATED
 */
router.get("/my-campaigns", authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT id, title, goal_amount, raised_amount
      FROM campaigns
      WHERE user_id = ?
    `, [req.user.id]);

    res.json(rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch campaigns" });
  }
});

/**
 * MY LIKED CAMPAIGNS
 */
router.get("/likes", authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        c.id,
        c.title,
        l.created_at
      FROM likes l
      JOIN campaigns c ON l.campaign_id = c.id
      WHERE l.user_id = ?
      ORDER BY l.created_at DESC
    `, [req.user.id]);

    res.json(rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to fetch liked campaigns"
    });
  }
});


export default router;
