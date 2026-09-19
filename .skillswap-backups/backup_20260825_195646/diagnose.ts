import dotenv from 'dotenv';
dotenv.config();

async function runDiagnostic() {
  console.log("🔍 Running SkillSwap 5.0 API & Network Diagnostic...");
  console.log(`- GEMINI_API_KEY Present: ${!!process.env.GEMINI_API_KEY}`);

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

  try {
    console.log("🌐 Pinging Gemini 3.6 Flash API endpoint...");
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Hello, run a system status check." }] }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`❌ API Error [${response.status}]:`, errText);
      return;
    }

    const data = await response.json();
    console.log("✅ Successfully connected to Gemini 3.6 Flash!");
    console.log("🤖 Response sample:", data.candidates?.[0]?.content?.parts?.[0]?.text);
  } catch (error: any) {
    console.error("❌ Network Connection Failed:", error.message);
    if (error.cause) console.error("Cause:", error.cause);
  }
}

runDiagnostic();
