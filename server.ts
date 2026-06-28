/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialize Gemini client
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    throw new Error("GEMINI_API_KEY environment variable is required but missing. Please configure it in Settings > Secrets.");
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// 1. API: Analyze Task & Prioritize
app.post("/api/analyze-task", async (req, res) => {
  const { title, description, deadline, focusPreference } = req.body;

  if (!title) {
    res.status(400).json({ error: "Task title is required" });
    return;
  }

  try {
    const ai = getGeminiClient();
    const prompt = `
      Task Title: "${title}"
      Task Description: "${description || "None provided"}"
      Deadline Context: "${deadline || "ASAP / None specific"}"
      User's Focus Style: "${focusPreference || "balanced"}" (Options: structured-blocks, baby-steps, panic-sprints)

      Break down this task structurally into 3 to 6 micro-steps.
      Provide a procrastination-buster tailored to defeating cognitive friction (e.g. Present Bias, Planning Fallacy, Task Paralysis).
      Assign a realistic Panic Index from 0 to 100 based on the deadline complexity, and justify it.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: `You are the master engine of 'Calm Velocity' productivity coach. 
Your target is to convert vague, overwhelming tasks into ultra-low-friction micro-actions. 
You must avoid jargon, be direct, encouraging, and highly execution-focused.
Breakdowns MUST feel immediately doable (typically 10-45 minutes per step).`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            priority: {
              type: Type.STRING,
              description: "The calculated urgency category: 'extreme_panic', 'high', 'medium', or 'low'",
            },
            panicIndex: {
              type: Type.INTEGER,
              description: "Stress gauge from 0 (calm) to 100 (complete critical emergency)",
            },
            percentageJustification: {
              type: Type.STRING,
              description: "Brief 1-sentence analytical reason for this stress index.",
            },
            firstStepAccelerator: {
              type: Type.STRING,
              description: "A <2-minute start action designed to build initial momentum (e.g., 'Open the file and name it...').",
            },
            procrastinationBuster: {
              type: Type.STRING,
              description: "Empathetic advice on how to start this specific task immediately to defeat procrastination.",
            },
            estimatedTotalHours: {
              type: Type.NUMBER,
              description: "Total estimated duration of all steps added up, in hours.",
            },
            breakdown: {
              type: Type.ARRAY,
              description: "Array of specific sequential micro-steps. Maximum 6 items.",
              items: {
                type: Type.OBJECT,
                properties: {
                  step: {
                    type: Type.STRING,
                    description: "Explicit execution instruction step (e.g. 'Outline slide titles')",
                  },
                  durationMinutes: {
                    type: Type.INTEGER,
                    description: "Realistic time required in minutes (10 to 60)",
                  },
                  difficulty: {
                    type: Type.STRING,
                    description: "Difficulty category: 'easy', 'medium', 'hard'",
                  },
                  tip: {
                    type: Type.STRING,
                    description: "High-level tip on how to do this fast or cheat sheets to use.",
                  },
                },
                required: ["step", "durationMinutes", "difficulty", "tip"],
              },
            },
          },
          required: [
            "priority",
            "panicIndex",
            "percentageJustification",
            "firstStepAccelerator",
            "procrastinationBuster",
            "estimatedTotalHours",
            "breakdown",
          ],
        },
      },
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json(parsedData);
  } catch (err: any) {
    console.error("Gemini Analyze Task error:", err);
    // If the key is missing or there's an API error, use a graceful, highly premium simulated response
    // so the app remains fully interactive for the user!
    const keyMissing = !process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY";
    
    // Generates static fallback breakdown
    res.json({
      priority: "high",
      panicIndex: 75,
      isDemoFallback: true,
      requiresKey: keyMissing,
      percentageJustification: "This is a local structured plan. Connect your Gemini API Key in 'Secrets' for fully custom dynamic real-time AI prioritizations.",
      firstStepAccelerator: `Open a scratchpad and write 3 words related to "${title}".`,
      procrastinationBuster: "Overcome task inertia with the '5-Minute Momentum' Rule. Agree to work on it for just five minutes. If you want to stop then, you can.",
      estimatedTotalHours: 2.5,
      breakdown: [
        {
          step: "Clear Workspace & Set up Environment",
          durationMinutes: 15,
          difficulty: "easy",
          tip: "Put your phone in another room or turn on Do Not Disturb mode. Grab some water."
        },
        {
          step: "Create the Basic Outline or Document Structure",
          durationMinutes: 30,
          difficulty: "medium",
          tip: "Do not try to make it perfect now. Just write out headers, placeholders, and raw ideas."
        },
        {
          step: "Gather Main Resources or Core Inputs",
          durationMinutes: 45,
          difficulty: "medium",
          tip: "Collect links, citations, or data. Cap this step with a strict timer to avoid rabbit holes."
        },
        {
          step: "First Draft Execution (The Focus Sprint)",
          durationMinutes: 60,
          difficulty: "hard",
          tip: "Use active sprint intervals (Pomodoro) to hammer out the meat of the task."
        },
        {
          step: "Quick Polish & Self-Review Check",
          durationMinutes: 20,
          difficulty: "easy",
          tip: "Scan for blatant errors and confirm it hits the actual assignment/meeting rubric."
        }
      ]
    });
  }
});

// 2. API: Assistant Coach Chat & Context
app.post("/api/chat-coach", async (req, res) => {
  const { messages, userTaskContext } = req.body;

  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ error: "Messages array is required" });
    return;
  }

  try {
    const ai = getGeminiClient();
    const chatHistory = messages.map((m: any) => ({
      role: m.sender === "user" ? "user" : "model",
      parts: [{ text: m.text }],
    }));

    // Last message is the current user text
    const latestText = chatHistory[chatHistory.length - 1]?.parts[0]?.text || "Hello";
    // Previous context
    const previousTurns = chatHistory.slice(0, -1);

    const contextHeader = userTaskContext 
      ? `The user is currently struggling with this task: "${userTaskContext.title}" (Panic Index: ${userTaskContext.panicIndex}/100). The current steps include: ${userTaskContext.breakdown?.map((b: any) => b.step).join(", ")}. Use this context to give actionable, highly relevant busters!`
      : "The user has no active rescue task. Help them identify what is slipping or define a new goal they need to hit.";

    const systemInstruction = `You are 'The Rescue Coach', a funny, sharp, empathetic personal productivity partner for people who are hyper-distracted or in a panic. 
Keep your answers brief (under 3 sentences), highly actionable, and motivating. 
Focus on low-effort entry steps, dopamine management, and breaking the task paralysis cycle. 
${contextHeader}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        ...previousTurns,
        { role: "user", parts: [{ text: latestText }] }
      ],
      config: {
        systemInstruction,
        temperature: 0.85,
      }
    });

    res.json({ reply: response.text || "I'm here for you! Let's get taking action right away." });
  } catch (err: any) {
    console.error("Gemini Chat Coach error:", err);
    res.json({
      reply: "I'm in Local Backup Rescue Mode right now. The best way to beat this is to chunk it! Why don't you select the easiest micro-step in your list and do it immediately for just 2 minutes?",
      isDemoFallback: true
    });
  }
});

// 3. API: Speak Procrastination Buster (Text To Speech)
app.post("/api/speak-coach", async (req, res) => {
  const { text, voice } = req.body;

  if (!text) {
    res.status(400).json({ error: "Text is required to speak" });
    return;
  }

  try {
    const ai = getGeminiClient();
    const cleanText = text.replace(/[*#_`]/g, ""); // strip markdown formatting for spoken text

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: `Say warmly, dynamically, and supportively: ${cleanText}` }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice || "Zephyr" }, // Options: 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      res.json({ audio: base64Audio });
    } else {
      res.status(500).json({ error: "No audio generated" });
    }
  } catch (err: any) {
    console.error("Gemini TTS Error:", err);
    res.status(500).json({ error: "TTS failed on server" });
  }
});

// Vite Integration & Asset Serving
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Rescue Engine active on http://localhost:${PORT}`);
});
