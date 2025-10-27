
import { GoogleGenAI } from '@google/genai';
import React, { useState, useRef } from 'react';

// Helper to convert Blob to base64
const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
  });

const TeamRadio: React.FC = () => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [transcription, setTranscription] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleStartRecording = async () => {
    setTranscription('');
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.onstop = handleStopRecording;
      audioChunksRef.current = [];
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      setError('Microphone access denied. Please enable it in your browser settings.');
    }
  };

  const handleStopRecording = async () => {
    if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        // The stream tracks will be stopped after transcription
        setIsRecording(false);
        setIsLoading(true);
        
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        try {
            const base64Audio = await blobToBase64(audioBlob);
            const audioPart = {
                inlineData: {
                    mimeType: 'audio/webm',
                    data: base64Audio,
                },
            };
            const prompt = "Transcribe the following audio message from a race car driver.";

            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [audioPart, { text: prompt }] },
            });
            setTranscription(response.text);

        } catch (e) {
            const error = e as Error;
            setError(`Transcription failed: ${error.message}`);
            console.error(e);
        } finally {
            setIsLoading(false);
            // Stop media stream tracks
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
    }
  };

  return (
    <div className="flex flex-col h-full bg-race-dark-200 p-6 rounded-lg shadow-2xl">
      <h1 className="text-3xl font-bold text-race-green mb-4">Team Radio</h1>
      <p className="text-race-light mb-6">Record a message for your race engineer. Your audio will be transcribed and sent to the pit wall.</p>
      
      <div className="flex justify-center items-center my-6">
        <button
          onClick={isRecording ? handleStopRecording : handleStartRecording}
          disabled={isLoading}
          className={`flex items-center justify-center w-24 h-24 rounded-full transition-all duration-300 ${
            isRecording 
              ? 'bg-red-600 animate-pulse' 
              : 'bg-race-green'
          } text-race-dark shadow-lg hover:scale-105 disabled:bg-race-dark-300`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="currentColor" viewBox="0 0 16 16">
            <path d={isRecording 
                ? "M5 3.5h6A1.5 1.5 0 0 1 12.5 5v6a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 11V5A1.5 1.5 0 0 1 5 3.5z"
                : "M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5z M8 1a2 2 0 0 0-2 2v4a2 2 0 0 0 4 0V3a2 2 0 0 0-2-2z"}
            />
          </svg>
        </button>
      </div>
      <p className="text-center text-race-light mb-6 font-semibold">
        {isLoading ? "Transcribing..." : isRecording ? "Recording... Press to stop" : "Press to record"}
      </p>
      
      {error && <p className="text-red-500 bg-red-900/50 p-3 rounded-lg text-center mb-4">{error}</p>}

      <div className="flex-1 bg-black/30 rounded-lg p-4 overflow-y-auto">
        <h2 className="text-xl font-bold text-race-green mb-2">Transcription:</h2>
        {isLoading ? (
            <div className="animate-pulse space-y-2">
                <div className="h-4 bg-race-dark-300 rounded w-3/4"></div>
                <div className="h-4 bg-race-dark-300 rounded w-1/2"></div>
            </div>
        ) : transcription ? (
          <p className="text-race-light whitespace-pre-wrap">{transcription}</p>
        ) : (
          <p className="text-race-light/50">Your transcribed message will appear here.</p>
        )}
      </div>
    </div>
  );
};

export default TeamRadio;
