
import { GoogleGenAI } from '@google/genai';
import React, { useState } from 'react';
import { ApiKeySelector, useApiKey } from './ApiKeyManager';

const loadingMessages = [
  "Firing up the VEO engine...",
  "Reviewing trackside footage...",
  "Rendering high-speed overtakes...",
  "Adding cinematic flair...",
  "Polishing the final cut...",
  "This can take a few minutes, hang tight!",
];

// Helper to convert file to base64
const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
  });


const RaceHighlights: React.FC = () => {
    return (
        <ApiKeySelector>
            <RaceHighlightsGenerator />
        </ApiKeySelector>
    );
};

const RaceHighlightsGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('A dramatic, slow-motion video of the car drifting around a corner with smoke from the tires.');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const { checkKey } = useApiKey();


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateVideo = async () => {
    if (!imageFile) {
      setError('Please upload a starting image for the highlight reel.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setGeneratedVideo(null);
    let messageIndex = 0;
    const interval = setInterval(() => {
        setLoadingMessage(loadingMessages[messageIndex]);
        messageIndex = (messageIndex + 1) % loadingMessages.length;
    }, 3000);

    try {
      // Re-create ai instance to get latest key
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const base64Image = await fileToBase64(imageFile);

      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt,
        image: {
          imageBytes: base64Image,
          mimeType: imageFile.type,
        },
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: aspectRatio,
        }
      });
      
      while (operation && !operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({operation: operation});
      }

      if (operation.error) {
        throw new Error(`Video generation failed: ${operation.error.message}`);
      }
      
      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        // Must append API key to fetch video
        const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        const videoBlob = await response.blob();
        setGeneratedVideo(URL.createObjectURL(videoBlob));
      } else {
        throw new Error("Video URI not found in response.");
      }

    } catch (e) {
      const error = e as Error;
      if(error.message.includes("Requested entity was not found.")){
        setError("API Key not found or invalid. Please re-select your API key.");
        checkKey(); // Trigger re-check
      } else {
        setError(`Failed to generate video: ${error.message}`);
      }
      console.error(e);
    } finally {
      setIsLoading(false);
      clearInterval(interval);
      setLoadingMessage('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-race-dark-200 p-6 rounded-lg shadow-2xl">
      <h1 className="text-3xl font-bold text-race-green mb-4">Race Highlights Generator</h1>
      <p className="text-race-light mb-6">Create stunning video highlights from a single moment. Upload an image, describe the action, and let VEO generate a cinematic clip.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="flex flex-col space-y-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the action..."
            className="w-full p-3 bg-race-dark-300 border-2 border-race-dark-300 rounded-lg focus:outline-none focus:border-race-green transition-colors text-race-light resize-none flex-1"
            rows={4}
          />
          <div className="flex items-center space-x-4">
            <span className="text-race-light font-semibold">Aspect Ratio:</span>
            <div className="flex space-x-2">
              <button onClick={() => setAspectRatio('16:9')} className={`px-4 py-2 rounded ${aspectRatio === '16:9' ? 'bg-race-green text-race-dark' : 'bg-race-dark-300'}`}>16:9</button>
              <button onClick={() => setAspectRatio('9:16')} className={`px-4 py-2 rounded ${aspectRatio === '9:16' ? 'bg-race-green text-race-dark' : 'bg-race-dark-300'}`}>9:16</button>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center p-4 bg-race-dark-300 border-2 border-dashed border-race-dark-300 rounded-lg hover:border-race-green transition-colors">
          <input type="file" id="image-upload" accept="image/*" onChange={handleFileChange} className="hidden"/>
          <label htmlFor="image-upload" className="cursor-pointer text-center">
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="max-h-40 rounded-lg"/>
            ) : (
              <div className="text-race-light/70">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                <p>Click to upload starting image</p>
              </div>
            )}
          </label>
        </div>
      </div>
      
      <button
        onClick={generateVideo}
        disabled={isLoading || !imageFile}
        className="w-full bg-race-green text-race-dark font-bold py-3 px-6 rounded-lg hover:bg-white disabled:bg-race-dark-300 disabled:cursor-not-allowed transition-colors duration-300"
      >
        {isLoading ? 'Generating Highlights...' : 'Generate Highlights'}
      </button>
      
      {error && <p className="text-red-500 bg-red-900/50 p-3 rounded-lg mt-4">{error}</p>}

      <div className="flex-1 flex items-center justify-center bg-black/30 rounded-lg overflow-hidden mt-6">
        {isLoading ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-race-green mx-auto"></div>
            <p className="mt-4 text-race-light animate-pulse">{loadingMessage}</p>
          </div>
        ) : generatedVideo ? (
          <video src={generatedVideo} controls autoPlay loop className="max-h-full max-w-full rounded-lg" />
        ) : (
          <p className="text-race-light/50">Your generated video will appear here.</p>
        )}
      </div>
    </div>
  );
};

export default RaceHighlights;
