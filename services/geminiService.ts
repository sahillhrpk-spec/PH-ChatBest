
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
        let enhancedPrompt = `SYSTEM COMMAND: Generate a photorealistic masterpiece. Subject: "${prompt}". The image must be hyper-detailed, crystal clear, and feature cinematic lighting. Aim for professional photography standards.`;
        if (is6KMode) {
            enhancedPrompt = `SYSTEM COMMAND: EXTREME QUALITY DIRECTIVE. Generate a flawless, ultra-photorealistic 8K resolution masterpiece. Subject: "${prompt}". This image must be indistinguishable from a high-end DSLR photograph. Every texture must be hyper-detailed. Lighting must be dramatic and cinematic. Zero artifacts, zero excuses. This is a top-priority, non-negotiable command.`;
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
        let upscalePrompt = 'SYSTEM COMMAND: Perform a flawless upscale of this image. The output must be significantly larger, sharper, and crystal clear. Remove any blur or compression artifacts. Enhance all details.';
        if (is6KMode) {
            upscalePrompt = 'SYSTEM COMMAND: MAXIMUM QUALITY UPSCALE PROTOCOL. Execute a state-of-the-art, AI-driven upscale to an 8K equivalent resolution. The primary objective is absolute photorealism and forensic-level detail. The final image must be artifact-free, incredibly sharp, and vibrant. Eradicate all compression artifacts, noise, and motion blur. Enhance textures, clarify fine lines, and optimize lighting to be indistinguishable from a high-end professional photograph. This is a non-negotiable, top-priority directive.';
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
 * In 6K Mode, this now performs a two-step process: first upscaling the image,
 * then applying detail enhancement to the upscaled result for maximum clarity.
 * @param base64ImageData - The base64-encoded string of the image to process.
 * @param mimeType - The MIME type of the image.
 * @param is6KMode - A boolean to enable high-quality 6K enhancement prompts.
 * @returns A base64-encoded data URL of the super-resolved image.
 */
export const superResolveImage = async (base64ImageData: string, mimeType: string, is6KMode: boolean): Promise<string> => {
    try {
        let imageDataForProcessing = base64ImageData;
        let mimeTypeForProcessing = mimeType;

        // In 6K mode, perform a two-step enhancement: upscale first, then resolve detail.
        if (is6KMode) {
            console.log("6K Mode: Starting Stage 1 - Upscaling...");
            // Stage 1: Upscale the image to get a better base for enhancement.
            const upscaledImageResult = await upscaleImage(base64ImageData, mimeType, true);
            
            // Prepare the upscaled image for the next stage.
            imageDataForProcessing = upscaledImageResult.split(',')[1];
            mimeTypeForProcessing = upscaledImageResult.match(/data:(image\/[^;]+);/)?.[1] || 'image/png';
            console.log("6K Mode: Stage 1 Complete. Starting Stage 2 - Detail Enhancement...");
        }

        // Stage 2: Apply detail enhancement prompt.
        let resolvePrompt = 'SYSTEM COMMAND: Enhance this image to be perfectly sharp and clear. Focus on refining details and textures. Remove all blurriness without altering the composition.';
        if (is6KMode) {
            resolvePrompt = `SYSTEM COMMAND: CRYSTAL CLARITY ENHANCEMENT. Your sole objective is to make this image flawlessly sharp and perfectly clear. Execute a master-level super-resolution and detail restoration process. The goal is unparalleled clarity, removing all atmospheric haze, softness, and digital noise. Sharpen edges without creating halos. Restore fine textures and micro-details. The result must be a pristine, high-resolution image that looks like it was captured with a prime lens on a professional camera. This is a command for absolute perfection.`;
        }
        
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
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                console.log("6K Mode: Stage 2 Complete.");
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

/**
 * Translates a given text to a target language using the Gemini API.
 * @param text - The text to translate.
 * @param targetLanguage - The language to translate the text into (e.g., "Urdu", "Hindi").
 * @returns The translated text as a string.
 */
export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
    if (!text.trim()) {
        return text;
    }

    try {
        const prompt = `Translate the following text to ${targetLanguage}.
        Provide only the raw, translated text, without any additional explanations, introductory phrases, or markdown formatting.
        For example, if asked to translate "Hello world" to Spanish, the output should be exactly "Hola mundo".
        
        Text to translate:
        "${text}"`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        
        return response.text.trim();

    } catch (error) {
        console.error(`Error translating text to ${targetLanguage}:`, error);
        if (error instanceof Error) {
             if (error.message.includes('SAFETY')) {
                throw new Error('Translation blocked due to safety policies. Please modify the text.');
            }
            throw new Error(`Failed to translate text: ${error.message}`);
        }
        throw new Error('An unknown error occurred during translation.');
    }
};
