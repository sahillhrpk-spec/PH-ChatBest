// Defines the possible themes for the application.
export type Theme = 'light' | 'dark';

// Defines the supported aspect ratios for image generation.
export type AspectRatio = '1:1' | '16:9' | '9:16';

// Represents a single message in a conversation.
export interface Message {
  id: string;
  role: 'user' | 'model'; // The sender of the message.
  content: string;
  attachment?: {
    url: string; // Data URL for preview
    mimeType: string;
    name?: string; // Filename for documents
    size?: number; // File size in bytes
  };
  // For model-generated images
  generatedImage?: string; // Data URL of the generated image
  isLoading?: boolean; // To show a loading state for this specific message
  error?: string; // To show an error state for this specific message
  isUpscaling?: boolean; // To show loading state during upscale
  isSuperResolving?: boolean; // To show loading state during super resolution
}

// Represents a full conversation thread.
export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
}

// Represents a user.
export interface User {
  email: string;
  password?: string; // Added for email/password authentication
  role?: 'admin' | 'user';
}