import { GoogleGenAI } from "@google/genai";
import { AspectRatio } from "../types";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-2.5-flash-image';

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
    // If it's a pure text prompt (no source), we explicitly ask for an image if not already stated.
    let finalPrompt = prompt;
    if (!sourceImages || sourceImages.length === 0) {
        const lowerPrompt = prompt.toLowerCase();
        // If the prompt doesn't explicitly ask to generate/create/image, prepend it.
        if (!lowerPrompt.includes('generate') && !lowerPrompt.includes('create') && !lowerPrompt.includes('image')) {
            finalPrompt = `Generate an image of ${prompt}`;
        }
    }

    // Add text prompt
    parts.push({
      text: finalPrompt,
    });

    // Call the model
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: parts,
      },
      config: {
        // Note: responseMimeType and responseSchema are NOT supported for this model
        // imageConfig is supported for generation config
        imageConfig: {
           aspectRatio: aspectRatio
        },
        // System instruction to strictly enforce image generation behavior
        systemInstruction: "You are an advanced image generation model. Your task is to generate or edit images based on the user's prompt. Do not output text descriptions; always generate the requested image."
      },
    });

    // Parse the response to find the image
    // The model might return text (e.g., refusal or explanation) or inlineData (the image)
    if (response.candidates && response.candidates.length > 0) {
      const content = response.candidates[0].content;
      if (content && content.parts) {
        for (const part of content.parts) {
          if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          }
        }
        // If no image found, check for text to throw a useful error
        for (const part of content.parts) {
          if (part.text) {
            // Log the text for debugging
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