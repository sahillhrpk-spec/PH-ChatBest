
import React from 'react';
import { LogoIcon, PlusIcon } from './IconComponents';

interface WelcomeScreenProps {
  onNewChat: () => void;
}

const WelcomeCard: React.FC<{ title: string, description: string, onClick: () => void }> = ({ title, description, onClick }) => (
    <div
        onClick={onClick}
        className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
    >
        <h3 className="font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
    </div>
);


export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onNewChat }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <LogoIcon className="w-24 h-24 text-indigo-500 mb-4" />
      <h1 className="text-4xl font-bold mb-2 text-gray-800 dark:text-gray-100">PH ChatBest </h1>
      <p className="text-lg text-gray-500 dark:text-gray-400 mb-12">Your modern AI-powered chat assistant.</p>

      <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          <WelcomeCard 
              title="Start a new chat"
              description="Begin a fresh conversation with the AI."
              onClick={onNewChat}
          />
          <WelcomeCard 
              title="Creative Writing"
              description="Get help writing a story, poem, or script."
              onClick={onNewChat}
          />
           <WelcomeCard 
              title="Code Generation"
              description="Generate code snippets in any language."
              onClick={onNewChat}
          />
           <WelcomeCard 
              title="Brainstorm Ideas"
              description="Explore new ideas for a project or business."
              onClick={onNewChat}
          />
      </div>
      
      <button
        onClick={onNewChat}
        className="flex items-center gap-2 px-6 py-3 text-lg font-semibold rounded-full bg-indigo-500 text-white hover:bg-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <PlusIcon className="w-6 h-6" />
        Start New Chat
      </button>
    </div>
  );
};
