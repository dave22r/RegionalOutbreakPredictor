import { db } from "../utils/firebase.js";

export const method = "POST";

export const handler = async (req, res) => {
  try {
    const body = req.body;

    // Validate the input first (the min.)
    if (!body || typeof body !== "object")
      return res.status(400).json({ error: "Invalid body" });

    // save symptom report
    const ref = await db.collection("symptoms").add({
      ...body,
      timestamp: Date.now(),
    });

    res.json({ success: true, id: ref.id });
  } catch (err) {
    console.error("Error saving symptoms:", err);
    res.status(500).json({ error: "Failed to save symptoms" });
  }
};
