import express from "express";
import { db } from "../config/db.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { sendMail } from "../utils/sendMail.js";

const router = express.Router();

/**
 * FAKE PAYMENT API
 */
router.post("/pay", authMiddleware, async (req, res) => {
  try {
    const { campaign_id, amount } = req.body;

    if (!campaign_id || !amount) {
      return res.status(400).json({
        error: "Campaign ID and amount required",
      });
    }

    // Generate fake transaction ID
    const transactionId =
      "TXN_" + Date.now() + "_" + Math.floor(Math.random() * 10000);

    // Insert donation
    await db.execute(
      `INSERT INTO donations 
       (user_id, campaign_id, amount, transaction_id)
       VALUES (?, ?, ?, ?)`,
      [req.user.id, campaign_id, amount, transactionId]
    );

    // Update campaign raised amount
    await db.execute(
      `UPDATE campaigns 
       SET raised_amount = raised_amount + ? 
       WHERE id = ?`,
      [amount, campaign_id]
    );

    // Get donor email
    const [[donor]] = await db.execute(
      "SELECT email FROM users WHERE id=?",
      [req.user.id]
    );

    // Get campaign owner email
    const [[owner]] = await db.execute(
      `SELECT users.email
       FROM campaigns
       JOIN users ON campaigns.user_id = users.id
       WHERE campaigns.id=?`,
      [campaign_id]
    );

    // Send email to donor
    await sendMail(
      donor.email,
      "Payment Successful 🎉",
      `You have successfully funded ₹${amount}.
Transaction ID: ${transactionId}`
    );

    // Send email to campaign owner
    await sendMail(
      owner.email,
      "New Funding Received 💰",
      `Your campaign received ₹${amount}.
Transaction ID: ${transactionId}`
    );

    res.json({
      success: true,
      message: "Payment successful",
      transaction_id: transactionId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Payment failed",
    });
  }
});

/**
 * GET USER PAYMENT HISTORY
 */
router.get("/history", authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        d.transaction_id,
        d.amount,
        d.created_at,
        c.title AS campaign_title
      FROM donations d
      JOIN campaigns c ON d.campaign_id = c.id
      WHERE d.user_id = ?
      ORDER BY d.created_at DESC
    `, [req.user.id]);

    res.json(rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to fetch payment history"
    });
  }
});


/**
 * CAMPAIGN FUNDING STATS
 */
router.get("/stats/:campaignId", async (req, res) => {
  try {
    const { campaignId } = req.params;

    const [rows] = await db.execute(`
      SELECT 
        COUNT(*) AS donors,
        SUM(amount) AS total_funds
      FROM donations
      WHERE campaign_id = ?
    `, [campaignId]);

    res.json(rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to fetch stats"
    });
  }
});





export default router;
