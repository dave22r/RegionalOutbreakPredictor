import { db } from "../utils/firebase.js";

export const method = "all";
export const handler = async (req, res) => {
  try {
    if (req.method === "GET") {
      const snapshot = await db.collection("outbreaks").get();
      const outbreaks = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      return res.json(outbreaks);
    }

    if (req.method === "POST") {
      const { region, risk } = req.body;
      await db.collection("outbreaks").doc(region).set({ risk });
      return res.json({ success: true });
    }

    res.status(405).send("Method not allowed");
  } catch (err) {
    console.error("Error handling /api/outbreaks:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
