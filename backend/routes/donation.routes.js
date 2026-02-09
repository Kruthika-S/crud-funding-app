import express from "express";
import { db } from "../config/db.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import redis from "../config/redis.js";

const router = express.Router();

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { campaign_id, amount } = req.body;

    if (!campaign_id || !amount) {
      return res.status(400).json({
        error: "Campaign ID and amount required",
      });
    }

    // Check campaign exists
    const [campaign] = await db.execute(
      "SELECT id FROM campaigns WHERE id=?",
      [campaign_id]
    );

    if (!campaign.length) {
      return res.status(404).json({
        error: "Campaign not found",
      });
    }

    // Insert donation
    await db.execute(
      `INSERT INTO donations (user_id, campaign_id, amount)
       VALUES (?, ?, ?)`,
      [req.user.id, campaign_id, amount]
    );

    // Update raised amount
    await db.execute(
      `UPDATE campaigns
       SET raised_amount = raised_amount + ?
       WHERE id=?`,
      [amount, campaign_id]
    );

    // Clear campaigns cache
    await redis.del("campaigns:all");

    res.json({
      message: "Donation successful",
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Donation failed",
    });
  }
});

/**
 * GET USER DONATION HISTORY
 */
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        donations.*,
        campaigns.title
      FROM donations
      JOIN campaigns 
        ON donations.campaign_id = campaigns.id
      WHERE donations.user_id = ?
      ORDER BY donated_at DESC
    `, [req.user.id]);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to fetch donation history",
    });
  }
});

/**
 * GET DONATIONS FOR A CAMPAIGN
 */
router.get("/campaign/:id", async (req, res) => {
  try {
    const campaignId = req.params.id;

    const [rows] = await db.execute(`
      SELECT 
        donations.amount,
        donations.donated_at,
        users.email
      FROM donations
      JOIN users 
        ON donations.user_id = users.id
      WHERE campaign_id = ?
      ORDER BY donated_at DESC
    `, [campaignId]);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to fetch campaign donations",
    });
  }
});

/**
 * CAMPAIGN FUNDING STATS
 */
router.get("/stats/:id", async (req, res) => {
  try {
    const campaignId = req.params.id;

    const [stats] = await db.execute(`
      SELECT 
        COUNT(*) AS total_donations,
        SUM(amount) AS total_raised
      FROM donations
      WHERE campaign_id = ?
    `, [campaignId]);

    res.json(stats[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to fetch stats",
    });
  }
});



export default router;
