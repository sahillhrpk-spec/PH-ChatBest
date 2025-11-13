import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Conversation, User } from '../types';
import { AdminPanel } from './AdminPanel';
import { LogoIcon, LogoutIcon } from './IconComponents';

interface AdminDashboardProps {
    currentUser: User;
    onLogout: () => void;
    registeredUsers: User[];
}

type AdminConversation = Conversation & { userEmail: string };

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser, onLogout, registeredUsers }) => {
    const [allConversations, setAllConversations] = useState<AdminConversation[]>([]);

    useEffect(() => {
        const allUsers = registeredUsers.filter(u => u.role !== 'admin');
        const loadedConversations: AdminConversation[] = [];
        
        allUsers.forEach(user => {
            const key = `chat-conversations-${user.email}`;
            try {
                const item = window.localStorage.getItem(key);
                if (item) {
                    const userConversations: Conversation[] = JSON.parse(item);
                    userConversations.forEach(convo => {
                        loadedConversations.push({ ...convo, userEmail: user.email });
                    });
                }
            } catch (error) {
                console.warn(`Could not load or parse conversations for ${user.email}`, error);
            }
        });
        
        setAllConversations(loadedConversations);
    }, [registeredUsers]);

    const handleDeleteConversation = useCallback((id: string) => {
        const convoToDelete = allConversations.find(c => c.id === id);
        if (!convoToDelete) return;

        const { userEmail } = convoToDelete;
        const key = `chat-conversations-${userEmail}`;

        try {
            const item = window.localStorage.getItem(key);
            if (item) {
                let userConversations: Conversation[] = JSON.parse(item);
                userConversations = userConversations.filter(c => c.id !== id);
                window.localStorage.setItem(key, JSON.stringify(userConversations));
                
                // Also update the local state to reflect the change immediately
                setAllConversations(prev => prev.filter(c => c.id !== id));
            }
        } catch (error) {
            console.error(`Failed to delete conversation for ${userEmail}`, error);
            alert('Failed to delete conversation.');
        }
    }, [allConversations]);


    return (
        <div className="flex h-screen w-full text-gray-800 dark:text-gray-200 antialiased bg-gray-100 dark:bg-gray-900">
            <div className="flex flex-col w-full">
                <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <LogoIcon className="w-8 h-8 text-indigo-500" />
                        <h1 className="text-xl font-bold">Admin Dashboard</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                           <p className="text-sm font-semibold">{currentUser.email}</p>
                           <p className="text-xs text-gray-500 dark:text-gray-400">Administrator</p>
                        </div>
                        <button
                            onClick={onLogout}
                            className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                            aria-label="Logout"
                        >
                            <LogoutIcon className="w-5 h-5" />
                        </button>
                    </div>
                </header>
                <main className="flex-1 overflow-hidden">
                    <AdminPanel 
                        conversations={allConversations}
                        onDeleteConversation={handleDeleteConversation}
                        showUserColumn={true}
                    />
                </main>
            </div>
        </div>
    );
};
