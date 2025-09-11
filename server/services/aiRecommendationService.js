let OpenAIClass;
try {
  // Attempt LangChain import (preferred)
  ({ OpenAI: OpenAIClass } = require("@langchain/openai"));
} catch (e) {
  try {
    ({ OpenAI: OpenAIClass } = require("langchain/llms/openai"));
  } catch (e2) {
    OpenAIClass = null; // Will fallback to heuristic
  }
}

/**
 * Generates an AI-based warehouse placement recommendation string.
 * Falls back to heuristic text if OPENAI_API_KEY is not set or request fails.
 * @param {object} analysis - The area analysis object assembled in routes.
 * @returns {Promise<string>} Recommendation text
 */
async function getRecommendation(analysis) {
  try {
    if (!process.env.OPENAI_API_KEY || !OpenAIClass) {
      return heuristicRecommendation(analysis);
    }

    const model = new OpenAIClass({
      temperature: 0.2,
      modelName: "gpt-3.5-turbo",
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `You are an expert supply-chain analyst. Based on the following JSON analysis of a city, provide a concise (max 80 words) recommendation on whether Blinkit should open a warehouse there and why. Always start with \"Recommendation:\" then a short justification.\n\nAnalysis:\n${JSON.stringify(
      analysis,
      null,
      2
    )}`;

    const response = await model.call(prompt);
    return response.trim();
  } catch (error) {
    console.error("AI recommendation failed, falling back:", error.message);
    return heuristicRecommendation(analysis);
  }
}

function heuristicRecommendation(analysis) {
  const score = analysis.warehouseRecommendation?.score || 0;
  if (score >= 80) return "Recommendation: Excellent – high-priority warehouse location.";
  if (score >= 60) return "Recommendation: Good – consider placing a warehouse.";
  if (score >= 40) return "Recommendation: Moderate – monitor and reassess soon.";
  return "Recommendation: Low priority – not recommended currently.";
}

module.exports = { getRecommendation };
