import React, { useState, useCallback } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { useLocalStorage } from './hooks/useLocalStorage';
import type { User } from './types';
import { LoginScreen } from './components/LoginScreen';
import { AdminDashboard } from './components/AdminDashboard';
import { UserInterface } from './components/UserInterface';

const App: React.FC = () => {
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('chat-theme', () => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  });

  const [registeredUsers, setRegisteredUsers] = useLocalStorage<User[]>('chat-registered-users', []);
  const [currentUser, setCurrentUser] = useLocalStorage<User | null>('chat-user', null);

  const handleLogin = useCallback((user: User) => {
    setCurrentUser(user);
  }, [setCurrentUser]);

  const handleRegisterUser = useCallback((user: User) => {
    setRegisteredUsers(prev => {
      if (prev.some(u => u.email === user.email)) {
        return prev;
      }
      // NOTE: Storing plain text passwords in localStorage is highly insecure and
      // is done here for demonstration purposes only in a backend-less environment.
      // In a real application, passwords should be hashed and managed by a secure backend.
      return [...prev, user];
    });
  }, [setRegisteredUsers]);

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
  }, [setCurrentUser]);

  const renderContent = () => {
    if (!currentUser) {
      return (
        <LoginScreen 
          onLogin={handleLogin}
          registeredUsers={registeredUsers}
          onRegisterUser={handleRegisterUser}
        />
      );
    }

    if (currentUser.role === 'admin') {
      return (
        <AdminDashboard 
          currentUser={currentUser}
          onLogout={handleLogout}
          registeredUsers={registeredUsers}
        />
      );
    }

    return (
      <UserInterface
        currentUser={currentUser}
        onLogout={handleLogout}
      />
    );
  };

  return (
    <ThemeProvider value={{ theme, setTheme }}>
      {renderContent()}
    </ThemeProvider>
  );
};

export default App;