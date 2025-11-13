import React, { useState, useEffect } from 'react';
import { LogoIcon, GoogleIcon, ShieldIcon, AppleIcon, EyeIcon, EyeOffIcon } from './IconComponents';
import type { User } from '../types';

interface LoginScreenProps {
  onLogin: (user: User) => void;
  registeredUsers: User[];
  onRegisterUser: (user: User) => void;
}

// SECURE: These are the exclusive admin credentials.
// For a production application, these should be managed via a secure backend system.
const ADMIN_EMAIL = "master-admin@phchatbest.io";
const ADMIN_PASSWORD = "admin"; // Simplified for ease of use

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, registeredUsers, onRegisterUser }) => {
  type LoginView = 'user' | 'google' | 'admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(true);
  const [viewMode, setViewMode] = useState<LoginView>('user');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const loginMode = sessionStorage.getItem('login_mode');
    if (loginMode === 'admin') {
      setViewMode('admin');
      sessionStorage.removeItem('login_mode');
    }
  }, []);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setError('');
    setShowPassword(false);
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password) {
        setError("Please enter a password.");
        return;
    }
    if (isSignUp && password.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
    }
    
    const existingUser = registeredUsers.find(user => user.email === email);

    if (isSignUp) {
      if (existingUser) {
        setError('This email is already registered. Please sign in.');
      } else {
        const newUser: User = { email, password, role: 'user' };
        onRegisterUser(newUser);
        onLogin(newUser);
      }
    } else { // isSignIn
      if (existingUser) {
        if (existingUser.password === password) {
            onLogin({ email, role: 'user' });
        } else {
            setError("Incorrect password. Please try again.");
        }
      } else {
        setError('No account found with this email. Please sign up.');
      }
    }
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      onLogin({ email, role: 'admin' });
    } else {
      setError("Invalid admin credentials.");
    }
  };

  const handleGoogleLoginClick = () => {
    setViewMode('google');
    resetForm();
  };

  const handleGoogleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (email === ADMIN_EMAIL) {
        setError("Admin login is only available with email and password.");
        return;
    }

    const googleUser: User = { email, password: 'google_mock_password', role: 'user' };
    const userExists = registeredUsers.some(u => u.email === email);
    
    if (!userExists) {
      onRegisterUser(googleUser);
    }
    onLogin(googleUser);
  };

  const handleAppleLogin = () => {
    const appleUser: User = { email: 'user@apple.com', password: 'apple_mock_password', role: 'user' };
    const userExists = registeredUsers.some(user => user.email === appleUser.email);
    
    if (!userExists) {
      onRegisterUser(appleUser);
    }
    onLogin(appleUser);
  };
  
  const toggleUserMode = () => {
    setIsSignUp(!isSignUp);
    resetForm();
  };
  
  if (viewMode === 'google') {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-full bg-gray-50 dark:bg-gray-900 text-center p-8">
        <div className="bg-white dark:bg-gray-800 p-10 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 max-w-md w-full">
          <GoogleIcon className="w-12 h-12 text-gray-700 dark:text-gray-200 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-gray-100">
            Sign in with Google
          </h1>
          <p className="text-md text-gray-500 dark:text-gray-400 mb-8">
            Enter your Google email to continue.
          </p>
  
          <form onSubmit={handleGoogleEmailSubmit} className="space-y-4">
            <div>
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email or phone"
                className="w-full px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-gray-200"
                aria-label="Email Address"
                required
                autoFocus
              />
            </div>
            
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            
            <div className="flex items-center justify-between pt-2">
                <button 
                    type="button" 
                    onClick={() => { setViewMode('user'); resetForm(); }}
                    className="font-semibold text-indigo-500 hover:text-indigo-400 focus:outline-none text-sm"
                >
                    Back to options
                </button>
                <button
                    type="submit"
                    className="px-6 py-2.5 text-md font-semibold rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/50"
                >
                    Next
                </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (viewMode === 'admin') {
     return (
        <div className="flex flex-col items-center justify-center h-screen w-full bg-gray-50 dark:bg-gray-900 text-center p-8">
            <div className="bg-white dark:bg-gray-800 p-10 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 max-w-md w-full">
                <ShieldIcon className="w-16 h-16 text-indigo-500 mx-auto mb-4" />
                <h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-gray-100">Administrator Login</h1>
                <p className="text-md text-gray-500 dark:text-gray-400 mb-8">Enter your admin credentials to continue.</p>

                <form onSubmit={handleAdminSubmit} className="space-y-4">
                    <div>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Admin Email"
                            className="w-full px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-gray-200"
                            aria-label="Admin Email Address"
                            required
                        />
                    </div>
                    <div className="relative">
                      <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Password"
                          className="w-full px-4 py-3 pr-12 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-gray-200"
                          aria-label="Admin Password"
                          required
                      />
                      <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                          {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                      </button>
                    </div>

                    {error && <p className="text-red-500 text-sm mt-2 text-left">{error}</p>}

                    <button
                        type="submit"
                        className="w-full flex items-center justify-center gap-3 px-6 py-3 text-lg font-semibold rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/50"
                    >
                        Login as Admin
                    </button>
                </form>

                <p className="text-sm text-gray-500 dark:text-gray-400 mt-6">
                    Not an admin?{' '}
                    <button onClick={() => { setViewMode('user'); resetForm(); }} className="font-semibold text-indigo-500 hover:text-indigo-400 focus:outline-none">
                        Go back to user login.
                    </button>
                </p>
            </div>
        </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen w-full bg-gray-50 dark:bg-gray-900 text-center p-8">
      <div className="bg-white dark:bg-gray-800 p-10 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 max-w-md w-full">
        <LogoIcon className="w-20 h-20 text-indigo-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-gray-100">
          {isSignUp ? 'Create your account' : 'Welcome back'}
        </h1>
        <p className="text-md text-gray-500 dark:text-gray-400 mb-8">
          {isSignUp ? 'Get started with your AI assistant.' : 'Sign in to continue.'}
        </p>
        
        <div className="space-y-4">
            <button
                onClick={handleGoogleLoginClick}
                type="button"
                className="w-full flex items-center justify-center gap-3 px-6 py-3 text-md font-semibold rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/50 transform hover:scale-105"
            >
                <GoogleIcon className="w-5 h-5" />
                Continue with Google
            </button>
            <button
                onClick={handleAppleLogin}
                type="button"
                className="w-full flex items-center justify-center gap-3 px-6 py-3 text-md font-semibold rounded-lg bg-black text-white dark:bg-white dark:text-black border border-gray-300 dark:border-gray-600 hover:opacity-90 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/50 transform hover:scale-105"
            >
                <AppleIcon className="w-5 h-5" />
                Continue with Apple
            </button>
        </div>

        <div className="flex items-center my-6">
            <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
            <span className="flex-shrink mx-4 text-gray-400 dark:text-gray-500 text-sm font-semibold">OR</span>
            <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
        </div>

        <form onSubmit={handleUserSubmit} className="space-y-4">
          <div>
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-gray-200"
              aria-label="Email Address"
              required
            />
          </div>
          <div className="relative">
            <input 
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-3 pr-12 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-gray-200"
              aria-label="Password"
              required
            />
             <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                aria-label={showPassword ? "Hide password" : "Show password"}
            >
                {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
            </button>
          </div>
          
          {error && <p className="text-red-500 text-sm mt-2 text-left">{error}</p>}
          
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-3 px-6 py-3 text-lg font-semibold rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/50 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!email || !password}
          >
            {isSignUp ? 'Sign up with Email' : 'Sign in'}
          </button>
        </form>
        
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-6">
            {isSignUp ? 'Already have an account? ' : 'Don’t have an account? '}
            <button onClick={toggleUserMode} className="font-semibold text-indigo-500 hover:text-indigo-400 focus:outline-none">
                {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
        </p>

        <div className="border-t border-gray-200 dark:border-gray-700 mt-6 pt-4">
           <button onClick={() => { setViewMode('admin'); resetForm(); }} className="text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 focus:outline-none w-full text-center">
              Admin Login
           </button>
        </div>
      </div>
    </div>
  );
};