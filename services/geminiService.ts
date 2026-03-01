import { GoogleGenAI, Chat, Content, Part, Modality } from "@google/genai";
import type { Message, AspectRatio } from '../types';

// Properly initialize the Google GenAI SDK using a named parameter for the API key.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const buildGeminiHistory = (messages: Message[]): Content[] => {
  return messages.map(msg => {
    const parts: Part[] = [];
    if (msg.attachment) {
      const base64Data = msg.attachment.url.split(',')[1];
      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: msg.attachment.mimeType,
        },
      });
    }
    if (msg.content) {
      parts.push({ text: msg.content });
    }
    return {
      role: msg.role,
      parts,
    };
  });
};

export const createChat = (history: Message[]): Chat => {
  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    history: buildGeminiHistory(history),
  });
};

/**
 * Generates an image based on a text prompt and aspect ratio.
 */
export const generateImage = async (prompt: string, aspectRatio: AspectRatio, is6KMode: boolean): Promise<string> => {
    try {
        let enhancedPrompt = `SYSTEM COMMAND: Generate a photorealistic masterpiece. Subject: "${prompt}". The image must be hyper-detailed, crystal clear, and feature cinematic lighting. Aim for professional photography standards.`;
        if (is6KMode) {
            enhancedPrompt = `SYSTEM COMMAND: EXTREME QUALITY DIRECTIVE. Generate a flawless, ultra-photorealistic 8K resolution masterpiece. Subject: "${prompt}". This image must be indistinguishable from a high-end DSLR photograph. Every texture must be hyper-detailed. Lighting must be dramatic and cinematic. Zero artifacts, zero excuses. This is a top-priority, non-negotiable command.`;
        }
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: [{ text: enhancedPrompt }],
            config: {
                imageConfig: {
                    aspectRatio: aspectRatio,
                }
            }
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        
        throw new Error('No image data found in the response.');

    } catch (error) {
        console.error('Error generating image:', error);
        if (error instanceof Error) {
            if (error.message.includes('SAFETY')) {
                throw new Error('Request blocked due to safety policies. Please try a different prompt.');
            }
            throw new Error(error.message);
        }
        throw new Error('An unknown error occurred while generating the image.');
    }
};


/**
 * Upscales an existing image.
 */
export const upscaleImage = async (base64ImageData: string, mimeType: string, is6KMode: boolean): Promise<string> => {
    try {
        let upscalePrompt = 'SYSTEM COMMAND: Perform a flawless upscale of this image. The output must be significantly larger, sharper, and crystal clear. Remove any blur or compression artifacts. Enhance all details.';
        if (is6KMode) {
            upscalePrompt = 'SYSTEM COMMAND: MAXIMUM QUALITY UPSCALE PROTOCOL. Execute a state-of-the-art, AI-driven upscale to an 8K equivalent resolution. The primary objective is absolute photorealism and forensic-level detail.';
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: base64ImageData,
                            mimeType: mimeType,
                        },
                    },
                    {
                        text: upscalePrompt,
                    },
                ],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        
        throw new Error('No upscaled image data found in the response.');

    } catch (error) {
        console.error('Error upscaling image:', error);
        throw error;
    }
};

/**
 * Applies super-resolution.
 */
export const superResolveImage = async (base64ImageData: string, mimeType: string, is6KMode: boolean): Promise<string> => {
    try {
        let imageDataForProcessing = base64ImageData;
        let mimeTypeForProcessing = mimeType;

        if (is6KMode) {
            const upscaledImageResult = await upscaleImage(base64ImageData, mimeType, true);
            imageDataForProcessing = upscaledImageResult.split(',')[1];
            mimeTypeForProcessing = upscaledImageResult.match(/data:(image\/[^;]+);/)?.[1] || 'image/png';
        }

        let resolvePrompt = 'SYSTEM COMMAND: Enhance this image to be perfectly sharp and clear. Focus on refining details and textures.';
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: imageDataForProcessing,
                            mimeType: mimeTypeForProcessing,
                        },
                    },
                    {
                        text: resolvePrompt,
                    },
                ],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        
        throw new Error('No super-resolved image data found in the response.');

    } catch (error) {
        console.error('Error in super-resolution:', error);
        throw error;
    }
};

/**
 * Translates a given text to a target language.
 */
export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
    if (!text.trim()) return text;
    try {
        const prompt = `Translate the following text to ${targetLanguage}. Provide only the translated text. Text: "${text}"`;
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });
        // Correctly accessing the text property from the GenerateContentResponse object.
        return response.text?.trim() || "";
    } catch (error) {
        console.error(`Error translating text:`, error);
        throw error;
    }
};