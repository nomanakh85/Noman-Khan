
import React, { useState, useEffect, useCallback } from 'react';

// Custom hook to manage API key state
export const useApiKey = () => {
  const [isKeySelected, setIsKeySelected] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const checkKey = useCallback(async () => {
    if (window.aistudio) {
      setIsChecking(true);
      const hasKey = await window.aistudio.hasSelectedApiKey();
      setIsKeySelected(hasKey);
      setIsChecking(false);
    } else {
        // aistudio might not be available in all environments
        setIsChecking(false);
        setIsKeySelected(false);
    }
  }, []);

  useEffect(() => {
    checkKey();
    window.addEventListener('focus', checkKey);
    return () => {
      window.removeEventListener('focus', checkKey);
    };
  }, [checkKey]);

  const selectKey = async () => {
    if (window.aistudio) {
        try {
            await window.aistudio.openSelectKey();
            // Assume selection is successful to avoid race condition
            setIsKeySelected(true); 
        } catch (e) {
            console.error("Error opening API key selection:", e);
        }
    } else {
        alert("API key selection is not available in this environment.");
    }
  };

  return { isKeySelected, selectKey, isChecking, checkKey };
};

interface ApiKeySelectorProps {
  children: React.ReactNode;
}

// Component to wrap features that require an API key
export const ApiKeySelector: React.FC<ApiKeySelectorProps> = ({ children }) => {
  const { isKeySelected, selectKey, isChecking } = useApiKey();

  if (isChecking) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-race-dark-200 p-8 rounded-lg">
        <p className="text-xl text-race-light">Checking for API Key...</p>
      </div>
    );
  }

  if (!isKeySelected) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-race-dark-200 p-8 rounded-lg border-2 border-race-green/50">
        <h2 className="text-2xl font-bold text-race-green mb-4">API Key Required</h2>
        <p className="text-center text-race-light mb-6">
          This feature requires a Google AI API key. Please select a key to proceed.
          <br />
          For more information on billing, visit{' '}
          <a
            href="https://ai.google.dev/gemini-api/docs/billing"
            target="_blank"
            rel="noopener noreferrer"
            className="text-race-green underline hover:text-white"
          >
            ai.google.dev/gemini-api/docs/billing
          </a>.
        </p>
        <button
          onClick={selectKey}
          className="bg-race-green text-race-dark font-bold py-3 px-6 rounded-lg hover:bg-white transition-colors duration-300"
        >
          Select API Key
        </button>
      </div>
    );
  }

  return <>{children}</>;
};
