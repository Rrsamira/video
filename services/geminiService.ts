
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { AICommandResponse } from "../types";

/**
 * Standard utility to decode base64 strings to Uint8Array as per Gemini guidelines.
 */
function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export const processAICommand = async (command: string): Promise<AICommandResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze this video editing command: "${command}". 
    Categorize it into one of: 'TRIM', 'FILTER', 'MUSIC_SYNC', 'SCENE_DETECT', 'TEXT_OVERLAY'.
    Return a detailed JSON explanation.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          action: { type: Type.STRING },
          description: { type: Type.STRING },
          parameters: { 
            type: Type.OBJECT,
            properties: {
              value: { type: Type.STRING },
              intensity: { type: Type.NUMBER }
            }
          }
        },
        required: ["action", "description"]
      }
    }
  });

  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    return { action: 'ERROR', description: 'Could not understand command.' };
  }
};

export const fastAIResponse = async (prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    // Corrected model name for flash lite
    model: 'gemini-flash-lite-latest',
    contents: prompt,
  });
  return response.text || "No response";
};

export const transcribeAudio = async (base64Audio: string, mimeType: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    // Using the native audio preview model for precise transcription of audio parts
    model: 'gemini-2.5-flash-native-audio-preview-12-2025',
    contents: {
      parts: [
        { inlineData: { data: base64Audio, mimeType: mimeType } },
        { text: "Transcribe this audio clip accurately into text." }
      ]
    }
  });
  return response.text || "";
};

export const complexQueryThinking = async (prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      thinkingConfig: {
        thinkingBudget: 32768
      }
    }
  });
  return response.text || "";
};

export const editImageWithAI = async (base64Data: string, mimeType: string, prompt: string): Promise<string | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: base64Data, mimeType: mimeType } },
        { text: prompt },
      ],
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }
  return null;
};

export const generateHighQualityImage = async (prompt: string, size: "1K" | "2K" | "4K"): Promise<string | null> => {
  // Fresh instance for gemini-3-pro series models to ensure correct API key usage
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: { parts: [{ text: prompt }] },
    config: {
      imageConfig: {
        aspectRatio: "1:1",
        imageSize: size
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }
  return null;
};

export const generateVeoVideo = async (base64Image: string, prompt: string, aspectRatio: '16:9' | '9:16'): Promise<string | null> => {
  // Fresh instance for Veo models to ensure correct API key usage
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: prompt,
    image: {
      imageBytes: base64Image,
      mimeType: 'image/png',
    },
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: aspectRatio
    }
  });

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) return null;

  const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};

export const analyzeVideoContent = async (base64Frames: string[], prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const parts = base64Frames.map(frame => ({
    inlineData: { data: frame, mimeType: 'image/jpeg' }
  }));
  parts.push({ text: prompt } as any);

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { parts: parts as any },
  });

  return response.text || "Analysis failed.";
};

export const generateSpeech = async (text: string): Promise<ArrayBuffer | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (base64Audio) {
    // Decoding manual base64 as per guideline for PCM data
    const bytes = decodeBase64(base64Audio);
    return bytes.buffer;
  }
  return null;
};

export const detectScenes = async (base64Image: string): Promise<string[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
            parts: [
                { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
                { text: "List the primary visual elements or potential scene changes you see in this video frame." }
            ]
        }
    });
    return response.text?.split('\n') || [];
};
