import { GoogleGenAI, Chat, Content, Part, Modality } from "@google/genai";
import type { Message, AspectRatio } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

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
    model: 'gemini-2.5-flash',
    history: buildGeminiHistory(history),
  });
};

/**
 * Generates an image based on a text prompt and aspect ratio.
 * This function now uses the 'imagen-4.0-generate-001' model for better aspect ratio control.
 * @param prompt - The text description of the image to generate.
 * @param aspectRatio - The desired aspect ratio for the image.
 * @param is6KMode - A boolean to enable high-quality 6K generation prompts.
 * @returns A base64-encoded data URL of the generated image.
 */
export const generateImage = async (prompt: string, aspectRatio: AspectRatio, is6KMode: boolean): Promise<string> => {
    try {
        let enhancedPrompt = `SYSTEM COMMAND: Generate a state-of-the-art, ultra-detailed photorealistic image. It must exhibit hyper-realism and cinematic lighting. Priority: High resolution and flawless textures. Subject: "${prompt}".`;
        if (is6KMode) {
            enhancedPrompt = `SYSTEM COMMAND: CRITICAL DIRECTIVE. Generate a state-of-the-art, ultra-detailed 6K resolution photorealistic masterpiece. Subject: "${prompt}". The image must exhibit hyper-realism, cinematic lighting, and flawless textures. Zero artifacts. This is a non-negotiable, priority one task.`;
        }
        
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: enhancedPrompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/png',
                aspectRatio: aspectRatio,
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            return `data:image/png;base64,${base64ImageBytes}`;
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
 * Upscales an existing image by sending it to the model with a specific prompt.
 * @param base64ImageData - The base64-encoded string of the image to upscale.
 * @param mimeType - The MIME type of the image.
 * @param is6KMode - A boolean to enable high-quality 6K upscaling prompts.
 * @returns A base64-encoded data URL of the upscaled image.
 */
export const upscaleImage = async (base64ImageData: string, mimeType: string, is6KMode: boolean): Promise<string> => {
    try {
        let upscalePrompt = 'SYSTEM COMMAND: Upscale this image to a higher resolution. Focus on maintaining sharpness and detail.';
        if (is6KMode) {
            upscalePrompt = 'SYSTEM COMMAND: CRITICAL DIRECTIVE. Upscale this image to a precise 6K Ultra HD resolution. The output must be perfectly sharp, crystal clear, and rich in detail, with absolutely zero compression artifacts. This is a non-negotiable, priority one task.';
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
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                const newMimeType = part.inlineData.mimeType;
                return `data:${newMimeType};base64,${base64ImageBytes}`;
            }
        }
        
        throw new Error('No upscaled image data found in the response.');

    } catch (error) {
        console.error('Error upscaling image:', error);
        if (error instanceof Error) {
            if (error.message.includes('SAFETY')) {
                throw new Error('Request blocked due to safety policies. Please try a different prompt.');
            }
            throw new Error(error.message);
        }
        throw new Error('An unknown error occurred while upscaling the image.');
    }
};

/**
 * Applies super-resolution to an existing image to enhance detail and clarity.
 * @param base64ImageData - The base64-encoded string of the image to process.
 * @param mimeType - The MIME type of the image.
 * @param is6KMode - A boolean to enable high-quality 6K enhancement prompts.
 * @returns A base64-encoded data URL of the super-resolved image.
 */
export const superResolveImage = async (base64ImageData: string, mimeType: string, is6KMode: boolean): Promise<string> => {
    try {
        // This prompt is a direct implementation of user feedback for the highest quality enhancement.
        const resolvePrompt = `SYSTEM COMMAND: CRITICAL DIRECTIVE. Regenerate this image in ultra-realistic 6K quality, keeping all original details, lighting, and colors exactly the same, but enhance sharpness, texture, and depth for a high-resolution professional look.`;
        
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
                        text: resolvePrompt,
                    },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                const newMimeType = part.inlineData.mimeType;
                return `data:${newMimeType};base64,${base64ImageBytes}`;
            }
        }
        
        throw new Error('No super-resolved image data found in the response.');

    } catch (error) {
        console.error('Error in super-resolution:', error);
        if (error instanceof Error) {
            if (error.message.includes('SAFETY')) {
                throw new Error('Request blocked due to safety policies. Please try a different prompt.');
            }
            throw new Error(error.message);
        }
        throw new Error('An unknown error occurred during super-resolution.');
    }
};