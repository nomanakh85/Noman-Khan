
import { GoogleGenAI, Chat } from '@google/genai';
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';

const RaceEngineerChat: React.FC = () => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initChat = () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const newChat = ai.chats.create({
          model: 'gemini-2.5-flash',
          config: {
            systemInstruction: 'You are a friendly and knowledgeable Formula 1 race engineer. Your goal is to help your driver understand the car, strategy, and race conditions. Provide detailed but easy-to-understand explanations.',
          },
        });
        setChat(newChat);
      } catch (e) {
          setError("Failed to initialize chat. Check API key and configuration.");
          console.error(e);
      }
    };
    initChat();
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [history]);

  const sendMessage = async () => {
    if (!userInput.trim() || !chat || isLoading) return;

    const text = userInput;
    setUserInput('');
    setIsLoading(true);
    setError(null);
    
    setHistory(prev => [...prev, { role: 'user', parts: [{ text }] }]);

    try {
      const result = await chat.sendMessage({ message: text });
      setHistory(prev => [...prev, { role: 'model', parts: [{ text: result.text }] }]);
    } catch (e) {
      const error = e as Error;
      setError(`Failed to get response: ${error.message}`);
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-race-dark-200 p-6 rounded-lg shadow-2xl">
      <h1 className="text-3xl font-bold text-race-green mb-4">Race Engineer Chat</h1>
      <p className="text-race-light mb-6">Have a conversation with your AI race engineer. Ask about car setup, tire degradation, or race strategy.</p>
      
      <div ref={chatContainerRef} className="flex-1 bg-black/30 rounded-lg p-4 overflow-y-auto space-y-4 mb-4">
        {history.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-md p-3 rounded-lg ${msg.role === 'user' ? 'bg-race-green text-race-dark' : 'bg-race-dark-300 text-race-light'}`}>
              <p className="whitespace-pre-wrap">{msg.parts[0].text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex justify-start">
                <div className="max-w-md p-3 rounded-lg bg-race-dark-300 text-race-light">
                    <div className="animate-pulse flex space-x-2">
                        <div className="rounded-full bg-race-dark h-3 w-3"></div>
                        <div className="rounded-full bg-race-dark h-3 w-3"></div>
                        <div className="rounded-full bg-race-dark h-3 w-3"></div>
                    </div>
                </div>
            </div>
        )}
      </div>
      
      {error && <p className="text-red-500 bg-red-900/50 p-3 rounded-lg mb-4">{error}</p>}

      <div className="flex space-x-4">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type your message..."
          className="flex-1 p-3 bg-race-dark-300 border-2 border-race-dark-300 rounded-lg focus:outline-none focus:border-race-green transition-colors text-race-light"
          disabled={isLoading}
        />
        <button
          onClick={sendMessage}
          disabled={isLoading || !userInput.trim()}
          className="bg-race-green text-race-dark font-bold py-3 px-6 rounded-lg hover:bg-white disabled:bg-race-dark-300 disabled:cursor-not-allowed transition-colors duration-300"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default RaceEngineerChat;
