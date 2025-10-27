
import { GoogleGenAI } from '@google/genai';
import React, { useState } from 'react';
import { GroundingChunk } from '../types';

const RacingNews: React.FC = () => {
  const [query, setQuery] = useState<string>('Latest technical regulations in Formula 1 for this year');
  const [news, setNews] = useState<string>('');
  const [sources, setSources] = useState<GroundingChunk[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getNews = async () => {
    if (!query) {
      setError('Please enter a news query.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setNews('');
    setSources([]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: query,
        config: {
          tools: [{googleSearch: {}}],
        },
      });
      
      setNews(response.text);
      if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
        setSources(response.candidates[0].groundingMetadata.groundingChunks);
      }
    } catch (e) {
      const error = e as Error;
      setError(`Failed to fetch news: ${error.message}`);
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-race-dark-200 p-6 rounded-lg shadow-2xl">
      <h1 className="text-3xl font-bold text-race-green mb-4">Racing News Desk</h1>
      <p className="text-race-light mb-6">Get the latest, most accurate racing news and information, grounded with Google Search.</p>
      
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What's the latest in the racing world?"
          className="flex-1 p-3 bg-race-dark-300 border-2 border-race-dark-300 rounded-lg focus:outline-none focus:border-race-green transition-colors text-race-light"
        />
        <button
          onClick={getNews}
          disabled={isLoading}
          className="bg-race-green text-race-dark font-bold py-3 px-6 rounded-lg hover:bg-white disabled:bg-race-dark-300 disabled:cursor-not-allowed transition-colors duration-300"
        >
          {isLoading ? 'Searching...' : 'Get News'}
        </button>
      </div>

      {error && <p className="text-red-500 bg-red-900/50 p-3 rounded-lg">{error}</p>}
      
      <div className="flex-1 bg-black/30 rounded-lg p-4 overflow-y-auto">
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-race-dark-300 rounded w-full"></div>
            <div className="h-4 bg-race-dark-300 rounded w-5/6"></div>
            <div className="h-4 bg-race-dark-300 rounded w-3/4"></div>
          </div>
        ) : news ? (
            <>
                <p className="text-race-light whitespace-pre-wrap">{news}</p>
                {sources.length > 0 && (
                    <div className="mt-6 border-t-2 border-race-green/50 pt-4">
                        <h3 className="text-lg font-bold text-race-green mb-2">Sources:</h3>
                        <ul className="list-disc pl-5 space-y-1">
                            {sources.map((source, index) => source.web && (
                                <li key={index}>
                                    <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-race-light underline hover:text-race-green">
                                        {source.web.title}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </>
        ) : (
          <p className="text-race-light/50">Up-to-date news reports will appear here.</p>
        )}
      </div>
    </div>
  );
};

export default RacingNews;
