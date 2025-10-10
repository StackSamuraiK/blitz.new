import express from "express"
import { Request , Response } from "express";
import cors from "cors"
import { BASE_PROMPT, getSystemPrompt } from "./prompts";
import {basePrompt as nodeBasePrompt} from "./defaults/node";
import {basePrompt as reactBasePrompt} from "./defaults/react";
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config()


const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const app = express()

app.use(express.json())
app.use(cors())

//@ts-ignore
app.post("/template", async (req: Request, res: Response) => {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  
      const prompt = req.body.prompt || "I need a React template"; // Example fallback
      console.log("Prompt:", prompt);
  
      const response = await model.generateContent({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          maxOutputTokens: 500,
          temperature: 0.1,
        },
      });
  
      
      const candidates = response.response.candidates;
      if (!candidates || candidates.length === 0) {
        console.warn("AI response contains no candidates. Returning fallback.");
        res.status(500).json({
          error: "AI response is invalid or contains no candidates.",
          fallback: "We could not determine a template. Please refine your prompt.",
        });
        return;
      }
  
      
      const answer = candidates[0]?.content?.parts?.map((part: any) => part.text).join("")?.trim() || "";
  
      if (!answer) {
        console.warn("AI response text is empty. Returning fallback.");
        res.status(500).json({
          error: "AI response text is empty or undefined.",
          fallback: "We could not determine a template. Please refine your prompt.",
        });
        return;
      }
  
      
      if (answer.toLowerCase().includes("react")) {
        res.json({
            prompts: [BASE_PROMPT, `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
            uiPrompts: [reactBasePrompt]
        })
        return;
      }
  
      if (answer.toLowerCase().includes("node")) {
        res.json({
            prompts: [`Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${nodeBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
            uiPrompts: [nodeBasePrompt]
        })
        return;
      }
  
      
      res.status(400).json({
        error: "Unable to determine the template based on the provided prompt.",
        aiResponse: answer,
      });
    } catch (err) {
      
      console.error("Error:", err);
      res.status(500).json({
        error: err instanceof Error ? err.message : "Internal Server Error",
      });
    }
  });

  //@ts-ignore
  import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

app.post("/chat", async (req: Request, res: Response) => {
    try {
        const messages = req.body.messages;
        
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            systemInstruction: getSystemPrompt()
        });

        const contents = messages.map((message: any) => ({
            role: message.role || "user",
            parts: [{ text: message.content || "" }]
        }));

        const result = await model.generateContent({
            contents: contents,
            generationConfig: {
                maxOutputTokens: 8000,
                temperature: 0.7,
            }
        });

        const generatedText = result.response.text();

        
        const fileMatches = generatedText.matchAll(/```([^`]+)```/g);
        const createdFiles: string[] = [];

        for (const match of fileMatches) {
            const fileContent = match[1];
            
            const pathMatch = fileContent.match(/File: (.+)\n/);
            const contentMatch = fileContent.match(/```[\s\S]*\n([\s\S]*)/);

            if (pathMatch && contentMatch) {
                const filePath = pathMatch[1];
                const content = contentMatch[1];

                
                const fullPath = path.join(process.cwd(), filePath);
                await mkdir(path.dirname(fullPath), { recursive: true });

                
                await writeFile(fullPath, content);
                createdFiles.push(filePath);
            }
        }

        res.json({ 
            response: generatedText,
            createdFiles: createdFiles 
        });

    } catch (err: any) {
        console.error("Error during Gemini API call:", err);
        res.status(500).json({ error: err.message || "Internal Server Error" });
    }
});  
app.listen(3000)
console.log("app listening on port 3000")
