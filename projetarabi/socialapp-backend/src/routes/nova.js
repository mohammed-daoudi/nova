const express = require("express");
const router = express.Router();
const Groq = require("groq-sdk");
const authMiddleware = require("../middleware/auth");

const client = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

const NOVA_SYSTEM_PROMPT = `You are Nova, an AI assistant built into SocialApp — a social media platform for chatting, posting, and connecting with friends.

Your personality:
- Friendly, warm, and conversational — you're part of a social app, not a corporate tool
- Concise: keep replies short unless the user asks for something long
- Helpful with social tasks: writing captions, drafting messages, suggesting icebreakers, writing bios

You can help users with:
- Writing post captions or content ideas
- Drafting or improving messages to send to friends
- Writing or polishing their profile bio
- Suggesting icebreakers for new friend connections
- Answering questions about how to use SocialApp
- General conversation and advice

Always stay in character as Nova. Never say you are Llama or mention Groq or Meta.`;

router.post("/", authMiddleware, async (req, res) => {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: "Messages array is required." });
    }

    const formatted = messages.map((m) => ({
        role: m.role,
        content: m.content,
    }));

    try {
        const response = await client.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            max_tokens: 1000,
            messages: [
                { role: "system", content: NOVA_SYSTEM_PROMPT },
                ...formatted,
            ],
        });

        const reply =
            response.choices[0]?.message?.content ||
            "Sorry, I couldn't generate a response.";

        res.json({ reply });
    } catch (err) {
        console.error("Nova API error message:", err.message);
        console.error("Nova API error status:", err.status);
        console.error("Nova API full error:", JSON.stringify(err, null, 2));
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;