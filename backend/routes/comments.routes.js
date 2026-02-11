import express from "express";
import { db } from "../config/db.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

/* ADD COMMENT */
router.post("/:campaignId", authMiddleware, async (req, res) => {
  try {
    const { comment } = req.body;
    const { campaignId } = req.params;

    await db.execute(
      "INSERT INTO comments (user_id, campaign_id, comment) VALUES (?, ?, ?)",
      [req.user.id, campaignId, comment]
    );

    res.json({ message: "Comment added" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Comment failed" });
  }
});

/* GET COMMENTS */
router.get("/:campaignId", async (req, res) => {
  try {
    const { campaignId } = req.params;

    const [rows] = await db.execute(`
      SELECT c.comment, c.created_at, u.name
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE campaign_id=?
      ORDER BY created_at DESC
    `, [campaignId]);

    res.json(rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Fetch failed" });
  }
});

/* DELETE COMMENT */
router.delete("/:commentId", authMiddleware, async (req, res) => {
  try {
    const { commentId } = req.params;

    // Check ownership
    const [[comment]] = await db.execute(
      "SELECT user_id FROM comments WHERE id=?",
      [commentId]
    );

    if (!comment)
      return res.status(404).json({ error: "Comment not found" });

    if (comment.user_id !== req.user.id)
      return res.status(403).json({ error: "Not allowed" });

    await db.execute("DELETE FROM comments WHERE id=?", [commentId]);

    res.json({ message: "Comment deleted" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Delete failed" });
  }
});

/* EDIT COMMENT */
router.put("/:commentId", authMiddleware, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { comment } = req.body;

    const [[existing]] = await db.execute(
      "SELECT user_id FROM comments WHERE id=?",
      [commentId]
    );

    if (!existing)
      return res.status(404).json({ error: "Comment not found" });

    if (existing.user_id !== req.user.id)
      return res.status(403).json({ error: "Not allowed" });

    await db.execute(
      "UPDATE comments SET comment=? WHERE id=?",
      [comment, commentId]
    );

    res.json({ message: "Comment updated" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Update failed" });
  }
});



export default router;
