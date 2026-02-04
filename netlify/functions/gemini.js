
const fetch = require('node-fetch');

exports.handler = async function (event, context) {
    // Only allow POST
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const apiKey = process.env.OPENROUTER_API_KEY;

        if (!apiKey) {
            console.error("Missing OPENROUTER_API_KEY");
            return { statusCode: 500, body: JSON.stringify({ error: "Server Configuration Error" }) };
        }

        const requestBody = JSON.parse(event.body);

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://safepathtrack.netlify.app",
                "X-Title": "SafePath AI Tracking",
            },
            body: JSON.stringify(requestBody),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("OpenRouter Upstream Error:", response.status, await response.clone().text());
            return {
                statusCode: response.status,
                body: JSON.stringify(data)
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify(data),
        };
    } catch (error) {
        console.error("Netlify Function Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal Server Error" }),
        };
    }
};
