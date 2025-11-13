
import React, { useState } from 'react';
import type { Message } from '../types';
import { UserIcon, ModelIcon, ImageIcon, DownloadIcon, SparklesIcon, MaximizeIcon, CopyIcon, CheckIcon } from './IconComponents';

const ImageLoadingSkeleton: React.FC = () => (
    <div className="w-64 h-64 bg-gray-200 dark:bg-gray-600 rounded-lg animate-pulse flex items-center justify-center">
        <ImageIcon className="w-10 h-10 text-gray-400 dark:text-gray-500" />
    </div>
);

const ImageError: React.FC<{ error: string }> = ({ error }) => (
    <div className="w-64 p-4 bg-red-100 dark:bg-red-900/50 border border-red-400 text-red-700 dark:text-red-300 rounded-lg">
        <p className="font-semibold">An Error Occurred</p>
        <p className="text-sm">{error}</p>
    </div>
);

const CodeBlock: React.FC<{ code: string }> = ({ code }) => {
    const [copied, setCopied] = useState(false);
  
    const handleCopy = () => {
      navigator.clipboard.writeText(code).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
      }).catch(err => {
        console.error('Failed to copy code: ', err);
      });
    };
  
    return (
      <div className="bg-gray-900 dark:bg-black rounded-lg my-2 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-1.5 bg-gray-800 dark:bg-gray-700/50 border-b border-gray-700 dark:border-gray-800">
            <span className="text-xs font-sans text-gray-400">Code</span>
            <button 
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs text-gray-300 rounded-md px-2 py-1 hover:bg-gray-700 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
              aria-label="Copy code"
            >
              {copied ? (
                <>
                  <CheckIcon className="w-3.5 h-3.5 text-green-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <CopyIcon className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
        </div>
        <pre className="p-4 overflow-x-auto text-sm text-white">
          <code className="font-mono">{code}</code>
        </pre>
      </div>
    );
};

const ContentRenderer: React.FC<{ content: string }> = ({ content }) => {
    // Regex to find code blocks enclosed in triple backticks, with an optional language identifier
    const codeBlockRegex = /```(\w*\n?)([\s\S]*?)```/g;
    const parts = content.split(codeBlockRegex);
  
    return (
      <div className="max-w-none break-words">
        {parts.map((part, index) => {
          // The third part of each match is the code content
          if (index % 3 === 2) {
            return <CodeBlock key={index} code={part.trim()} />;
          }
          // The first part is the text before any code blocks, and subsequent text between blocks
          if (index % 3 === 0 && part) {
            return (
              <div key={index} className="max-w-none whitespace-pre-wrap">
                {part}
              </div>
            );
          }
          // The second part is the language identifier, which we ignore for now
          return null;
        })}
      </div>
    );
};

export const ChatMessage: React.FC<{ 
    message: Message,
    onUpscale: (messageId: string, imageUrl: string) => void;
    onSuperResolve: (messageId: string, imageUrl:string) => void;
}> = ({ message, onUpscale, onSuperResolve }) => {
  const isUser = message.role === 'user';

  const handleDownload = (imageUrl: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    const mimeType = imageUrl.match(/data:(image\/[^;]+);/)?.[1] || 'image/png';
    const extension = mimeType.split('/')[1] || 'png';
    link.download = `chatbest-generated-image-${new Date().getTime()}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`flex items-start gap-4 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center ${
          isUser ? 'bg-gray-200 dark:bg-gray-600' : 'bg-indigo-500 text-white'
      }`}>
        {isUser ? <UserIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" /> : <ModelIcon className="w-5 h-5" />}
      </div>
      <div
        className={`max-w-2xl px-4 py-3 rounded-2xl ${
          isUser
            ? 'bg-indigo-500 text-white rounded-br-none'
            : 'bg-gray-100 dark:bg-gray-700 rounded-bl-none'
        }`}
      >
        {message.attachment && (
            <div className="mb-2">
                <img 
                    src={message.attachment.url} 
                    alt="User attachment" 
                    className="max-w-xs max-h-64 rounded-lg object-contain"
                />
            </div>
        )}

        {/* Model-specific content */}
        {!isUser && (
            <>
                {message.isLoading && <ImageLoadingSkeleton />}
                {message.error && <ImageError error={message.error} />}
                {message.generatedImage && (
                     <div className="relative group mb-2">
                        {message.isUpscaling && (
                            <div className="absolute inset-0 bg-black/50 rounded-lg flex flex-col items-center justify-center z-10">
                                <MaximizeIcon className="w-8 h-8 text-white animate-pulse" />
                                <p className="text-white text-sm mt-2">Upscaling...</p>
                            </div>
                        )}
                        {message.isSuperResolving && (
                            <div className="absolute inset-0 bg-black/50 rounded-lg flex flex-col items-center justify-center z-10">
                                <SparklesIcon className="w-8 h-8 text-white animate-pulse" />
                                <p className="text-white text-sm mt-2">Enhancing Detail...</p>
                            </div>
                        )}
                        <img 
                            src={message.generatedImage} 
                            alt="Generated by AI" 
                            className={`max-w-md max-h-96 rounded-lg object-contain ${message.isUpscaling || message.isSuperResolving ? 'blur-sm' : ''}`}
                        />
                         <div className="absolute bottom-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <button
                                onClick={() => onSuperResolve(message.id, message.generatedImage!)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-black/60 text-white rounded-lg text-xs font-medium hover:bg-black/80 backdrop-blur-sm disabled:cursor-not-allowed disabled:bg-black/30"
                                aria-label="Enhance Detail"
                                disabled={message.isUpscaling || message.isSuperResolving}
                            >
                                <SparklesIcon className="w-4 h-4" />
                                <span>Enhance Detail</span>
                            </button>
                            <button
                                onClick={() => onUpscale(message.id, message.generatedImage!)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-black/60 text-white rounded-lg text-xs font-medium hover:bg-black/80 backdrop-blur-sm disabled:cursor-not-allowed disabled:bg-black/30"
                                aria-label="Upscale"
                                disabled={message.isUpscaling || message.isSuperResolving}
                            >
                                <MaximizeIcon className="w-4 h-4" />
                                <span>Upscale</span>
                            </button>
                             <button
                                onClick={() => handleDownload(message.generatedImage!)}
                                className="p-2 bg-black/60 text-white rounded-lg hover:bg-black/80 backdrop-blur-sm disabled:cursor-not-allowed disabled:bg-black/30"
                                aria-label="Download image"
                                disabled={message.isUpscaling || message.isSuperResolving}
                            >
                                <DownloadIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </>
        )}
        
        {/* Text content for both user and model */}
        {message.content && <ContentRenderer content={message.content} />}

      </div>
    </div>
  );
};