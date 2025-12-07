import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();

// Validate API key on startup
if (!process.env.GEMINI_API_KEY) {
  console.error('❌ ERROR: GEMINI_API_KEY is not set in environment variables!');
  console.error('Please create a .env file with your Gemini API key');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Your base prompts
const BASE_PROMPT = "You are an expert web developer assistant.";
const reactBasePrompt = `You are building a React application. Generate the necessary files with proper structure.`;
const nodeBasePrompt = `You are building a Node.js backend application. Generate the necessary files with proper structure.`;

// System prompt function
function getSystemPrompt() {
  return `You are an expert full-stack developer. Generate complete, production-ready code based on user requirements.

CRITICAL: You MUST respond with file creation steps in this EXACT XML format:

<boltArtifact id="project-files" title="Project Files">
  <boltAction type="file" filePath="src/App.tsx">
    <boltActionText>
import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <h1 className="text-4xl font-bold text-blue-600">Hello World</h1>
    </div>
  );
}

export default App;
    </boltActionText>
  </boltAction>
  
  <boltAction type="file" filePath="package.json">
    <boltActionText>
{
  "name": "my-app",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}
    </boltActionText>
  </boltAction>
</boltArtifact>

RULES:
1. ALWAYS wrap your entire response in <boltArtifact id="project-files" title="Project Files"> tags
2. Each file MUST be in a <boltAction type="file" filePath="path/to/file"> tag
3. File content MUST go inside <boltActionText> tags
4. Use proper file paths like "src/App.tsx", "src/components/Button.tsx", "package.json", etc.
5. Include ALL necessary files: components, package.json, configuration files, etc.
6. DO NOT include explanations outside the XML tags
7. Make sure code is complete and functional`;
}

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  console.log("Health check hit!");
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    apiKeyConfigured: !!process.env.GEMINI_API_KEY 
  });
});

// Template detection endpoint
app.post("/template", async (req: Request, res: Response) => {
  try {
    const userPrompt = req.body.prompt;

    if (!userPrompt || !userPrompt.trim()) {
      res.status(400).json({
        error: "Prompt is required",
      });
      return;
    }

    console.log("User Prompt:", userPrompt);

    const lowerPrompt = userPrompt.toLowerCase();

    // Check if user explicitly mentioned REACT or NODE at the end
    const endsWithReact = lowerPrompt.trim().endsWith('react');
    const endsWithNode = lowerPrompt.trim().endsWith('node');

    if (endsWithNode) {
      console.log("Detected: NODE (explicit)");
      res.json({
        prompts: [BASE_PROMPT, `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${nodeBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
        uiPrompts: [nodeBasePrompt]
      });
      return;
    }

    if (endsWithReact) {
      console.log("Detected: REACT (explicit)");
      res.json({
        prompts: [BASE_PROMPT, `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
        uiPrompts: [reactBasePrompt]
      });
      return;
    }

    // Keywords that strongly suggest Node/Backend
    const nodeKeywords = [
      'node', 'backend', 'api', 'server', 'express',
      'database', 'mongodb', 'postgres', 'sql', 'rest',
      'graphql', 'endpoint', 'route', 'middleware',
      'authentication', 'jwt'
    ];

    // Check for Node keywords
    for (const keyword of nodeKeywords) {
      if (lowerPrompt.includes(keyword)) {
        console.log("Detected: NODE (keyword:", keyword + ")");
        res.json({
          prompts: [BASE_PROMPT, `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${nodeBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
          uiPrompts: [nodeBasePrompt]
        });
        return;
      }
    }

    // Default to React
    console.log("Detected: REACT (default)");
    res.json({
      prompts: [BASE_PROMPT, `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
      uiPrompts: [reactBasePrompt]
    });

  } catch (err) {
    console.error("Error in /template:", err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Internal Server Error",
    });
  }
});

// Chat endpoint for code generation
app.post("/chat", async (req: Request, res: Response) => {
  try {
    const messages = req.body.messages;

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: "Messages array is required" });
      return;
    }

    console.log("Processing chat request with", messages.length, "messages");

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-exp",
      systemInstruction: getSystemPrompt()
    });

    // Convert messages to Gemini format
    const contents = messages.map((message: any) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content || "" }]
    }));

    console.log("Sending to Gemini...");

    const result = await model.generateContent({
      contents: contents,
      generationConfig: {
        maxOutputTokens: 8000,
        temperature: 0.7,
      }
    });

    const generatedText = result.response.text();
    
    // Log for debugging
    console.log("=== GEMINI RESPONSE ===");
    console.log("Length:", generatedText.length);
    console.log("First 1000 chars:", generatedText.substring(0, 1000));
    console.log("Contains boltArtifact:", generatedText.includes('boltArtifact'));
    console.log("Contains boltAction:", generatedText.includes('boltAction'));
    console.log("=====================");

    res.json({
      response: generatedText
    });

  } catch (err: any) {
    console.error("Error during Gemini API call:", err);
    res.status(500).json({
      error: err.message || "Internal Server Error",
      details: err.response?.data || null
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  //@ts-ignore
  console.log(`✅ Gemini API Key loaded: ${process.env.GEMINI_API_KEY.substring(0, 10)}...`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});