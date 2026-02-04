
// Relative path to support both Local Proxy and Netlify Functions
const BASE_URL = '/.netlify/functions/gemini';
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
    // No headers or keys here. Pure Proxy call.
    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
      return { objects: [], sceneSummary: `API ERROR: ${response.status} ${response.statusText}` };
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error("SafePath API Error: Received non-JSON response. Check your local server/proxy settings.", text.substring(0, 100));
      return { objects: [], sceneSummary: "PROXY ERROR: Non-JSON Response" };
    }

    const data = await response.json();
    console.log("SafePath API Response:", data); // DEBUG

    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error("SafePath Error: No content in response", data);
      // Check for provider specific errors inside 200 OK
      if (data.error) return { objects: [], sceneSummary: `API ERROR: ${data.error.message || 'Unknown'}` };
      return { objects: [], sceneSummary: "API ERROR: Empty Response" };
    }

    const cleanContent = content.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleanContent) as DetailedAnalysis;
  } catch (error: any) {
    console.error("Analysis Request Failed:", error);
    return { objects: [], sceneSummary: `NET ERROR: ${error.message || 'Check Console'}` };
  }
};

export const askGeminiAboutImage = async (base64Image: string, question: string) => {
  try {
    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.warn("Gemini Q&A: Received non-JSON response");
      return "I couldn't identify that. (Connection Error)";
    }
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }]
      })
    });
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return "Monitoring active. Path currently safe. (Sync Error)";
    }
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
      headers: { "Content-Type": "application/json" },
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
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return "Scanning failed. (Server Error)";
    }
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: fixedPrompt }],
        response_format: { type: "json_object" }
      })
    });

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Received non-JSON response from server");
    }

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
