const express = require("express");
const cors = require("cors");
const fs = require("fs").promises;
const path = require("path");

const app = express();
const PORT = 3000;

const SCORES_FILE = path.join(__dirname, "scores.json");

app.use(cors());
app.use(express.json());

/** 🔥 QUAN TRỌNG: serve frontend */
app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

/** READ FILE */
async function readScoresFromFile() {
  try {
    const text = await fs.readFile(SCORES_FILE, "utf8");
    const data = JSON.parse(text);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    if (err.code === "ENOENT") return [];
    console.error("Read error:", err);
    return [];
  }
}

/** WRITE FILE */
async function writeScoresToFile(scores) {
  await fs.writeFile(SCORES_FILE, JSON.stringify(scores, null, 2), "utf8");
}

/** GET leaderboard */
app.get("/leaderboard", async (req, res) => {
  try {
    const scores = await readScoresFromFile();

    const sorted = scores
      .filter((s) => typeof s.score === "number")
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    res.json(sorted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error loading leaderboard" });
  }
});

/** POST score */
app.post("/score", async (req, res) => {
  try {
    const { score } = req.body;

    if (typeof score !== "number") {
      return res.status(400).json({ message: "Invalid score" });
    }

    const scores = await readScoresFromFile();

    const newRecord = {
      id: Date.now(), // ✅ tránh lỗi id
      score,
      timestamp: new Date().toISOString(),
    };

    scores.push(newRecord);
    await writeScoresToFile(scores);

    console.log("Saved score:", score); // 👈 debug

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error saving score" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running: http://localhost:${PORT}`);
});
