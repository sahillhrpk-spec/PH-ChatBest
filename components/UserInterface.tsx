import React, { useState, useMemo, useCallback } from 'react';
import type { Conversation, Message, User } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { generateUUID } from '../utils/uuid';
import { Sidebar } from './Sidebar';
import { ChatView } from './ChatView';
import { WelcomeScreen } from './WelcomeScreen';
import { AdminPanel } from './AdminPanel';
import { PaymentPlans } from './PaymentPlans';

type View = 'chat' | 'adminPanel' | 'paymentPlans';

interface UserInterfaceProps {
    currentUser: User;
    onLogout: () => void;
}

export const UserInterface: React.FC<UserInterfaceProps> = ({ currentUser, onLogout }) => {
  const conversationKey = useMemo(() => `chat-conversations-${currentUser.email}`, [currentUser]);
  const [conversations, setConversations] = useLocalStorage<Conversation[]>(conversationKey, []);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<View>('chat');

  const handleNewChat = useCallback(() => {
    const newConversation: Conversation = {
      id: generateUUID(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date().toISOString(),
    };
    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversationId(newConversation.id);
    setActiveView('chat');
  }, [setConversations]);

  const handleSelectConversation = useCallback((id: string) => {
    setCurrentConversationId(id);
    setActiveView('chat');
  }, []);
  
  const handleDeleteConversation = useCallback((id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (currentConversationId === id) {
      setCurrentConversationId(null);
    }
  }, [currentConversationId, setConversations]);
  
  const handleSelectView = useCallback((view: View) => {
    setActiveView(view);
    if (view !== 'chat') {
        setCurrentConversationId(null);
    }
  }, []);

  const updateConversation = useCallback((id: string, updatedMessages: Message[], title?: string) => {
    setConversations(prev =>
      prev.map(c => {
        if (c.id === id) {
          const newTitle = title || (c.title === 'New Chat' && updatedMessages.length > 0 ? updatedMessages[0].content.substring(0, 40) + '...' : c.title);
          return { ...c, messages: updatedMessages, title: newTitle };
        }
        return c;
      })
    );
  }, [setConversations]);
  
  const currentConversation = useMemo(() => {
    return conversations.find(c => c.id === currentConversationId) || null;
  }, [conversations, currentConversationId]);

  const renderMainContent = () => {
    switch(activeView) {
        case 'adminPanel':
            return <AdminPanel conversations={conversations} onDeleteConversation={handleDeleteConversation} onLogout={onLogout} />;
        case 'paymentPlans':
            return <PaymentPlans />;
        case 'chat':
        default:
            if (currentConversation) {
                return (
                    <ChatView
                    key={currentConversation.id}
                    conversation={currentConversation}
                    onMessagesChange={updateConversation}
                    />
                );
            }
            return <WelcomeScreen onNewChat={handleNewChat} />;
    }
  }

  return (
    <div className="flex h-screen w-full text-gray-800 dark:text-gray-200 antialiased">
      <Sidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
        activeView={activeView}
        onSelectView={handleSelectView}
        currentUser={currentUser}
        onLogout={onLogout}
      />
      <main className="flex-1 flex flex-col bg-white dark:bg-gray-800">
        {renderMainContent()}
      </main>
    </div>
  );
};