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
    // Fallback mock if no API key
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
        // Clean base64 if it has header
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

export const chatWithAI = async (message: string, useSearch: boolean = false) => {
    if (!ai) return { text: "I'm just a mock AI without an API key.", sources: [] };

    try {
        if (useSearch) {
             const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: message,
                config: {
                    tools: [{googleSearch: {}}],
                },
             });
             
             const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
             const sources = chunks?.map((c: any) => c.web?.uri).filter((u: string) => u) || [];
             
             return { text: response.text || "No response", sources };
        } else {
             const response = await ai.models.generateContent({
                 model: 'gemini-3-pro-preview',
                 contents: message
             });
             return { text: response.text || "No response", sources: [] };
        }
    } catch (e) {
        console.error(e);
        return { text: "Error communicating with AI.", sources: [] };
    }
}