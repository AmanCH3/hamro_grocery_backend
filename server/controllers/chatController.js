import { GoogleGenerativeAI } from '@google/generative-ai';
import asyncHandler from '../utils/async_handler.js';
import { systemPrompt, generateDynamicContext } from '../service/knowledge_base.js';


console.log("Attempting to use Gemini Key:", process.env.GEMINI_API_KEY);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "AIzaSyCgl0brdTuYi7yQ8zKh3jl0UsgZZW7Q_QA");

export const handleChatQuery = asyncHandler(async (req, res) => {
    const { query, history = [] } = req.body;

    if (!query) {
        // In a real app, you'd have a proper ApiError class
        res.status(400).json({ success: false, message: "Query is required." });
        return;
    }
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // 1. Generate the dynamic part of the prompt with live data
    const dynamicContext = await generateDynamicContext();
    
    // 2. Combine the static system prompt with the live data
    const fullSystemPrompt = systemPrompt.replace(
        '[Insert LIVE DATA from generateDynamicContext here]',
        dynamicContext
    );

    // 3. Format the conversation history for the Gemini API
    const formattedHistory = history.map(item => ({
        role: item.role, // "user" or "model"
        parts: [{ text: item.text }],
    })).filter(Boolean);

    // 4. Initialize the chat session with the full context and history
    const chat = model.startChat({
        history: [
            { role: "user", parts: [{ text: fullSystemPrompt }] },
            { role: "model", parts: [{ text: "Got it! I'm GrocerBot, ready to help customers. Let's begin." }] },
            ...formattedHistory,
        ],
        generationConfig: {
            maxOutputTokens: 250, // Adjust as needed
        },
    });

    // 5. Send the new user query and get the result
    const result = await chat.sendMessage(query);
    const response = result.response;
    const text = response.text();

    // 6. Send the successful response back to the client
    res.status(200).json({
        success: true,
        message: "Chatbot responded successfully.",
        data: { reply: text }
    });
});



