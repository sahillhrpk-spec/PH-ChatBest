import React, { useState } from 'react';
import type { Conversation, User } from '../types';
import { PlusIcon, LogoIcon, MessageIcon, TrashIcon, ShieldIcon, LogoutIcon, AppleIcon, CreditCardIcon } from './IconComponents';
import { ThemeToggle } from './ThemeToggle';

type View = 'chat' | 'adminPanel' | 'paymentPlans';

interface SidebarProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  activeView: View;
  onSelectView: (view: View) => void;
  currentUser: User | null;
  onLogout: () => void;
}

const UserProfile: React.FC<{ user: User; onLogout: () => void }> = ({ user, onLogout }) => (
    <div className="flex items-center justify-between p-2 mb-2">
        <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-semibold truncate text-gray-800 dark:text-gray-100">{user.email}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">Signed In</span>
        </div>
        <button
            onClick={onLogout}
            className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            aria-label="Logout"
        >
            <LogoutIcon className="w-5 h-5" />
        </button>
    </div>
);


export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  currentConversationId,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  activeView,
  onSelectView,
  currentUser,
  onLogout,
}) => {
  return (
    <aside className="w-64 flex-shrink-0 bg-gray-50 dark:bg-gray-900 flex flex-col p-2 border-r border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between p-2 mb-2">
         <div className="flex items-center gap-2">
            <LogoIcon className="w-8 h-8 text-indigo-500" />
            <h1 className="text-lg font-bold">PH ChatBest </h1>
        </div>
      </div>
      <button
        onClick={onNewChat}
        className="flex items-center gap-2 w-full p-2 mb-4 text-sm font-semibold rounded-md bg-indigo-500 text-white hover:bg-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <PlusIcon className="w-5 h-5" />
        New Chat
      </button>

      <div className="flex-1 overflow-y-auto pr-1">
        <nav className="flex flex-col gap-1">
          {conversations.map((convo) => (
            <ConversationItem
              key={convo.id}
              conversation={convo}
              isSelected={currentConversationId === convo.id && activeView === 'chat'}
              onSelect={() => onSelectConversation(convo.id)}
              onDelete={() => onDeleteConversation(convo.id)}
            />
          ))}
        </nav>
      </div>

      <div className="mt-auto border-t border-gray-200 dark:border-gray-700 pt-2">
         {currentUser && <UserProfile user={currentUser} onLogout={onLogout} />}
         <div className="px-2 mb-2">
            <a 
                href="https://www.chatbest.com"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2 p-2 text-sm rounded-md transition-colors hover:bg-gray-200 dark:hover:bg-gray-800"
                aria-label="Download PH ChatBest for iOS"
            >
                <AppleIcon className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200" />
                <span className="font-medium text-gray-700 dark:text-gray-300">PH ChatBest for iOS</span>
            </a>
        </div>
         <div className="flex items-center gap-2 px-2">
            <ThemeToggle />
            <button
                onClick={() => onSelectView('paymentPlans')}
                className={`flex items-center justify-center p-2 rounded-md transition-colors ${
                    activeView === 'paymentPlans'
                    ? 'bg-indigo-500 text-white' 
                    : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                aria-label="Subscription Plans"
            >
                <CreditCardIcon className={`w-5 h-5 ${activeView === 'paymentPlans' ? '' : 'text-gray-600 dark:text-gray-300'}`} />
            </button>
            <button
                onClick={() => onSelectView('adminPanel')}
                className={`flex items-center justify-center p-2 rounded-md transition-colors ${
                    activeView === 'adminPanel'
                    ? 'bg-indigo-500 text-white' 
                    : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                aria-label="Toggle Admin Panel"
            >
                <ShieldIcon className={`w-5 h-5 ${activeView === 'adminPanel' ? '' : 'text-gray-600 dark:text-gray-300'}`} />
            </button>
        </div>
      </div>
    </aside>
  );
};


const ConversationItem: React.FC<{
  conversation: Conversation,
  isSelected: boolean,
  onSelect: () => void,
  onDelete: () => void
}> = ({ conversation, isSelected, onSelect, onDelete }) => {
  const [hovered, setHovered] = useState(false);
  
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };
  
  return (
    <a
      href="#"
      onClick={(e) => { e.preventDefault(); onSelect(); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`group flex items-center justify-between p-2 text-sm rounded-md transition-colors ${
        isSelected ? 'bg-indigo-100 dark:bg-gray-700' : 'hover:bg-gray-200 dark:hover:bg-gray-800'
      }`}
    >
      <div className="flex items-center gap-2 overflow-hidden">
        <MessageIcon className="w-4 h-4 flex-shrink-0" />
        <span className="truncate">{conversation.title}</span>
      </div>
      {hovered && (
        <button onClick={handleDelete} className="p-1 rounded-md hover:bg-red-500/20 text-gray-500 hover:text-red-500">
          <TrashIcon className="w-4 h-4" />
        </button>
      )}
    </a>
  );
};
