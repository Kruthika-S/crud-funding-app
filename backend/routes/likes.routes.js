import express from "express";
import { db } from "../config/db.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

/* LIKE CAMPAIGN */
router.post("/:campaignId", authMiddleware, async (req, res) => {
  try {
    const { campaignId } = req.params;

    await db.execute(
      "INSERT IGNORE INTO likes (user_id, campaign_id) VALUES (?, ?)",
      [req.user.id, campaignId]
    );

    res.json({ message: "Campaign liked" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Like failed" });
  }
});

/* UNLIKE */
router.delete("/:campaignId", authMiddleware, async (req, res) => {
  try {
    const { campaignId } = req.params;

    await db.execute(
      "DELETE FROM likes WHERE user_id=? AND campaign_id=?",
      [req.user.id, campaignId]
    );

    res.json({ message: "Like removed" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Unlike failed" });
  }
});

/* GET LIKES COUNT */
router.get("/count/:campaignId", async (req, res) => {
  try {
    const { campaignId } = req.params;

    const [[row]] = await db.execute(
      "SELECT COUNT(*) AS totalLikes FROM likes WHERE campaign_id=?",
      [campaignId]
    );

    res.json(row);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed" });
  }
});

export default router;
