import React, { useState, useRef, useEffect } from 'react';
import type { Message } from '../types';
import { UserIcon, ModelIcon, ImageIcon, DownloadIcon, SparklesIcon, MaximizeIcon, CopyIcon, CheckIcon, FileTextIcon, CrownIcon, VideoIcon, GifIcon, PPTXIcon, PencilIcon, XIcon, PlayCircleIcon } from './IconComponents';

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

const CodeBlock: React.FC<{ code: string, language?: string }> = ({ code, language = 'code' }) => {
    const [copied, setCopied] = useState(false);
  
    const handleCopy = () => {
      navigator.clipboard.writeText(code).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(err => {
        console.error('Failed to copy code: ', err);
      });
    };

    const handleDownload = () => {
        const extensions: Record<string, string> = {
            'html': 'html', 'htm': 'html', 'javascript': 'js', 'js': 'js',
            'css': 'css', 'python': 'py', 'py': 'py', 'typescript': 'ts',
            'ts': 'ts', 'jsx': 'jsx', 'tsx': 'tsx', 'json': 'json', 'bash': 'sh', 'sh': 'sh'
        };
        const langKey = language.toLowerCase();
        const ext = extensions[langKey] || 'txt';
        const blob = new Blob([code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `chatbest-${new Date().getTime()}.${ext}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 100);
    };

    const handleRun = () => {
        const lang = language.toLowerCase();
        const trimmedCode = code.trim();
        let finalHtml = '';

        // Determine how to wrap the code based on its content or detected language
        if (trimmedCode.toLowerCase().startsWith('<!doctype html') || trimmedCode.toLowerCase().startsWith('<html')) {
            finalHtml = code;
        } else if (lang === 'html' || lang === 'htm' || trimmedCode.startsWith('<')) {
            finalHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview - PH ChatBest</title>
    <style>
        body { font-family: -apple-system, system-ui, sans-serif; padding: 20px; margin: 0; line-height: 1.5; color: #333; }
        * { box-sizing: border-box; }
    </style>
</head>
<body>
    ${code}
</body>
</html>`;
        } else if (lang === 'js' || lang === 'javascript') {
            finalHtml = `<!DOCTYPE html>
<html>
<head>
    <title>JS Console - ChatBest</title>
    <style>
        body { background: #000; color: #00ff00; font-family: 'Courier New', monospace; padding: 20px; margin: 0; }
        #log { white-space: pre-wrap; word-break: break-all; }
        .err { color: #ff3333; }
    </style>
</head>
<body>
    <div id="log"></div>
    <script>
        const logDiv = document.getElementById('log');
        const oldLog = console.log;
        console.log = (...args) => {
            logDiv.innerText += args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') + '\\n';
            oldLog.apply(console, args);
        };
        window.onerror = (msg) => {
            logDiv.innerHTML += '<span class="err">Error: ' + msg + '</span>\\n';
        };
        try {
            console.log("Output:");
            ${code}
        } catch (e) {
            console.log("Runtime Error: " + e.message);
        }
    </script>
</body>
</html>`;
        } else if (lang === 'css') {
            finalHtml = `<!DOCTYPE html><html><head><style>${code}</style></head><body style="padding:20px;"><h1>CSS Preview</h1><p>Testing styles on this paragraph.</p><button style="padding:8px 16px;">Test Button</button></body></html>`;
        }

        if (finalHtml) {
            const win = window.open('', '_blank');
            if (win) {
                win.document.open();
                win.document.write(finalHtml);
                win.document.close();
            } else {
                alert("Popup blocked! Please enable popups for this site to see the code execution.");
            }
        }
    };

    const isRunnable = ['html', 'htm', 'js', 'javascript', 'css'].includes(language.toLowerCase()) || 
                       (code.trim().startsWith('<') && !code.trim().startsWith('<!'));
  
    return (
      <div className="bg-[#1e1e1e] rounded-xl my-4 overflow-hidden border border-gray-700 shadow-xl group/code">
        <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-gray-700">
            <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                </div>
                <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">{language}</span>
            </div>
            <div className="flex items-center gap-4">
                <button onClick={handleCopy} className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 hover:text-white transition-colors">
                  {copied ? <><CheckIcon className="w-3.5 h-3.5 text-green-400" /><span>COPIED</span></> : <><CopyIcon className="w-3.5 h-3.5" /><span>COPY</span></>}
                </button>
                <button onClick={handleDownload} className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 hover:text-white transition-colors">
                    <DownloadIcon className="w-3.5 h-3.5" />
                    <span>DOWNLOAD</span>
                </button>
                {isRunnable && (
                    <>
                        <div className="w-[1px] h-3 bg-gray-600"></div>
                        <button onClick={handleRun} className="flex items-center gap-1.5 text-[11px] font-black text-indigo-400 hover:text-indigo-300 transition-colors">
                            <PlayCircleIcon className="w-3.5 h-3.5" />
                            <span>RUN</span>
                        </button>
                    </>
                )}
            </div>
        </div>
        <pre className="p-4 overflow-x-auto text-sm text-gray-300 font-mono leading-relaxed bg-[#1e1e1e] scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          <code className="block w-full">{code}</code>
        </pre>
      </div>
    );
};

const ContentRenderer: React.FC<{ content: string }> = ({ content }) => {
    // Advanced split logic to handle text and multiple code blocks accurately
    const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
        if (match.index > lastIndex) {
            parts.push({ type: 'text', content: content.slice(lastIndex, match.index) });
        }
        parts.push({ type: 'code', language: match[1] || 'code', code: match[2] });
        lastIndex = codeBlockRegex.lastIndex;
    }
    
    if (lastIndex < content.length) {
        parts.push({ type: 'text', content: content.slice(lastIndex) });
    }
  
    return (
      <div className="max-w-none break-words space-y-2">
        {parts.map((part, index) => (
            part.type === 'code' 
            ? <CodeBlock key={index} code={part.code.trim()} language={part.language} />
            : <div key={index} className="whitespace-pre-wrap">{part.content}</div>
        ))}
      </div>
    );
};

