const express = require("express");
const router = express.Router();
const PracticeScore = require("../models/PracticeScore");
const { authenticate } = require("../middleware/auth");

// [POST] 새 PracticeScore 생성
router.post("/", authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const practiceScore = new PracticeScore({ ...req.body, user_id: userId });
    await practiceScore.save();
    res.status(201).json(practiceScore);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// [GET] 전체 PracticeScore 리스트
router.get("/", async (req, res) => {
  try {
    const scores = await PracticeScore.find();
    res.json(scores);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const score = await PracticeScore.findById(req.params.id);
    if (!score) return res.status(404).json({ error: "Not found" });
    res.json(score);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
