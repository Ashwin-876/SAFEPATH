

const API_KEY = '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';
const BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'google/gemini-2.0-flash-001';

export interface DetailedAnalysis {
  objects: Array<{
    label: string;
    direction: 'left' | 'center' | 'right';
    proximity: 'near' | 'far';
    severity: 'low' | 'medium' | 'high';
    distance: string;
  }>;
  sceneSummary: string;
}

export const analyzeScene = async (base64Image: string): Promise<DetailedAnalysis | null> => {
  try {
    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://safepathtrack.netlify.app",
        "X-Title": "SafePath AI Tracking",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Act as a high-precision spatial assistant for a visually impaired person. 
                Detect ALL visible objects that might affect navigation.
                Return ONLY a valid JSON object:
                {
                  "objects": [
                    { "label": "string", "direction": "left|center|right", "proximity": "near|far", "severity": "low|medium|high", "distance": "string" }
                  ],
                  "sceneSummary": "short summary phrase"
                }`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("OpenRouter API Error:", response.status, response.statusText, errorData);
      return null;
    }

    const data = await response.json();
    console.log("SafePath API Response:", data); // DEBUG

    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error("SafePath Error: No content in response", data);
      return null;
    }

    console.log("SafePath Raw Content:", content); // DEBUG

    const cleanContent = content.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleanContent) as DetailedAnalysis;
  } catch (error) {
    console.error("Analysis Request Failed:", error);
    return null;
  }
};

export const askGeminiAboutImage = async (base64Image: string, question: string) => {
  try {
    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://safepathtrack.netlify.app",
        "X-Title": "SafePath AI Tracking",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `You are a assistant for a visually impaired person. Answer: "${question}". MAX 10 WORDS.`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ]
      })
    });
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "I couldn't identify that.";
  } catch (error) {
    console.error("Gemini Q&A Error:", error);
    return "I couldn't identify that.";
  }
};

export const generateCaregiverBriefing = async (userName: string, status: string, recentObjects: string[]) => {
  try {
    const prompt = `Generate a 2-sentence safety briefing for a caregiver monitoring ${userName}. Status: ${status}. Detected: ${recentObjects.join(', ')}.`;
    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }]
      })
    });
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "Monitoring active. Path currently safe.";
  } catch (error) {
    return "Monitoring active. Path currently safe.";
  }
};

export const describeSurroundings = async (base64Image: string) => {
  try {
    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Describe the environment layout briefly for a visually impaired person. Focus on floor paths."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ]
      })
    });
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "Scanning failed.";
  } catch (error) {
    return "Scanning failed.";
  }
};

export const generateSmartRoute = async (destination: string, preferences: any) => {
  try {
    const fixedPrompt = `Generate 3 route options to ${destination}. Return JSON: { "routes": [{ "id": "string", "type": "SafePath|Fastest|Alternative", "duration": "string", "distance": "string", "accessibilityScore": number, "desc": "string" }] }`;

    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: fixedPrompt }],
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    const parsed = content ? JSON.parse(content.replace(/```json\n?|\n?```/g, "").trim()) : {};

    if (parsed.routes && parsed.routes.length > 0) {
      return parsed.routes;
    }

    throw new Error("No routes in response");
  } catch (error) {
    console.error("Route generation failed, using fallback:", error);
    return [
      {
        id: "rp-1",
        type: "SafePath",
        duration: "6 min",
        distance: "420m",
        accessibilityScore: 95,
        desc: "Main corridor with tactile paving."
      }
    ];
  }
}

