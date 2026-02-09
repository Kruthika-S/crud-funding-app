import express from "express";
import { db } from "../config/db.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import redis from "../config/redis.js";

const router = express.Router();

/**
 * CREATE CAMPAIGN
 */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, description, goal_amount } = req.body;

    if (!title || !goal_amount) {
      return res.status(400).json({
        error: "Title and goal amount required",
      });
    }

    await db.execute(
      `INSERT INTO campaigns 
       (user_id, title, description, goal_amount)
       VALUES (?, ?, ?, ?)`,
      [req.user.id, title, description, goal_amount]
    );

    // ✅ Clear cache after new campaign
    await redis.del("campaigns:all");

    res.json({
      status: "success",
      message: "Campaign created successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Campaign creation failed",
    });
  }
});

/**
 * GET ALL CAMPAIGNS (WITH REDIS CACHE)
 */
router.get("/", async (req, res) => {
  try {
    const cacheKey = "campaigns:all";

    // Check Redis cache first
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      console.log("Serving from Redis cache");
      return res.json(JSON.parse(cachedData));
    }

    // Fetch from DB
    const [rows] = await db.execute(`
      SELECT 
        campaigns.*, 
        users.email,
        users.name
      FROM campaigns
      JOIN users ON campaigns.user_id = users.id
      ORDER BY campaigns.created_at DESC
    `);

    // Store in Redis for 60 seconds
    await redis.setex(cacheKey, 60, JSON.stringify(rows));

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to fetch campaigns",
    });
  }
});

/**
 * UPDATE CAMPAIGN
 */
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { title, description, goal_amount } = req.body;
    const campaignId = req.params.id;

    const [rows] = await db.execute(
      "SELECT user_id FROM campaigns WHERE id = ?",
      [campaignId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    if (rows[0].user_id !== req.user.id) {
      return res.status(403).json({
        error: "Unauthorized to update this campaign",
      });
    }

    await db.execute(
      `UPDATE campaigns 
       SET title=?, description=?, goal_amount=? 
       WHERE id=?`,
      [title, description, goal_amount, campaignId]
    );

    // ✅ Clear cache after update
    await redis.del("campaigns:all");

    res.json({
      message: "Campaign updated successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Update failed",
    });
  }
});

/**
 * DELETE CAMPAIGN
 */
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const campaignId = req.params.id;

    const [rows] = await db.execute(
      "SELECT user_id FROM campaigns WHERE id = ?",
      [campaignId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    if (rows[0].user_id !== req.user.id) {
      return res.status(403).json({
        error: "Unauthorized to delete this campaign",
      });
    }

    await db.execute(
      "DELETE FROM campaigns WHERE id = ?",
      [campaignId]
    );

    // ✅ Clear cache after delete
    await redis.del("campaigns:all");

    res.json({
      message: "Campaign deleted successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Delete failed",
    });
  }
});

export default router;
