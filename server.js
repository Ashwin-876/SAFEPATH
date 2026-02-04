
import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import cors from 'cors';

// Load environment variables
dotenv.config({ path: '.env.local' });

const app = express();
const PORT = 3001;

app.use(cors()); // Allow all for local dev
app.use(express.json({ limit: '50mb' }));

app.post("/.netlify/functions/gemini", async (req, res) => {
    try {
        // SECURE: Server-side environment variable
        const apiKey = process.env.OPENROUTER_API_KEY;

        if (!apiKey) {
            console.error("Missing OPENROUTER_API_KEY in .env.local");
            return res.status(500).json({ error: "Missing API Configuration" });
        }

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "SafePath Local Dev"
            },
            body: JSON.stringify(req.body)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("OpenRouter API Error:", JSON.stringify(data));
        }

        res.status(response.status).json(data);

    } catch (error) {
        console.error("Local Proxy Error:", error);
        res.status(500).json({ error: "Internal Proxy Error: " + error.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Local Secure Proxy running on http://0.0.0.0:${PORT}`);
});
