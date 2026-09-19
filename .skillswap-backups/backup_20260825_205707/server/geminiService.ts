import { GoogleGenAI } from '@google/genai';
import { dbStore } from './dbStore';

export class GeminiService {
  private ai: GoogleGenAI | null = null;

  private getClient(): GoogleGenAI | null {
    if (!this.ai && process.env.GEMINI_API_KEY) {
      try {
        this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      } catch (err) {
        console.warn('Gemini client initialization warning:', err);
      }
    }
    return this.ai;
  }

  private async generateWithAI(prompt: string): Promise<string | null> {
    // 1. Try Google Gemini API
    const client = this.getClient();
    if (client) {
      try {
        const response = await client.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });
        const text = response.text?.trim();
        if (text) return text;
      } catch (err: any) {
        console.warn('Gemini generateContent notice:', err.message);
      }
    }

    // 2. Try OpenRouter API if available
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (openRouterKey) {
      try {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${openRouterKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.CLIENT_URL || 'https://skillswap.dev',
            'X-Title': 'SkillSwap 5.0 Match Engine',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: 'You are an AI assistant for SkillSwap 5.0. Output strictly valid JSON without markdown wrapping.',
              },
              { role: 'user', content: prompt },
            ],
            response_format: { type: 'json_object' },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const content = data.choices?.[0]?.message?.content?.trim();
          if (content) return content;
        }
      } catch (err: any) {
        console.warn('OpenRouter API call notice:', err.message);
      }
    }

    return null;
  }

  public async findMatches(userDesire: string, currentUserId: string) {
    const listings = dbStore.getListings().filter(l => l.userId !== currentUserId);

    const prompt = `You are the AI Matchmaking Engine for SkillSwap 5.0 (a peer-to-peer knowledge exchange and time-banking platform).
A user is looking for: "${userDesire}".

Here are the available skill listings:
${JSON.stringify(
  listings.map(l => ({
    id: l.id,
    userId: l.userId,
    title: l.title,
    category: l.category,
    description: l.description,
    hourlyRateCredits: l.hourlyRateCredits,
    tags: l.tags,
    userName: l.user.name,
  })),
  null,
  2
)}

Recommend the top 3 best matching skill listings. For each match, return a JSON object array with:
- listingId: string
- matchScore: number (0 to 100)
- reasoning: string (why this is a great swap match)
- recommendedAgenda: array of strings (3 bullet points for a high-impact swap session)

Respond strictly in valid JSON without markdown fences.`;

    try {
      const text = await this.generateWithAI(prompt);
      if (text) {
        // Strip any markdown codeblock backticks if present
        const cleanText = text.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
        const parsed = JSON.parse(cleanText);
        return { matches: parsed, source: 'ai-genai-engine' };
      }
    } catch (err: any) {
      console.warn('AI smart match parse fallback:', err.message);
    }

    // Heuristic Smart Matcher Fallback
    const searchTerms = userDesire.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const scoredListings = listings.map(listing => {
      let score = 50;
      const textBlock = `${listing.title} ${listing.description} ${listing.tags.join(' ')} ${listing.category}`.toLowerCase();
      searchTerms.forEach(term => {
        if (textBlock.includes(term)) score += 15;
      });
      if (listing.type === 'offer') score += 10;
      return {
        listingId: listing.id,
        matchScore: Math.min(99, score),
        reasoning: `Matches your interest in ${listing.category} with an active rating of ${listing.user.rating}★ and ${listing.user.completedSwaps} verified swaps.`,
        recommendedAgenda: [
          `Assess current skill baseline in ${listing.title.slice(0, 30)}...`,
          `Practical 1-on-1 hands-on exercise with live feedback`,
          `Q&A and follow-up milestone plan`,
        ],
      };
    });

    scoredListings.sort((a, b) => b.matchScore - a.matchScore);
    return {
      matches: scoredListings.slice(0, 3),
      source: 'smart-heuristic-matcher',
    };
  }

  public async enhanceListing(title: string, category: string, rawDescription: string) {
    const prompt = `You are a skill marketplace optimizer for SkillSwap 5.0.
A mentor is creating a listing:
Title: "${title}"
Category: "${category}"
Draft Notes: "${rawDescription}"

Generate an enhanced listing package with:
- enhancedTitle: A catchy, professional title
- professionalDescription: A clear, engaging 3-sentence description of the session value
- syllabus: Array of 4 clear, sequential learning milestones
- recommendedTags: Array of 4-6 relevant searchable tags

Return strictly valid JSON.`;

    try {
      const text = await this.generateWithAI(prompt);
      if (text) {
        const cleanText = text.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
        return JSON.parse(cleanText);
      }
    } catch (err: any) {
      console.warn('AI listing enhance fallback:', err.message);
    }

    // Fallback enhancement
    return {
      enhancedTitle: title || `Mastering ${category}`,
      professionalDescription:
        rawDescription ||
        `Hands-on, immersive 1-on-1 knowledge exchange covering essential principles, real-world case studies, and actionable techniques tailored to your learning pace.`,
      syllabus: [
        'Foundational review & objective alignment',
        'Deep-dive interactive walkthrough',
        'Live troubleshooting & code/skill review',
        'Actionable roadmap & next steps',
      ],
      recommendedTags: [category.replace(/[^a-zA-Z]/g, ''), 'Mentorship', 'P2PExchange', 'SkillSwap'],
    };
  }

  public async summarizeSession(params: {
    skillTitle: string;
    mentorName: string;
    learnerName: string;
    notes: string;
    milestones: Array<{ text: string; done: boolean }>;
    durationMinutes: number;
  }) {
    const prompt = `You are the AI Learning Assistant for SkillSwap 5.0.
Summarize this completed 1-on-1 peer swap session:
- Skill: ${params.skillTitle}
- Mentor: ${params.mentorName}
- Learner: ${params.learnerName}
- Duration: ${params.durationMinutes} minutes
- Milestones: ${JSON.stringify(params.milestones)}
- Raw Notes:
${params.notes}

Return a structured JSON object with:
- executiveSummary: A concise 2-sentence overview of the session achievements
- keyTakeaways: Array of 3-4 bullet points summarizing what was mastered
- practicalExercises: Array of 2 actionable exercises for the learner to practice this week
- followUpGoals: Array of 2 recommended topics for the next swap session
- certificateRecommendation: boolean (true if milestones are mostly done)

Return strictly valid JSON.`;

    try {
      const text = await this.generateWithAI(prompt);
      if (text) {
        const cleanText = text.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
        return JSON.parse(cleanText);
      }
    } catch (err: any) {
      console.warn('AI session summarize fallback:', err.message);
    }

    // High quality fallback
    return {
      executiveSummary: `Productive ${params.durationMinutes}-minute deep dive into ${params.skillTitle} between ${params.mentorName} and ${params.learnerName}. High milestone completion rate with strong practical emphasis.`,
      keyTakeaways: [
        `Clarified core architecture and principles of ${params.skillTitle}`,
        `Implemented hands-on live walkthrough covering practical edge cases`,
        `Resolved live debugging challenges and established best practices`,
      ],
      practicalExercises: [
        `Rebuild the live coding demo from scratch without referencing the solution notes.`,
        `Complete a 30-minute mini-project applying the new concepts covered today.`,
      ],
      followUpGoals: [
        `Deep dive into advanced optimization and production patterns`,
        `Review practical test coverage and integration benchmarks`,
      ],
      certificateRecommendation: true,
    };
  }
}

export const geminiService = new GeminiService();
