import { db } from "../utils/firebase.js";

export const GET = async (req, res) => {
  try {
    const snapshot = await db.collection("outbreaks").get();
    const outbreaks = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return res.json(outbreaks);
  } catch (err) {
    console.error("Error handling /api/outbreaks:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const POST = async (req, res) => {
  try {
    const { region, risk } = req.body;
    await db.collection("outbreaks").doc(region).set({ risk });
    return res.json({ success: true });
  } catch (err) {
    console.error("Error handling /api/outbreaks:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
