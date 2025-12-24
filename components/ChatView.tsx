
import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Conversation, Message, AspectRatio } from '../types';
import { generateUUID } from '../utils/uuid';
import { createChat, generateImage, upscaleImage, superResolveImage, translateText } from '../services/geminiService';
import { ChatMessage } from './ChatMessage';
import { TypingIndicator } from './TypingIndicator';
import { SendIcon, MicIcon, StopIcon, PaperclipIcon, XIcon, MessageIcon, ImageIcon, SquareIcon, LandscapeIcon, PortraitIcon, ChevronDownIcon, SparklesIcon } from './IconComponents';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { Chat, Part } from '@google/genai';

interface ChatViewProps {
  conversation: Conversation;
  onMessagesChange: (id: string, messages: Message[], title?: string) => void;
}

type Mode = 'chat' | 'image';

const LanguageButton: React.FC<{
  language: 'English' | 'Urdu' | 'Hindi';
  onClick: () => void;
  disabled: boolean;
}> = ({ language, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {language}
  </button>
);


export const ChatView: React.FC<ChatViewProps> = ({ conversation, onMessagesChange }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachment, setAttachment] = useState<{ file: File; url: string } | null>(null);
  const [mode, setMode] = useState<Mode>('chat');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [is6KMode, setIs6KMode] = useState(false); // New state for 6K mode
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);


  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<Chat | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    isListening,
    startListening,
    stopListening,
    hasRecognitionSupport,
    error: speechError,
  } = useSpeechRecognition({
    onTranscript: (transcript) => {
      setInput(transcript);
    },
  });

  useEffect(() => {
    chatRef.current = createChat(conversation.messages);
  }, [conversation]);
  
  useEffect(() => {
    if (!showScrollToBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation.messages, isLoading, showScrollToBottom]);
  
  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };
  
  const handleSend = useCallback(async () => {
    const trimmedInput = input.trim();
    if ((!trimmedInput && !attachment) || isLoading) return;

    setIsLoading(true);

    if (mode === 'image') {
        const userMessage: Message = { id: generateUUID(), role: 'user', content: trimmedInput };
        const modelPlaceholder: Message = { id: generateUUID(), role: 'model', content: '', isLoading: true };
        const updatedMessages = [...conversation.messages, userMessage, modelPlaceholder];
        onMessagesChange(conversation.id, updatedMessages);
        setInput('');

        try {
            const imageUrl = await generateImage(trimmedInput, aspectRatio, is6KMode);
            const finalModelMessage: Message = { ...modelPlaceholder, isLoading: false, generatedImage: imageUrl };
            onMessagesChange(conversation.id, [...conversation.messages, userMessage, finalModelMessage]);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            const errorModelMessage: Message = { ...modelPlaceholder, isLoading: false, error: errorMessage };
            onMessagesChange(conversation.id, [...conversation.messages, userMessage, errorModelMessage]);
        } finally {
            setIsLoading(false);
        }

    } else { // Chat mode
        const userMessage: Message = {
          id: generateUUID(),
          role: 'user',
          content: trimmedInput,
          ...(attachment && { attachment: { url: attachment.url, mimeType: attachment.file.type } })
        };
    
        const updatedMessages = [...conversation.messages, userMessage];
        onMessagesChange(conversation.id, updatedMessages);
        
        setInput('');
        setAttachment(null);
        if(fileInputRef.current) fileInputRef.current.value = "";
    
        if (!chatRef.current) {
          chatRef.current = createChat(conversation.messages);
        }
    
        const parts: Part[] = [];
        if (attachment) {
          const base64Data = attachment.url.split(',')[1];
          parts.push({
            inlineData: { data: base64Data, mimeType: attachment.file.type },
          });
        }
        if (trimmedInput) {
          parts.push({ text: trimmedInput });
        }
        
        let modelResponse = '';
        const modelMessageId = generateUUID();
        
        try {
            const stream = await chatRef.current.sendMessageStream({ message: parts });
            for await (const chunk of stream) {
                const chunkText = chunk.text;
                if (chunkText) {
                    modelResponse += chunkText;
                    const modelMessage: Message = { id: modelMessageId, role: 'model', content: modelResponse };
                    onMessagesChange(conversation.id, [...updatedMessages, modelMessage]);
                }
            }
        } catch (error) {
            console.error("Error streaming response from Gemini:", error);
            const errorMessage: Message = { id: generateUUID(), role: 'model', content: 'Sorry, I encountered an error. Please try again.' };
            onMessagesChange(conversation.id, [...updatedMessages, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    }
  }, [input, isLoading, conversation, onMessagesChange, attachment, mode, aspectRatio, is6KMode]);
  
  const handleUpscaleImage = useCallback(async (messageId: string, imageUrl: string) => {
    // Set loading state for the specific message
    onMessagesChange(conversation.id, conversation.messages.map(m => 
        m.id === messageId ? { ...m, isUpscaling: true, error: undefined } : m
    ));

    try {
        const base64Data = imageUrl.split(',')[1];
        const mimeType = imageUrl.match(/data:(image\/[^;]+);/)?.[1] || 'image/png';
        
        if (!base64Data || !mimeType) {
            throw new Error("Invalid image URL format.");
        }

        const newImageUrl = await upscaleImage(base64Data, mimeType, is6KMode);

        // Update the message with the new image
        onMessagesChange(conversation.id, conversation.messages.map(m => 
            m.id === messageId ? { ...m, isUpscaling: false, generatedImage: newImageUrl } : m
        ));

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during upscaling.';
        // Update the message with an error
        onMessagesChange(conversation.id, conversation.messages.map(m => 
            m.id === messageId ? { ...m, isUpscaling: false, error: errorMessage } : m
        ));
    }
  }, [conversation.id, conversation.messages, onMessagesChange, is6KMode]);

  const handleSuperResolveImage = useCallback(async (messageId: string, imageUrl: string) => {
    // Set loading state for the specific message
    onMessagesChange(conversation.id, conversation.messages.map(m => 
        m.id === messageId ? { ...m, isSuperResolving: true, error: undefined } : m
    ));

    try {
        const base64Data = imageUrl.split(',')[1];
        const mimeType = imageUrl.match(/data:(image\/[^;]+);/)?.[1] || 'image/png';
        
        if (!base64Data || !mimeType) {
            throw new Error("Invalid image URL format.");
        }

        const newImageUrl = await superResolveImage(base64Data, mimeType, is6KMode);

        // Update the message with the new image
        onMessagesChange(conversation.id, conversation.messages.map(m => 
            m.id === messageId ? { ...m, isSuperResolving: false, generatedImage: newImageUrl } : m
        ));

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during super resolution.';
        // Update the message with an error
        onMessagesChange(conversation.id, conversation.messages.map(m => 
            m.id === messageId ? { ...m, isSuperResolving: false, error: errorMessage } : m
        ));
    }
  }, [conversation.id, conversation.messages, onMessagesChange, is6KMode]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const toggleListening = () => {
      if (isListening) stopListening();
      else startListening();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAttachment({ file, url: event.target.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleRemoveAttachment = () => {
      setAttachment(null);
      if(fileInputRef.current) fileInputRef.current.value = "";
  };
  
  const handleScroll = useCallback(() => {
    const container = chatContainerRef.current;
    if (container) {
      const threshold = 100; // pixels from the bottom
      const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + threshold;
      if (showScrollToBottom && isAtBottom) {
        setShowScrollToBottom(false);
      } else if (!showScrollToBottom && !isAtBottom) {
        setShowScrollToBottom(true);
      }
    }
  }, [showScrollToBottom]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleTranslate = useCallback(async (language: 'English' | 'Urdu' | 'Hindi') => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading || isTranslating) return;

    setIsTranslating(true);
    try {
      const translatedText = await translateText(trimmedInput, language);
      setInput(translatedText);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Translation failed.";
      alert(errorMessage); 
      console.error(error);
    } finally {
      setIsTranslating(false);
    }
  }, [input, isLoading, isTranslating]);

  const ModeButton: React.FC<{
    label: string,
    icon: React.ReactNode,
    currentMode: Mode,
    targetMode: Mode
  }> = ({label, icon, currentMode, targetMode}) => (
      <button 
          onClick={() => setMode(targetMode)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
              currentMode === targetMode 
                  ? 'bg-indigo-500 text-white' 
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
      >
          {icon}
          {label}
      </button>
  );

  const AspectRatioButton: React.FC<{
    label: string,
    icon: React.ReactNode,
    currentRatio: AspectRatio,
    targetRatio: AspectRatio
  }> = ({label, icon, currentRatio, targetRatio}) => (
    <button
      onClick={() => setAspectRatio(targetRatio)}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
        currentRatio === targetRatio
          ? 'bg-indigo-500 text-white'
          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="flex flex-col h-full">
      <header className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold truncate">{conversation.title}</h2>
      </header>
      <div className="relative flex-1">
        <div
          ref={chatContainerRef}
          onScroll={handleScroll}
          className="absolute inset-0 overflow-y-auto p-4 space-y-4"
        >
          {conversation.messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} onUpscale={handleUpscaleImage} onSuperResolve={handleSuperResolveImage} />
          ))}
          {isLoading && mode === 'chat' && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>
        {showScrollToBottom && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-4 right-4 z-10 p-2 rounded-full bg-indigo-500 text-white shadow-lg hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-opacity"
            aria-label="Scroll to bottom"
          >
            <ChevronDownIcon className="w-6 h-6" />
          </button>
        )}
      </div>
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        
        <div className="flex items-center gap-2 mb-2">
            <ModeButton label="Chat" icon={<MessageIcon className="w-4 h-4" />} currentMode={mode} targetMode="chat" />
            <ModeButton label="Image" icon={<ImageIcon className="w-4 h-4" />} currentMode={mode} targetMode="image" />
        </div>

        {mode === 'image' && (
           <div className="space-y-2 mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Size:</span>
                    <AspectRatioButton label="Square" icon={<SquareIcon className="w-4 h-4" />} currentRatio={aspectRatio} targetRatio="1:1" />
                    <AspectRatioButton label="Landscape" icon={<LandscapeIcon className="w-4 h-4" />} currentRatio={aspectRatio} targetRatio="16:9" />
                    <AspectRatioButton label="Portrait" icon={<PortraitIcon className="w-4 h-4" />} currentRatio={aspectRatio} targetRatio="9:16" />
                </div>
                 <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <SparklesIcon className="w-4 h-4 text-indigo-400" />
                        6K Mode:
                    </span>
                    <button
                        onClick={() => setIs6KMode(!is6KMode)}
                        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 ${
                            is6KMode ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                        aria-label="Toggle 6K Mode"
                    >
                        <span
                            className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ${
                                is6KMode ? 'translate-x-6' : 'translate-x-1'
                            }`}
                        />
                    </button>
                </div>
            </div>
        )}
        
        <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Translate prompt to:</span>
            <LanguageButton language="English" onClick={() => handleTranslate('English')} disabled={isTranslating || !input.trim()} />
            <LanguageButton language="Urdu" onClick={() => handleTranslate('Urdu')} disabled={isTranslating || !input.trim()} />
            <LanguageButton language="Hindi" onClick={() => handleTranslate('Hindi')} disabled={isTranslating || !input.trim()} />
            {isTranslating && (
              <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                <span>Translating...</span>
              </div>
            )}
        </div>

        {attachment && mode === 'chat' && (
            <div className="relative w-24 h-24 mb-2 p-1 border rounded-md border-gray-300 dark:border-gray-600">
                <img src={attachment.url} alt="Attachment preview" className="w-full h-full object-cover rounded-md" />
                <button 
                    onClick={handleRemoveAttachment} 
                    className="absolute -top-2 -right-2 bg-gray-700 text-white rounded-full p-0.5 hover:bg-red-500"
                    aria-label="Remove attachment"
                >
                    <XIcon className="w-4 h-4" />
                </button>
            </div>
        )}
        {speechError && <p className="text-red-500 text-sm mb-2 text-center">{speechError}</p>}
        <div className="relative flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg">
            {mode === 'chat' && (
                <>
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-3 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        aria-label="Attach file"
                        >
                        <PaperclipIcon className="w-5 h-5" />
                    </button>
                </>
            )}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={mode === 'chat' ? "Type your message or attach an image..." : "Describe the image you want to create..."}
            rows={1}
            className="w-full bg-transparent p-3 pr-28 text-gray-800 dark:text-gray-200 resize-none focus:outline-none max-h-40"
            disabled={isLoading}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
            {hasRecognitionSupport && mode === 'chat' && (
              <button
                onClick={toggleListening}
                className={`p-2 rounded-full transition-colors ${
                  isListening ? 'bg-red-500 text-white animate-pulse' : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                aria-label={isListening ? 'Stop listening' : 'Start listening'}
              >
                {isListening ? <StopIcon className="w-5 h-5" /> : <MicIcon className="w-5 h-5" />}
              </button>
            )}
            <button
              onClick={handleSend}
              disabled={(!input.trim() && (mode === 'chat' ? !attachment : true)) || isLoading}
              className="ml-2 p-2 rounded-full bg-indigo-500 text-white disabled:bg-gray-400 dark:disabled:bg-gray-500 hover:bg-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              aria-label="Send message"
            >
              <SendIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
