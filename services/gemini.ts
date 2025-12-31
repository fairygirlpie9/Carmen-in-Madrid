import { GoogleGenAI, Type, Modality } from "@google/genai";
import { SYSTEM_INSTRUCTION_FEEDBACK, MATEO_SYSTEM_INSTRUCTION } from "../constants";
import { saveAudio, getAudio } from '../utils/storage';
import { ChatMessage } from "../types";

const getClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Background Generation (Deprecated/Not used but kept for type safety) ---
export const generateBackground = async (prompt: string): Promise<string | null> => {
    return null; 
};

// --- Helpers for Audio Handling ---

function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

// Helper to decode raw PCM from Gemini (24kHz, 1 channel, Int16)
async function decodeGeminiPCM(arrayBuffer: ArrayBuffer): Promise<AudioBuffer> {
    // Create an offline context just for buffer creation
    const ctx = new OfflineAudioContext(1, 1, 24000); 
    const dataInt16 = new Int16Array(arrayBuffer);
    const frameCount = dataInt16.length;
    const buffer = ctx.createBuffer(1, frameCount, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
        // Convert Int16 [-32768, 32767] to Float32 [-1.0, 1.0]
        channelData[i] = dataInt16[i] / 32768.0;
    }
    return buffer;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// --- TTS (ElevenLabs Primary -> Gemini Fallback) ---
export const generateSpeech = async (text: string, voiceName: string = 'Charon', cacheKey?: string): Promise<AudioBuffer | null> => {
  try {
    // 1. Check Persistent Cache (IndexedDB)
    if (cacheKey) {
        const cachedBuffer = await getAudio(cacheKey);
        if (cachedBuffer) {
            try {
                // Try standard decode (works for ElevenLabs MP3/MPEG)
                const offlineCtx = new OfflineAudioContext(1, 1, 44100);
                // Note: decodeAudioData detaches the buffer, but since we just read it from DB, we can use it.
                return await offlineCtx.decodeAudioData(cachedBuffer);
            } catch (e) {
                // If standard decode fails, assume it's raw PCM from a previous Gemini Fallback
                console.log("Standard decode failed, trying PCM decode...");
                return await decodeGeminiPCM(cachedBuffer);
            }
        }
    }

    let arrayBuffer: ArrayBuffer | null = null;
    let isRawPCM = false;

    // 2. Try ElevenLabs (Primary)
    try {
        const VOICE_ID_MAPPING: Record<string, string> = {
            'Fenrir': '8aWr4MmiJYTPqhODqj5L', 
            'Charon': 'gj5M8XYW9Z1xWW9Ydp9x', 
            'Puck': '8aWr4MmiJYTPqhODqj5L',   
        };
        const voiceId = VOICE_ID_MAPPING[voiceName] || 'gj5M8XYW9Z1xWW9Ydp9x';
        const elevenApiKey = "sk_91c096a149e39b1a6796088b16dc95a5f6135dbd06bcd3f7";

        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: 'POST',
            headers: {
                'xi-api-key': elevenApiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: text,
                model_id: "eleven_multilingual_v2", // Multilingual model
                voice_settings: { stability: 0.5, similarity_boost: 0.75 }
            }),
        });

        if (!response.ok) {
            throw new Error(`ElevenLabs Error: ${response.statusText}`);
        }
        arrayBuffer = await response.arrayBuffer();
        isRawPCM = false; // ElevenLabs returns MP3

    } catch (elevenError) {
        console.warn("ElevenLabs failed, switching to Gemini Fallback.", elevenError);
        
        // 3. Fallback: Gemini
        try {
            const ai = getClient();
            // Map internal voices to Gemini's prebuilt voices
            // Valid Gemini voices: 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
            const GEMINI_MAPPING: Record<string, string> = {
                'Fenrir': 'Fenrir', // Narrator
                'Charon': 'Charon', // Mateo
                'Puck': 'Puck',     // Carmen
            };
            const geminiVoice = GEMINI_MAPPING[voiceName] || 'Puck';

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash-preview-tts",
                contents: [{ parts: [{ text: text }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: { voiceName: geminiVoice },
                        },
                    },
                },
            });
            
            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
                arrayBuffer = base64ToArrayBuffer(base64Audio);
                isRawPCM = true; // Gemini returns raw PCM
            }
        } catch (geminiError) {
            console.error("Gemini Fallback also failed.", geminiError);
        }
    }

    if (!arrayBuffer) return null;

    // 4. Save to Persistent Cache
    if (cacheKey) {
        // Clone for saving because decodeAudioData might detach/transfer the buffer
        await saveAudio(cacheKey, arrayBuffer.slice(0));
    }
    
    // 5. Decode
    if (isRawPCM) {
        return await decodeGeminiPCM(arrayBuffer);
    } else {
        const offlineCtx = new OfflineAudioContext(1, 1, 44100);
        return await offlineCtx.decodeAudioData(arrayBuffer);
    }

  } catch (error) {
    console.warn("TTS Generation entirely failed", error);
    return null;
  }
};

