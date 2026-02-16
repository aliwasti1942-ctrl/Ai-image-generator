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

export type AspectRatio = "1:1" | "2:3" | "3:2" | "3:4" | "4:3" | "4:5" | "5:4" | "9:16" | "16:9" | "21:9" | "10:1" | "3:1";