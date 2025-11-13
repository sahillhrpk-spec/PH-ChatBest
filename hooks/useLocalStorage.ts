import { useState, useEffect, Dispatch, SetStateAction } from 'react';
import type { Conversation } from '../types';

// A helper function to read the initial value from localStorage safely.
function getInitialValue<T>(key: string, initialValue: T | (() => T)): T {
  // Prevents SSR errors
  if (typeof window === 'undefined') {
    return initialValue instanceof Function ? initialValue() : initialValue;
  }
  try {
    const item = window.localStorage.getItem(key);
    // Parse stored json or if none, return initialValue
    return item ? JSON.parse(item) : (initialValue instanceof Function ? initialValue() : initialValue);
  } catch (error) {
    console.warn(`Error reading localStorage key “${key}”:`, error);
    return initialValue instanceof Function ? initialValue() : initialValue;
  }
}


export function useLocalStorage<T>(
  key: string,
  initialValue: T | (() => T)
): [T, Dispatch<SetStateAction<T>>] {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [value, setValue] = useState<T>(() => {
    return getInitialValue(key, initialValue);
  });

  // FIX: Re-initialize the state if the key changes.
  // This is essential for when the user logs in or out, which changes
  // the conversation storage key.
  useEffect(() => {
    setValue(getInitialValue(key, initialValue));
  }, [key]);


  // Use useEffect to update localStorage and handle side effects when the state changes
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        let valueToStore = value;

        // FIX: If storing conversations, strip out bulky image data (base64) 
        // to prevent exceeding localStorage quota. Images will be gone on reload,
        // but the app won't crash.
        if (key.startsWith('chat-conversations') && Array.isArray(value)) {
          // Deep copy to avoid mutating the React state itself.
          const conversationsToStore: Conversation[] = JSON.parse(JSON.stringify(value));
          
          conversationsToStore.forEach(convo => {
            if (convo.messages && Array.isArray(convo.messages)) {
              convo.messages.forEach((message: any) => {
                // Remove the large base64 data URLs before storing.
                delete message.attachment;
                delete message.generatedImage;
              });
            }
          });
          valueToStore = conversationsToStore as T;
        }

        // Persist the potentially modified value to localStorage
        window.localStorage.setItem(key, JSON.stringify(valueToStore));

        // SIDE-EFFECT: If this is the theme hook, update the DOM class.
        // This centralizes the logic and removes the need for a separate useEffect in App.tsx.
        if (key === 'chat-theme') {
          document.documentElement.classList.toggle('dark', value === 'dark');
        }
      }
    } catch (error) {
      console.error(`Error in useLocalStorage effect for key “${key}”:`, error);
       if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
          // Notify the user if storage is still full, e.g., from too much text.
          alert('Could not save conversation history: Storage quota exceeded. Please clear some old conversations to make space.');
      }
    }
  }, [key, value]);

  return [value, setValue];
}