export const ChatMessage: React.FC<{ 
    message: Message,
    onUpscale: (messageId: string, imageUrl: string) => void;
    onSuperResolve: (messageId: string, imageUrl:string) => void;
    onUpdateMessage?: (messageId: string, newContent: string) => void;
}> = ({ message, onUpscale, onSuperResolve, onUpdateMessage }) => {
  const isUser = message.role === 'user';
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const menuRef = useRef<HTMLDivElement>(null);
  const editRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsDownloadMenuOpen(false);
      }
    };
    if (isDownloadMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDownloadMenuOpen]);

  useEffect(() => {
    if (isEditing && editRef.current) {
        editRef.current.focus();
        editRef.current.setSelectionRange(editRef.current.value.length, editRef.current.value.length);
    }
  }, [isEditing]);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownloadMessagePDF = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const title = isUser ? 'Prompt' : 'Response';
      printWindow.document.write(`
        <html><head><title>ChatBest - ${title}</title><style>body{font-family:sans-serif;padding:40px;line-height:1.6;}h2{color:#6366f1;border-bottom:1px solid #ddd;padding-bottom:8px;}.box{background:#f9f9f9;padding:20px;border-radius:10px;white-space:pre-wrap;}</style></head>
        <body><h2>${title}</h2><div class="box">${message.content}</div></body></html>
      `);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 300);
    }
  };

  const handleSaveEdit = () => {
    if (onUpdateMessage && editContent.trim() !== "") {
        onUpdateMessage(message.id, editContent);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  return (
    <div className={`flex items-start gap-4 group/msg ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center shadow-md ${
          isUser ? 'bg-gray-200 dark:bg-gray-600' : 'bg-indigo-500 text-white'
      }`}>
        {isUser ? <UserIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" /> : <ModelIcon className="w-5 h-5" />}
      </div>
      <div className="flex flex-col gap-1 max-w-2xl">
        <div className={`px-4 py-3 rounded-2xl relative transition-all duration-200 shadow-sm ${
            isEditing ? 'ring-2 ring-indigo-400 bg-white dark:bg-gray-800'
            : isUser ? 'bg-indigo-500 text-white rounded-br-none'
            : 'bg-gray-100 dark:bg-gray-700 rounded-bl-none border border-gray-200 dark:border-gray-600'
        }`}>
            {!isUser && message.generatedImage && (
                <div className="mb-3 relative group/img rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-lg">
                    <img src={message.generatedImage} alt="AI output" className="max-w-md max-h-[500px] object-contain" />
                    <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 group-hover/img:opacity-100 transition-opacity">
                         <button onClick={() => onSuperResolve(message.id, message.generatedImage!)} className="p-2 bg-black/50 text-white rounded-lg hover:bg-black/80 backdrop-blur-sm" title="Enhance Detail"><SparklesIcon className="w-4 h-4" /></button>
                         <button onClick={() => onUpscale(message.id, message.generatedImage!)} className="p-2 bg-black/50 text-white rounded-lg hover:bg-black/80 backdrop-blur-sm" title="Upscale"><MaximizeIcon className="w-4 h-4" /></button>
                    </div>
                </div>
            )}
            
            {isEditing ? (
                <div className="flex flex-col gap-3 min-w-[320px]">
                    <textarea ref={editRef} value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full bg-transparent text-gray-800 dark:text-gray-200 focus:outline-none resize-none min-h-[100px]" />
                    <div className="flex justify-end gap-2 border-t pt-2 dark:border-gray-700">
                        <button onClick={handleCancelEdit} className="px-3 py-1 text-xs font-bold uppercase text-gray-500 hover:bg-gray-100 rounded-md">Cancel</button>
                        <button onClick={handleSaveEdit} className="px-3 py-1 text-xs font-bold uppercase bg-indigo-500 text-white hover:bg-indigo-600 rounded-md">Save</button>
                    </div>
                </div>
            ) : (
                <ContentRenderer content={message.content} />
            )}
        </div>
        
        {!isEditing && (
            <div className={`flex items-center gap-1.5 mt-1 opacity-0 group-hover/msg:opacity-100 transition-opacity ${isUser ? 'justify-end' : 'justify-start'}`}>
                {isUser && (
                    <button onClick={() => setIsEditing(true)} className="p-1.5 rounded-md text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20" title="Edit">
                        <PencilIcon className="w-3.5 h-3.5" /><span className="text-[10px] font-bold uppercase">Edit</span>
                    </button>
                )}
                <button onClick={handleCopyMessage} className="p-1.5 rounded-md text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all flex items-center gap-1">
                    {copied ? <CheckIcon className="w-3.5 h-3.5 text-green-500" /> : <CopyIcon className="w-3.5 h-3.5" />}
                    <span className="text-[10px] font-bold uppercase">{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button onClick={handleDownloadMessagePDF} className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex items-center gap-1">
                    <FileTextIcon className="w-3.5 h-3.5" /><span className="text-[10px] font-bold uppercase">PDF</span>
                </button>
            </div>
        )}
      </div>
    </div>
  );
};
