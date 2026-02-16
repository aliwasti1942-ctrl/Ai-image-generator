import { GoogleGenAI } from "@google/genai";
import { AspectRatio } from "../types";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-2.5-flash-image';

// List of officially supported aspect ratios for the imageConfig property
const SUPPORTED_ASPECT_RATIOS = ["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"];

interface GenerateOptions {
  prompt: string;
  sourceImages?: {
    data: string; // Base64
    mimeType: string;
  }[];
  aspectRatio?: AspectRatio;
}

export const generateOrEditImage = async ({
  prompt,
  sourceImages,
  aspectRatio = "1:1"
}: GenerateOptions): Promise<string> => {
  
  try {
    const parts: any[] = [];

    // If source images exist, add them first (Multimodal input for editing)
    if (sourceImages && sourceImages.length > 0) {
      sourceImages.forEach(img => {
        // Extract base64 data if it contains the header prefix
        const cleanBase64 = img.data.includes('base64,') 
          ? img.data.split('base64,')[1] 
          : img.data;

        parts.push({
          inlineData: {
            data: cleanBase64,
            mimeType: img.mimeType,
          },
        });
      });
    }

    // Enhance prompt to ensure image generation
    let finalPrompt = prompt;

    if (!sourceImages || sourceImages.length === 0) {
        const lowerPrompt = prompt.toLowerCase();
        if (!lowerPrompt.includes('generate') && !lowerPrompt.includes('create') && !lowerPrompt.includes('image')) {
            finalPrompt = `Generate an image of ${finalPrompt}`;
        }
    }

    // Add text prompt
    parts.push({
      text: finalPrompt,
    });

    // Handle unsupported aspect ratios by mapping them and using text guidance
    const isSpecialRatio = !SUPPORTED_ASPECT_RATIOS.includes(aspectRatio);
    const configRatio = isSpecialRatio ? "21:9" : aspectRatio;
    
    let systemInstruction = "You are an advanced image generation model. Your task is to generate or edit images based on the user's prompt. Do not output text descriptions; always generate the requested image.";
    
    if (isSpecialRatio) {
      systemInstruction += ` Special formatting request: The user wants an ultra-wide panoramic aspect ratio of ${aspectRatio}. Since the canvas is limited to 21:9, ensure the composition is cinematic and uses the full horizontal width for an ultra-wide feel.`;
    }

    // Call the model
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: parts,
      },
      config: {
        imageConfig: {
           aspectRatio: configRatio as any
        },
        systemInstruction: systemInstruction
      },
    });

    // Parse the response to find the image
    if (response.candidates && response.candidates.length > 0) {
      const content = response.candidates[0].content;
      if (content && content.parts) {
        for (const part of content.parts) {
          if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          }
        }
        for (const part of content.parts) {
          if (part.text) {
            console.warn("Model returned text instead of image:", part.text);
            throw new Error(`Model returned text instead of image: ${part.text}`);
          }
        }
      }
    }

    throw new Error("No image generated. The model response was empty or invalid.");

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Failed to process image request.");
  }
};