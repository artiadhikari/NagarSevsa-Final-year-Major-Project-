const axios = require("axios");
const { prompt: systemPrompt } = require("../../prompt");

function inferPriority(issueText = "", category = "") {
  const lower = issueText.toLowerCase();
  
  // Critical safety hazards: electrical sparks, exposed wires, fire, hospital blockages, cave-ins
  if (
    lower.includes("spark") ||
    lower.includes("shock") ||
    lower.includes("wire exposed") ||
    lower.includes("accident") ||
    lower.includes("hospital") ||
    lower.includes("manhole open") ||
    lower.includes("fire") ||
    lower.includes("death") ||
    lower.includes("danger")
  ) {
    return "P1_critical";
  }

  // Major community disruptions: pipeline burst, sewage overflow into houses, impassable roads
  if (
    lower.includes("burst") ||
    lower.includes("into homes") ||
    lower.includes("into house") ||
    lower.includes("flooding") ||
    lower.includes("water logging") ||
    lower.includes("murky") ||
    lower.includes("pothole")
  ) {
    return "P2_high";
  }

  // Street light and minor garbage can be normal priority
  if (category === "street_light" || category === "garbage") {
    return "P3_medium";
  }

  return "P3_medium";
}

async function extractComplaintData(text) {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      console.warn("⚠ OPENROUTER_API_KEY is not set. Using basic fallback heuristic extraction.");
      return {
        issue: text.slice(0, 120),
        category: "other",
        priority: inferPriority(text, "other"),
      };
    }

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text },
        ],
        temperature: 0.1,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    let raw = response.data?.choices?.[0]?.message?.content || "{}";
    raw = raw.replace(/```json/gi, "").replace(/```/g, "").trim();

    const parsed = JSON.parse(raw);

    // Normalize category
    const validCategories = ["street_light", "water_supply", "garbage", "drainage", "road"];
    let category = (parsed.category || "").toLowerCase().replace(/\s+/g, "_");
    if (!validCategories.includes(category)) {
      category = "other";
    }

    // Infer priority
    const priority = inferPriority(parsed.issue || text, category);

    return {
      name: parsed.name || "",
      address: parsed.address || "",
      area: parsed.area || "",
      landmark: parsed.landmark || "",
      issue: parsed.issue || text,
      category,
      ward: parsed.ward || "",
      zone: parsed.zone || "",
      priority,
    };
  } catch (err) {
    console.error("LLM Extraction Error:", err.response?.data || err.message);
    return {
      issue: text.slice(0, 120),
      category: "other",
      priority: inferPriority(text, "other"),
    };
  }
}

module.exports = {
  extractComplaintData,
  inferPriority,
};
