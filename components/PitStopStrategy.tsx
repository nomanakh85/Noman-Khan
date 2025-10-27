
import { GoogleGenAI } from '@google/genai';
import React, { useState } from 'react';

const PitStopStrategy: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('Tires are losing grip, 10 laps to go. Should I pit for softs?');
  const [advice, setAdvice] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getAdvice = async () => {
    if (!prompt) {
      setError('Please ask a question.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setAdvice('');
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const systemInstruction = "You are an expert F1 race strategist. Provide quick, decisive, and concise answers to strategic questions. Use no more than 50 words.";
      
      const response = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: prompt,
        config: { systemInstruction: systemInstruction },
      });
      
      setAdvice(response.text);
    } catch (e) {
      const error = e as Error;
      setError(`Failed to get advice: ${error.message}`);
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-race-dark-200 p-6 rounded-lg shadow-2xl">
      <h1 className="text-3xl font-bold text-race-green mb-4">Pit Stop Strategy</h1>
      <p className="text-race-light mb-6">Get instant, low-latency strategic advice from your AI race engineer. Perfect for split-second decisions.</p>
      
      <div className="flex flex-col space-y-4 mb-6">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask a strategic question..."
          className="w-full p-3 bg-race-dark-300 border-2 border-race-dark-300 rounded-lg focus:outline-none focus:border-race-green transition-colors text-race-light resize-none"
          rows={3}
        />
        <button
          onClick={getAdvice}
          disabled={isLoading}
          className="bg-race-green text-race-dark font-bold py-3 px-6 rounded-lg hover:bg-white disabled:bg-race-dark-300 disabled:cursor-not-allowed transition-colors duration-300"
        >
          {isLoading ? 'Thinking...' : 'Get Instant Advice'}
        </button>
      </div>

      {error && <p className="text-red-500 bg-red-900/50 p-3 rounded-lg">{error}</p>}
      
      <div className="flex-1 bg-black/30 rounded-lg p-4 overflow-y-auto">
        <h2 className="text-xl font-bold text-race-green mb-2">Engineer's Call:</h2>
        {isLoading ? (
            <div className="animate-pulse space-y-2">
                <div className="h-4 bg-race-dark-300 rounded w-full"></div>
                <div className="h-4 bg-race-dark-300 rounded w-2/3"></div>
            </div>
        ) : advice ? (
          <p className="text-race-light whitespace-pre-wrap">{advice}</p>
        ) : (
          <p className="text-race-light/50">Strategic advice will appear here.</p>
        )}
      </div>
    </div>
  );
};

export default PitStopStrategy;
