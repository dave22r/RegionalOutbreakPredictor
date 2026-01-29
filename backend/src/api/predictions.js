import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load predictions from ML-generated file
const predictionsPath = path.join(__dirname, "../../../ml/data/processed/predictions.json");
let predictionsData = [];

try {
    const data = fs.readFileSync(predictionsPath, "utf8");
    predictionsData = JSON.parse(data);
    console.log(`✅ Loaded ${predictionsData.length} predictions`);
} catch (err) {
    console.error("⚠️  Could not load predictions:", err.message);
}

export const GET = async (req, res) => {
    try {
        const { disease } = req.query;

        let filtered = predictionsData;

        // Filter by disease if specified
        if (disease && disease !== "all") {
            filtered = predictionsData.filter(
                (p) => p.disease.toLowerCase() === disease.toLowerCase()
            );
        }

        // Transform to format expected by frontend (array of [lng, lat])
        const coordinates = filtered.map((p) => [p.lng, p.lat]);

        return res.json({
            success: true,
            count: coordinates.length,
            disease: disease || "all",
            coordinates,
            metadata: {
                diseases: [...new Set(predictionsData.map((p) => p.disease))],
                regions: [...new Set(predictionsData.map((p) => p.region))],
                avgRisk: filtered.length > 0
                    ? (filtered.reduce((sum, p) => sum + p.risk, 0) / filtered.length).toFixed(3)
                    : 0,
            },
        });
    } catch (err) {
        console.error("Error handling /api/predictions:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};
