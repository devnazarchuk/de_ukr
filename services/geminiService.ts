import { GoogleGenAI, Type, Chat, Modality } from "@google/genai";
import { Word, WordCategory } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const modelName = "gemini-3-flash-preview";

// Helper to clean response text
const cleanText = (text: string) => text.trim();

/**
 * Generates a vocabulary list based on a topic
 */
export const generateVocabulary = async (topic: string, category: WordCategory, nativeLanguage: string = 'Ukrainian'): Promise<Word[]> => {
  const schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        german: { type: Type.STRING },
        translation: { type: Type.STRING },
        exampleSentence: { type: Type.STRING },
      },
      required: ["german", "translation", "exampleSentence"],
    },
  };

  try {
    const prompt = `Generate 5 German ${category}s related to the topic "${topic}". 
    Provide the ${nativeLanguage} translation and a simple example sentence in German.`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const rawData = JSON.parse(response.text || "[]");
    
    // Map to Word interface
    return rawData.map((item: any, index: number) => ({
      id: `${Date.now()}-${index}`,
      german: item.german,
      ukrainian: item.translation, // Storing "translation" in the "ukrainian" field for compatibility
      category: category,
      exampleSentence: item.exampleSentence,
      masteryLevel: 0,
    }));
  } catch (error) {
    console.error("Error generating vocabulary:", error);
    return [];
  }
};

/**
 * Chat Logic
 */
let chatSession: Chat | null = null;

export interface WordPair {
  word: string;
  translation: string;
}

export interface ScenarioTask {
  id: number;
  text: string;
  completed: boolean;
}

export interface ScenarioStartResponse {
  description: string;
  message: string;
  translation: string;
  word_pairs: WordPair[];
  hint: string;
  tasks: ScenarioTask[];
}

export interface ScenarioMessageResponse {
  text: string;
  translation: string;
  word_pairs: WordPair[];
  hint: string;
  completed_task_ids: number[];
}

const RESPONSE_SCHEMA_PROMPT = (nativeLanguage: string, tasks: ScenarioTask[]) => `
Output JSON with:
- text: The German response.
- translation: The full ${nativeLanguage} translation.
- word_pairs: An array of objects [{ "word": "GermanWord", "translation": "NativeWord" }] for EVERY SINGLE word in the 'text', including simple words like 'ich', 'das', 'ist'. 
  IMPORTANT: The 'word' field must match the EXACT inflected form used in the text (e.g. if text is "bin", word must be "bin", not "sein").
- hint: A short phrase in German that the user could say next as a reply.
- completed_task_ids: An array of IDs from the list provided below that the user (YOU, the 'user' role in previous turn) OR the dialogue flow has satisfied in the IMMEDIATE PREVIOUS TURN.
  Current Tasks: ${JSON.stringify(tasks)}
`;

export const startScenario = async (topic: string, nativeLanguage: string = 'Ukrainian'): Promise<ScenarioStartResponse> => {
  const prompt = `Create a roleplay scenario about "${topic}".
  The user speaks ${nativeLanguage} and wants to learn German (A2 level).
  You play the counterpart (e.g. waiter, doctor, friend).
  
  Output a JSON object with:
  - description: A short setting description in ${nativeLanguage} (e.g. "You are at a cafe...").
  - message: Your first sentence in German.
  - translation: The translation of the message.
  - word_pairs: Array of {word, translation} for every single word in your 'message'. The 'word' must match the exact text in 'message'.
  - hint: A suggested short German response for the user to start.
  - tasks: Generate 3 simple conversation objectives/tasks for the user (e.g. "Greet", "Ask price", "Say goodbye").
  `;

  const schema = {
    type: Type.OBJECT,
    properties: {
      description: { type: Type.STRING },
      message: { type: Type.STRING },
      translation: { type: Type.STRING },
      hint: { type: Type.STRING },
      tasks: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.INTEGER },
            text: { type: Type.STRING },
            completed: { type: Type.BOOLEAN }
          }
        }
      },
      word_pairs: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING },
            translation: { type: Type.STRING }
          }
        }
      }
    },
    required: ["description", "message", "translation", "word_pairs", "hint", "tasks"],
  };

  try {
    const result = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    });
    
    const data = JSON.parse(result.text || "{}") as ScenarioStartResponse;

    chatSession = ai.chats.create({
      model: modelName,
      history: [
        {
          role: 'user',
          parts: [{ text: `Roleplay: ${topic}. User speaks ${nativeLanguage}. Level A2. Return JSON.` }],
        },
        {
          role: 'model',
          parts: [{ text: data.message }],
        }
      ],
    });

    return data;
  } catch (e) {
    console.error(e);
    return { 
      description: "Error generating scenario.", 
      message: "Hallo! Wie geht es dir?", 
      translation: "Hello! How are you?",
      word_pairs: [
        { word: "Hallo!", translation: "Привіт!" },
        { word: "Wie", translation: "Як" },
        { word: "geht", translation: "справи" },
        { word: "es", translation: "воно" },
        { word: "dir?", translation: "в тебе?" }
      ],
      hint: "Danke, gut.",
      tasks: [{id: 1, text: "Say hello", completed: false}]
    };
  }
};

export const sendMessageToScenario = async (message: string, currentTasks: ScenarioTask[], nativeLanguage: string = 'Ukrainian'): Promise<ScenarioMessageResponse> => {
  if (!chatSession) {
    throw new Error("Chat session not initialized");
  }

  try {
    const prompt = `${message}\n\n${RESPONSE_SCHEMA_PROMPT(nativeLanguage, currentTasks)}`;
    
    const response = await chatSession.sendMessage({ message: prompt });
    
    let rawText = cleanText(response.text || "");
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) rawText = jsonMatch[0];

    try {
        const data = JSON.parse(rawText);
        return {
            text: data.text || data.message, 
            translation: data.translation,
            word_pairs: data.word_pairs || [],
            hint: data.hint || "",
            completed_task_ids: data.completed_task_ids || []
        };
    } catch (parseError) {
        return { text: rawText, translation: "Translation unavailable.", word_pairs: [], hint: "", completed_task_ids: [] };
    }
  } catch (e) {
    console.error(e);
    return { text: "Error connecting to AI.", translation: "", word_pairs: [], hint: "", completed_task_ids: [] };
  }
};

export const getHintForScenario = async (historyContext: string, nativeLanguage: string = 'Ukrainian'): Promise<string> => {
  return "Ja, bitte.";
};

// --- AUDIO GENERATION ---

// Helper to decode base64
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateSpeech = async (text: string, retries = 3): Promise<ArrayBuffer | null> => {
  if (!text || !text.trim()) {
    return null;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text.trim() }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' }, // 'Kore', 'Fenrir', 'Puck', 'Charon'
            },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        console.warn("Model returned no audio for text:", text.substring(0, 20) + "...");
        return null;
    }

    // Decode base64 to ArrayBuffer (PCM data)
    return decode(base64Audio).buffer;

  } catch (e: any) {
    // Check for Rate Limit (429)
    if (e.status === 429 || (e.message && e.message.includes("429"))) {
        if (retries > 0) {
            console.warn(`Rate limited. Retrying in ${(4 - retries) * 1000}ms...`);
            await sleep((4 - retries) * 1000); // Exponential backoff: 1s, 2s, 3s
            return generateSpeech(text, retries - 1);
        }
    }
    
    console.error("Speech generation error:", e);
    return null;
  }
};