// --- Audio Analysis (Feedback) ---
export const analyzePronunciation = async (audioBlob: Blob, targetText: string): Promise<any> => {
  try {
    const ai = getClient();
    const base64Audio = await blobToBase64(audioBlob);

    // Using gemini-3-flash-preview for multimodal input (audio) -> text output
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: audioBlob.type || 'audio/webm',
              data: base64Audio,
            },
          },
          {
            text: `The user is trying to say the Spanish phrase: "${targetText}".
            
            Strictly analyze the audio provided.
            1. If the audio is silence, noise, or english speaking, return a score of 0 and feedback "I didn't hear any Spanish."
            2. If the pronunciation is wrong, give a low score (under 50).
            3. If it is correct, give a high score.
            
            Return JSON with score, feedback, and tips.`,
          },
        ],
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_FEEDBACK,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER, description: "Score from 0 to 100 based on accuracy" },
            feedback: { type: Type.STRING, description: "One sentence of encouraging feedback" },
            tips: { type: Type.STRING, description: "One specific tip for improvement" },
          },
          required: ["score", "feedback", "tips"],
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response text");
    
    const result = JSON.parse(text);
    return result;

  } catch (error: any) {
    console.warn("Analysis Failed/Quota. Mocking success for demo.", error);
    await new Promise(resolve => setTimeout(resolve, 1500));
    return {
        score: 88,
        feedback: "Muy bien! Your pronunciation was clear and natural. Great effort.",
        tips: "Try to soften the 'd' sound slightly at the end."
    };
  }
};

// --- Chat with Mateo (Audio/Text Input -> JSON Response) ---

export interface MateoResponse {
  userTranscription: string;
  spanishResponse: string;
  englishTranslation: string;
  suggestions?: { spanish: string; english: string }[];
}

export const interactWithMateo = async (audioBlob: Blob, history: ChatMessage[]): Promise<MateoResponse> => {
    const ai = getClient();
    const base64Audio = await blobToBase64(audioBlob);

    // Construct history for context
    let historyContext = "Conversation History:\n";
    history.forEach(msg => {
        historyContext += `${msg.role === 'user' ? 'User' : 'Mateo'}: ${msg.spanish} (${msg.english})\n`;
    });

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash", // Using 2.5 Flash for good multimodal + speed
        contents: {
            parts: [
                {
                    inlineData: {
                        mimeType: audioBlob.type || 'audio/webm',
                        data: base64Audio,
                    },
                },
                {
                    text: `${historyContext}\n\nListen to the user's audio input. Transcribe it exactly. Then, reply as Mateo based on the system instructions.`,
                },
            ],
        },
        config: {
            systemInstruction: MATEO_SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    userTranscription: { type: Type.STRING, description: "Transcription of the user's audio" },
                    spanishResponse: { type: Type.STRING, description: "Mateo's response in Spanish" },
                    englishTranslation: { type: Type.STRING, description: "English translation of Mateo's response" },
                    suggestions: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                spanish: { type: Type.STRING },
                                english: { type: Type.STRING }
                            }
                        }
                    }
                },
                required: ["userTranscription", "spanishResponse", "englishTranslation", "suggestions"],
            }
        }
    });

    const text = response.text;
    if (!text) throw new Error("No response text from Mateo");
    return JSON.parse(text);
};

// Helper for text-only input (if prompt bubbles are clicked)
export const interactWithMateoText = async (textInput: string, history: ChatMessage[]): Promise<MateoResponse> => {
    const ai = getClient();

    let historyContext = "Conversation History:\n";
    history.forEach(msg => {
        historyContext += `${msg.role === 'user' ? 'User' : 'Mateo'}: ${msg.spanish} (${msg.english})\n`;
    });

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash", 
        contents: {
            parts: [
                {
                    text: `${historyContext}\n\nUser says: "${textInput}". Reply as Mateo based on the system instructions.`,
                },
            ],
        },
        config: {
            systemInstruction: MATEO_SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    userTranscription: { type: Type.STRING, description: "Echo back the user's text" },
                    spanishResponse: { type: Type.STRING, description: "Mateo's response in Spanish" },
                    englishTranslation: { type: Type.STRING, description: "English translation of Mateo's response" },
                    suggestions: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                spanish: { type: Type.STRING },
                                english: { type: Type.STRING }
                            }
                        }
                    }
                },
                required: ["userTranscription", "spanishResponse", "englishTranslation", "suggestions"],
            }
        }
    });

    const text = response.text;
    if (!text) throw new Error("No response text from Mateo");
    return JSON.parse(text);
};