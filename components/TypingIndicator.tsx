
import React from 'react';
import { ModelIcon } from './IconComponents';

export const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-start gap-4">
      <div className="w-8 h-8 flex-shrink-0 rounded-full bg-indigo-500 flex items-center justify-center text-white">
        <ModelIcon className="w-5 h-5" />
      </div>
      <div className="max-w-2xl px-4 py-3 rounded-2xl bg-gray-100 dark:bg-gray-700 rounded-bl-none">
        <div className="flex items-center justify-center space-x-1">
          <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></div>
        </div>
      </div>
    </div>
  );
};
