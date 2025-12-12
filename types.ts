export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  sourceImages?: string[]; // Array of Base64 strings
  timestamp: number;
}

export interface ImageState {
  data: string; // Base64
  mimeType: string;
}

export type AspectRatio = "1:1" | "3:4" | "4:3" | "16:9" | "9:16" | "9:21" | "21:9" | "3:2" | "2:3";