import React, { useMemo } from 'react';
import type { Conversation } from '../types';
import { MessageIcon, TrashIcon, UserIcon, ModelIcon, ShieldIcon } from './IconComponents';

interface AdminPanelProps {
    conversations: (Conversation & { userEmail?: string })[];
    onDeleteConversation: (id: string) => void;
    showUserColumn?: boolean;
    onLogout?: () => void;
}

const StatCard: React.FC<{ title: string; value: number | string; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 flex items-center gap-4">
        <div className="p-3 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-500 dark:text-indigo-400">
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
        </div>
    </div>
);

export const AdminPanel: React.FC<AdminPanelProps> = ({ conversations, onDeleteConversation, showUserColumn = false, onLogout }) => {
    
    const stats = useMemo(() => {
        const totalConversations = conversations.length;
        let userMessages = 0;
        let modelMessages = 0;

        conversations.forEach(convo => {
            convo.messages.forEach(msg => {
                if (msg.role === 'user') {
                    userMessages++;
                } else {
                    modelMessages++;
                }
            });
        });

        const totalMessages = userMessages + modelMessages;

        return { totalConversations, totalMessages, userMessages, modelMessages };
    }, [conversations]);

    const sortedConversations = useMemo(() => {
        return [...conversations].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [conversations]);
    
    const handleAdminLoginClick = () => {
        if (onLogout) {
            sessionStorage.setItem('login_mode', 'admin');
            onLogout();
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
            <header className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold">{showUserColumn ? 'Admin Panel' : 'My Activity'}</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {showUserColumn ? 'Application Overview & Management' : 'A summary of your conversations.'}
                    </p>
                </div>
                {!showUserColumn && onLogout && (
                    <button
                        onClick={handleAdminLoginClick}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md bg-indigo-500 text-white hover:bg-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        aria-label="Switch to Admin Login"
                    >
                        <ShieldIcon className="w-5 h-5" />
                        <span>Admin Login</span>
                    </button>
                )}
            </header>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Stats Section */}
                <section>
                    <h2 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">Statistics</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard title="Total Conversations" value={stats.totalConversations} icon={<MessageIcon className="w-6 h-6" />} />
                        <StatCard title="Total Messages" value={stats.totalMessages} icon={<MessageIcon className="w-6 h-6" />} />
                        <StatCard title="User Messages" value={stats.userMessages} icon={<UserIcon className="w-6 h-6" />} />
                        <StatCard title="Model Messages" value={stats.modelMessages} icon={<ModelIcon className="w-6 h-6" />} />
                    </div>
                </section>

                {/* Conversations Table Section */}
                <section>
                    <h2 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">All Conversations</h2>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-300">
                                    <tr>
                                        <th scope="col" className="px-6 py-3">Title</th>
                                        {showUserColumn && <th scope="col" className="px-6 py-3">User</th>}
                                        <th scope="col" className="px-6 py-3">Messages</th>
                                        <th scope="col" className="px-6 py-3">Created At</th>
                                        <th scope="col" className="px-6 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedConversations.length > 0 ? (
                                        sortedConversations.map(convo => (
                                            <tr key={convo.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600/30">
                                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white truncate max-w-sm">{convo.title}</td>
                                                {showUserColumn && <td className="px-6 py-4">{convo.userEmail}</td>}
                                                <td className="px-6 py-4">{convo.messages.length}</td>
                                                <td className="px-6 py-4">{new Date(convo.createdAt).toLocaleString()}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <button 
                                                        onClick={() => onDeleteConversation(convo.id)}
                                                        className="p-2 rounded-md hover:bg-red-500/20 text-gray-500 hover:text-red-500 transition-colors"
                                                        aria-label={`Delete conversation: ${convo.title}`}
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={showUserColumn ? 5 : 4} className="text-center py-8 text-gray-500 dark:text-gray-400">
                                                No conversations yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};