import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ScriptResult } from "../types";

const API_KEY = process.env.API_KEY || '';
let ai: GoogleGenAI | null = null;

if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
}

export const getAIClient = () => ai;

export const generateScript = async (topic: string, platform: string, tone: string, language: string = 'English'): Promise<ScriptResult> => {
  if (!ai) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          title: `Viral ${topic} Video`,
          hook: `Stop doing ${topic} WRONG! Here is the secret...`,
          body: `Most people think ${topic} is hard. But actually, if you follow these 3 steps...\n\n1. Step One details...\n2. Step Two details...\n3. Step Three details...`,
          cta: "Follow for more daily tips!",
          estimatedViralScore: 85,
          hashtags: [`#${topic.replace(/\s/g, '')}`, '#viral', '#fyp']
        });
      }, 1500);
    });
  }

  try {
    const model = "gemini-2.5-flash";
    const prompt = `
      Create a viral video script for ${platform} about "${topic}".
      Language: ${language} (Ensure the script is written entirely in this language).
      Tone: ${tone}.
      Structure:
      1. Hook (Grab attention in 3 seconds)
      2. Body (Value proposition)
      3. CTA (Call to action)
      
      Also estimate a viral score from 0-100 based on current trends, and suggest 3 hashtags.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            hook: { type: Type.STRING },
            body: { type: Type.STRING },
            cta: { type: Type.STRING },
            estimatedViralScore: { type: Type.NUMBER },
            hashtags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response text");
    
    return JSON.parse(text) as ScriptResult;
  } catch (error) {
    console.error("Error generating script:", error);
    throw error;
  }
};

export const analyzeTrend = async (keyword: string) => {
   if (!ai) {
      return { prediction: "High growth potential in next 7 days.", score: 92 };
   }
   
   try {
     const response = await ai.models.generateContent({
       model: 'gemini-2.5-flash',
       contents: `Analyze the growth potential for the keyword "${keyword}" on social media. Provide a short prediction sentence and a score out of 100.`,
       config: {
         responseMimeType: "application/json",
         responseSchema: {
            type: Type.OBJECT,
            properties: {
                prediction: { type: Type.STRING },
                score: { type: Type.NUMBER }
            }
         }
       }
     });
     return JSON.parse(response.text || '{}');
   } catch (e) {
     console.error(e);
     return { prediction: "Unable to analyze at this moment.", score: 0 };
   }
};

export const generateImage = async (prompt: string): Promise<string | null> => {
    if (!ai) return null;
    try {
      const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '16:9',
        },
      });
      const base64ImageBytes = response.generatedImages?.[0]?.image?.imageBytes;
      return base64ImageBytes ? `data:image/jpeg;base64,${base64ImageBytes}` : null;
    } catch (error) {
      console.error("Error generating image:", error);
      throw error;
    }
}

export const editImageWithAI = async (base64Image: string, prompt: string): Promise<string | null> => {
    if(!ai) return null;
    try {
        const data = base64Image.includes('base64,') ? base64Image.split('base64,')[1] : base64Image;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: data,
                            mimeType: 'image/jpeg' 
                        }
                    },
                    { text: prompt }
                ]
            },
            config: {
                responseModalities: [Modality.IMAGE]
            }
        });
        
        const part = response.candidates?.[0]?.content?.parts?.[0];
        if (part && part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
        }
        return null;
    } catch (e) {
        console.error("Edit image error", e);
        throw e;
    }
}

export const generateVideo = async (prompt: string, aspectRatio: '16:9' | '9:16' = '16:9'): Promise<string | null> => {
    if (!ai) return null;
    try {
        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: aspectRatio
            }
        });

        // Poll for completion
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 3000));
            operation = await ai.operations.getVideosOperation({operation: operation});
        }

        const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (videoUri) {
             return `${videoUri}&key=${API_KEY}`;
        }
        return null;
    } catch (e) {
        console.error("Video generation error", e);
        throw e;
    }
}

export const generateSpeechAI = async (text: string, voiceName: string = 'Kore'): Promise<string | null> => {
    if (!ai) return null;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: { parts: [{ text }] },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voiceName } 
                    }
                }
            }
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        // Return base64 PCM
        return base64Audio || null;
    } catch (e) {
        console.error("TTS Error", e);
        throw e;
    }
}

export const transcribeAudio = async (audioBase64: string): Promise<string> => {
    if (!ai) return "Simulated transcription: This audio content is analyzed by AI.";
    try {
        const data = audioBase64.includes('base64,') ? audioBase64.split('base64,')[1] : audioBase64;
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: {
                parts: [
                    { inlineData: { data: data, mimeType: 'audio/mp3' } }, // Assume MP3 or compatible
                    { text: "Transcribe this audio verbatim." }
                ]
            }
        });
        return response.text || "No transcription generated.";
    } catch (e) {
        console.error("Transcription Error", e);
        return "Error transcribing audio.";
    }
}

export interface ChatConfig {
    useSearch?: boolean;
    useMaps?: boolean;
    useThinking?: boolean;
    attachment?: { data: string; mimeType: string };
}

export const chatWithAI = async (message: string, config: ChatConfig = {}) => {
    if (!ai) return { text: "I'm just a mock AI without an API key.", sources: [] };

    try {
        let model = "gemini-2.5-flash";
        let tools: any[] = [];
        let contents: any = message;
        let toolConfig: any = undefined;
        let thinkingConfig: any = undefined;

        // Thinking Mode overrides other models
        if (config.useThinking) {
            model = "gemini-3-pro-preview";
            thinkingConfig = { thinkingBudget: 16000 }; // Use a reasonable budget
        }

        // Search Grounding
        if (config.useSearch && !config.useThinking) {
             tools.push({ googleSearch: {} });
        }

        // Maps Grounding
        if (config.useMaps && !config.useThinking) {
            tools.push({ googleMaps: {} });
        }

        // Attachments (Video/Image)
        if (config.attachment) {
            // Video understanding usually requires Pro model
            if (config.attachment.mimeType.startsWith('video/') || config.attachment.mimeType.startsWith('image/')) {
                // If it's video, we prefer Gemini 3 Pro if not already selected
                if (!config.useThinking) model = "gemini-3-pro-preview"; 
            }
            
            const cleanData = config.attachment.data.includes('base64,') 
                ? config.attachment.data.split('base64,')[1] 
                : config.attachment.data;

            contents = {
                parts: [
                    { inlineData: { data: cleanData, mimeType: config.attachment.mimeType } },
                    { text: message }
                ]
            };
        }

        const finalConfig: any = {};
        if (tools.length > 0) finalConfig.tools = tools;
        if (toolConfig) finalConfig.toolConfig = toolConfig;
        if (thinkingConfig) finalConfig.thinkingConfig = thinkingConfig;

        const response = await ai.models.generateContent({
            model: model,
            contents: contents,
            config: finalConfig
        });

        const text = response.text || "No response";
        
        // Extract sources from grounding
        let sources: string[] = [];
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        
        if (chunks) {
            chunks.forEach((c: any) => {
                if (c.web?.uri) sources.push(c.web.uri);
                if (c.maps?.uri) sources.push(c.maps.uri); // Maps URI
            });
        }

        return { text, sources };

    } catch (e) {
        console.error("Chat Error", e);
        return { text: "I encountered an error processing your request.", sources: [] };
    }
}