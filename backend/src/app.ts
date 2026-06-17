import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { detectTemplate } from './detect-template';

const app = express();

// Initialize genAI — null-safe so tests can import app without process.exit
const apiKey = process.env.GEMINI_API_KEY;
let genAI: GoogleGenerativeAI | null = null;
if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
}

// Skills system
const SKILLS_DIR = path.join(__dirname, '..', 'skills');

interface SkillsCacheEntry {
  content: string;
  timestamp: number;
}
const skillsCache = new Map<'free' | 'premium', SkillsCacheEntry>();
const SKILLS_CACHE_TTL = 60_000;

function loadSkillFiles(tier: 'free' | 'premium'): string {
  const now = Date.now();
  const cached = skillsCache.get(tier);
  if (cached && (now - cached.timestamp) < SKILLS_CACHE_TTL) {
    return cached.content;
  }

  let skillsContent = '';

  const freeSkillPath = path.join(SKILLS_DIR, 'free', 'basic-starter.md');
  if (existsSync(freeSkillPath)) {
    try {
      skillsContent += '\n### Free Tier Instructions\n';
      skillsContent += readFileSync(freeSkillPath, 'utf-8');
    } catch (err) {
      console.warn(`[skills] Could not read free skill: ${freeSkillPath}`, err);
    }
  } else {
    console.warn(`[skills] Free skill file not found: ${freeSkillPath}`);
  }

  if (tier === 'premium') {
    const premiumDir = path.join(SKILLS_DIR, 'premium');
    if (existsSync(premiumDir)) {
      try {
        const allFiles = readdirSync(premiumDir);
        const skillFiles = allFiles
          .filter(f => f.endsWith('.md'))
          .sort();
        for (const file of skillFiles) {
          try {
            const filePath = path.join(premiumDir, file);
            const content = readFileSync(filePath, 'utf-8');
            if (content.trim().startsWith('#') || content.trim().startsWith('##')) {
              skillsContent += '\n' + content;
            } else {
              console.warn(`[skills] Skipping ${file}: does not start with heading`);
            }
          } catch (fileErr) {
            console.warn(`[skills] Could not read premium file: ${file}`, fileErr);
          }
        }
      } catch (err) {
        console.warn(`[skills] Could not read premium directory: ${premiumDir}`, err);
      }
    }
  }

  skillsCache.set(tier, { content: skillsContent, timestamp: now });
  return skillsContent;
}

// Middleware
app.use(cors({
  origin: ['https://blitz.horizonlab.in', 'http://localhost:5173' , 'https://blitz-new.vercel.app'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Base prompts
const BASE_PROMPT = "You are an expert web developer assistant.";
const reactBasePrompt = `You are building a React application. Generate the necessary files with proper structure.`;
const nodeBasePrompt = `You are building a Node.js backend application. Generate the necessary files with proper structure.`;

// System prompt function
function getSystemPrompt(tier: 'free' | 'premium' = 'free'): string {
  const basePrompt = `You are an expert full-stack developer. Generate complete, production-ready code based on user requirements.

CRITICAL: You MUST respond with file creation steps in this EXACT XML format:

<boltArtifact id="project-files" title="Project Files">
  <boltAction type="file" filePath="src/App.tsx">
import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <h1 className="text-4xl font-bold text-blue-600">Hello World</h1>
    </div>
  );
}

export default App;
  </boltAction>
  
  <boltAction type="file" filePath="package.json">
{
  "name": "my-app",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}
  </boltAction>
</boltArtifact>

RULES:
1. ALWAYS wrap your entire response in <boltArtifact id="project-files" title="Project Files"> tags
2. Each file MUST be in a <boltAction type="file" filePath="path/to/file"> tag
3. File content MUST go directly inside <boltAction> tags
4. Use proper file paths like "src/App.tsx", "src/components/Button.tsx", "package.json", etc.
5. Include ALL necessary files: components, package.json, configuration files, etc.
6. DO NOT include explanations outside the XML tags
7. Make sure code is complete and functional`;

  const skills = loadSkillFiles(tier);
  if (skills.trim()) {
    return basePrompt + '\n\n### Skill Instructions\n' + skills;
  }
  return basePrompt;
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

// Skills listing endpoint
app.get("/skills", (req: Request, res: Response) => {
  const skills: Array<{
    id: string;
    name: string;
    description: string;
    premium: boolean;
  }> = [];

  const categories = [
    { dir: 'free', premium: false },
    { dir: 'premium', premium: true }
  ];

  for (const { dir, premium } of categories) {
    const fullDir = path.join(SKILLS_DIR, dir);
    if (!existsSync(fullDir)) {
      console.warn(`[skills] Directory not found: ${fullDir}`);
      continue;
    }
    let files: string[];
    try {
      files = readdirSync(fullDir)
        .filter(f => f.endsWith('.md'))
        .sort();
    } catch (err) {
      console.warn(`[skills] Could not read directory: ${fullDir}`, err);
      continue;
    }

    for (const file of files) {
      let content: string;
      try {
        content = readFileSync(path.join(fullDir, file), 'utf-8');
      } catch (err) {
        console.warn(`[skills] Could not read file: ${file} in ${dir}`, err);
        continue;
      }

      const lines = content.trim().split('\n');
      const id = file.replace(/\.md$/, '');
      const nameLine = lines[0] || '';
      const name = nameLine.replace(/^#+\s*/, '').trim() || id;
      let description = '';
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          description = lines[i].trim();
          break;
        }
      }
      skills.push({ id, name, description, premium });
    }
  }

  res.json({ skills });
});

// Template detection endpoint
app.post("/template", async (req: Request, res: Response) => {
  try {
    const userPrompt = req.body.prompt;
    const userTier: 'free' | 'premium' = req.body.tier || 'free';

    if (!userPrompt || !userPrompt.trim()) {
      res.status(400).json({
        error: "Prompt is required",
      });
      return;
    }

    console.log("User Prompt:", userPrompt);

    const templateType = detectTemplate(userPrompt);
    console.log("Detected:", templateType.toUpperCase());

    const skillPrompt = loadSkillFiles(userTier);
    const enhancePrompt = (prompt: string) => prompt + (skillPrompt ? '\n' + skillPrompt : '');

    const basePromptContent = templateType === 'node' ? nodeBasePrompt : reactBasePrompt;

    res.json({
      prompts: [BASE_PROMPT, enhancePrompt(`Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${basePromptContent}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`)],
      uiPrompts: [enhancePrompt(basePromptContent)]
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
    const userTier: 'free' | 'premium' = req.body.tier || 'free';

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: "Messages array is required" });
      return;
    }

    if (!genAI) {
      res.status(500).json({ error: 'Gemini API key not configured' });
      return;
    }

    console.log(`Processing chat request with ${messages.length} messages, tier: ${userTier}`);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: getSystemPrompt(userTier)
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

export { app, genAI };
