import dotenv from 'dotenv';
dotenv.config();

async function analyzeProjectWithGemini() {
  console.log("🔍 Preparing SkillSwap 5.0 architectural overview...");

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("❌ GEMINI_API_KEY is missing in your .env file.");
    return;
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;

  const prompt = `You are an expert full-stack developer reviewing 'SkillSwap 5.0' (React 19, TypeScript, Vite, Tailwind CSS, Node/Express, Firebase, Stripe, and Gemini AI). 
The project features a peer-to-peer talent marketplace, escrow payments, AI match scoring, and learning roadmaps. 
Provide 3 concise, high-impact technical recommendations for production readiness:
1. Handling network resilience / offline states in mobile environments like Termux.
2. Securing Firebase escrow state transitions.
3. Optimizing AI token usage for skill roadmaps.`;

  try {
    console.log("🤖 Requesting architectural recommendations from Gemini 3.6 Flash...");
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`❌ API Error [${response.status}]:`, errText);
      return;
    }

    const data = await response.json();
    const recommendation = data.candidates?.[0]?.content?.parts?.[0]?.text;

    console.log("\n==============================================");
    console.log("💡 GEMINI 3.6 FLASH ARCHITECTURAL BLUEPRINT:");
    console.log("==============================================\n");
    console.log(recommendation);
  } catch (error: any) {
    console.error("❌ Analysis Failed:", error.message);
  }
}

analyzeProjectWithGemini();
