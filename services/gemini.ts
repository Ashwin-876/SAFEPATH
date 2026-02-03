
const GOOGLE_API_KEY = 'AIzaSyC0M41sBzeyaBaRk_y_FWnbKclqwXLBHa4';
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

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
    const response = await fetch(`${BASE_URL}?key=${GOOGLE_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: `Act as a high-precision spatial assistant for a visually impaired person. 
              Detect ALL visible objects that might affect navigation.
              Return ONLY a valid JSON object with this structure:
              {
                "objects": [
                  { "label": "string", "direction": "left|center|right", "proximity": "near|far", "severity": "low|medium|high", "distance": "string" }
                ],
                "sceneSummary": "short summary phrase"
              }`
            },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: base64Image
              }
            }
          ]
        }],
        generationConfig: {
          response_mime_type: "application/json"
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google API Error:", response.status, errorText);
      return null; // Handle 429 or other errors gracefully
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) return null;

    // Clean potential markdown blocks just in case
    const cleanContent = content.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleanContent) as DetailedAnalysis;

  } catch (error) {
    console.error("Analysis Request Failed:", error);
    return null;
  }
};

export const askGeminiAboutImage = async (base64Image: string, question: string) => {
  try {
    const response = await fetch(`${BASE_URL}?key=${GOOGLE_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: `You are a assistant for a visually impaired person. Answer: "${question}". MAX 10 WORDS.` },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: base64Image
              }
            }
          ]
        }]
      })
    });

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return content || "I couldn't identify that.";
  } catch (error) {
    console.error("Gemini Q&A Error:", error);
    return "I couldn't identify that.";
  }
};

export const generateSmartRoute = async (destination: string, preferences: any) => {
  // Route generation doesn't use images, so keep simpler
  try {
    const fixedPrompt = `Generate 3 route options to ${destination}. Return JSON: { "routes": [{ "id": "string", "type": "SafePath|Fastest|Alternative", "duration": "string", "distance": "string", "accessibilityScore": number, "desc": "string" }] }`;

    const response = await fetch(`${BASE_URL}?key=${GOOGLE_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: fixedPrompt }]
        }],
        generationConfig: {
          response_mime_type: "application/json"
        }
      })
    });

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = content ? JSON.parse(content.replace(/```json\n?|\n?```/g, "").trim()) : {};

    if (parsed.routes && parsed.routes.length > 0) {
      return parsed.routes;
    }
    throw new Error("No routes");
  } catch (error) {
    console.error("Route generation failed:", error);
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

export const describeSurroundings = async (base64Image: string) => {
  try {
    const response = await fetch(`${BASE_URL}?key=${GOOGLE_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "Describe the environment layout briefly for a visually impaired person. Focus on floor paths." },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: base64Image
              }
            }
          ]
        }]
      })
    });

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return content || "Scanning failed.";
  } catch (error) {
    return "Scanning failed.";
  }
}

