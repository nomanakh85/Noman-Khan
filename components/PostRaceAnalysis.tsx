
import { GoogleGenAI } from '@google/genai';
import React, { useState } from 'react';

// Helper to convert file to base64
const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
  });

const PostRaceAnalysis: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setError("Please select a valid video file.");
      setVideoFile(null);
      setVideoPreview(null);
    }
  };

  const analyzeVideo = async () => {
    if (!videoFile) {
      setError('Please upload a race video to analyze.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setAnalysis('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const base64Video = await fileToBase64(videoFile);
      const videoPart = {
        inlineData: {
          mimeType: videoFile.type,
          data: base64Video,
        },
      };
      
      const prompt = `You are a world-class Formula 1 race analyst. Analyze this video of a race lap. Provide a detailed breakdown of the driver's performance, focusing on:
      1. Racing line and cornering technique.
      2. Throttle and brake application (based on visual cues).
      3. Any mistakes or areas for improvement.
      4. Overall performance rating out of 10.
      Format your response in clear, concise points using Markdown.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: [videoPart, { text: prompt }] },
      });

      setAnalysis(response.text);
    } catch (e) {
      const error = e as Error;
      setError(`Analysis failed: ${error.message}`);
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-race-dark-200 p-6 rounded-lg shadow-2xl">
      <h1 className="text-3xl font-bold text-race-green mb-4">Post-Race Analysis</h1>
      <p className="text-race-light mb-6">Upload race footage and get an expert analysis from Gemini Pro on driver performance, technique, and areas for improvement.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="flex flex-col items-center justify-center p-4 bg-race-dark-300 border-2 border-dashed border-race-dark-300 rounded-lg hover:border-race-green transition-colors">
          <input type="file" id="video-upload" accept="video/*" onChange={handleFileChange} className="hidden"/>
          <label htmlFor="video-upload" className="cursor-pointer text-center">
            {videoPreview ? (
              <video src={videoPreview} controls className="max-h-48 rounded-lg" />
            ) : (
              <div className="text-race-light/70">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                <p>Click to upload race footage</p>
              </div>
            )}
          </label>
        </div>
        <div className="flex flex-col">
            <button
                onClick={analyzeVideo}
                disabled={isLoading || !videoFile}
                className="w-full bg-race-green text-race-dark font-bold py-3 px-6 rounded-lg hover:bg-white disabled:bg-race-dark-300 disabled:cursor-not-allowed transition-colors duration-300"
            >
                {isLoading ? 'Analyzing Footage...' : 'Analyze Performance'}
            </button>
            {error && <p className="text-red-500 bg-red-900/50 p-3 rounded-lg mt-4">{error}</p>}
        </div>
      </div>
      
      <div className="flex-1 bg-black/30 rounded-lg p-4 overflow-y-auto">
        {isLoading ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-race-green mx-auto"></div>
            <p className="mt-4 text-race-light">Gemini Pro is analyzing the race...</p>
          </div>
        ) : analysis ? (
          <div className="prose prose-invert max-w-none text-race-light" dangerouslySetInnerHTML={{ __html: analysis.replace(/\n/g, '<br />') }} />
        ) : (
          <p className="text-race-light/50 text-center pt-10">Performance analysis will appear here.</p>
        )}
      </div>
    </div>
  );
};

export default PostRaceAnalysis;
