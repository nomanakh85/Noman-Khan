
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createBlob, decode, decodeAudioData } from './audioUtils';

type TranscriptionEntry = {
    speaker: 'user' | 'model';
    text: string;
};

// FIX: Define a local interface for the session object since LiveSession is not an exported type.
interface LiveSession {
  sendRealtimeInput(content: { media: Blob }): void;
  close(): void;
}

const LiveCommentator: React.FC = () => {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [status, setStatus] = useState('Idle. Press "Start Commentary" to connect.');
  const [transcriptionHistory, setTranscriptionHistory] = useState<TranscriptionEntry[]>([]);
  const [currentTranscription, setCurrentTranscription] = useState({ user: '', model: '' });

  const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  const streamRef = useRef<MediaStream|null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode|null>(null);

  const stopSession = useCallback(() => {
    if (sessionPromiseRef.current) {
        sessionPromiseRef.current.then(session => session.close());
        sessionPromiseRef.current = null;
    }
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }
    if(scriptProcessorRef.current){
        scriptProcessorRef.current.disconnect();
        scriptProcessorRef.current = null;
    }
    if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
        inputAudioContextRef.current.close();
    }
    if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
        sourcesRef.current.forEach(source => source.stop());
        sourcesRef.current.clear();
        outputAudioContextRef.current.close();
    }
    
    setIsSessionActive(false);
    setStatus('Session ended. Press "Start Commentary" to reconnect.');
    nextStartTimeRef.current = 0;
  }, []);
  
  const startSession = async () => {
    if (isSessionActive) return;

    setIsSessionActive(true);
    setStatus('Requesting microphone access...');

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        
        inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        
        setStatus('Connecting to Live Commentary...');
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        sessionPromiseRef.current = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                systemInstruction: 'You are a high-energy, enthusiastic car racing commentator. Keep your responses exciting and relatively short, as if you are commentating on a live race.',
                inputAudioTranscription: {},
                outputAudioTranscription: {},
            },
            callbacks: {
                onopen: () => {
                    setStatus('Connection open! Speak into your microphone.');
                    const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
                    const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
                    scriptProcessorRef.current = scriptProcessor;

                    scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                        const pcmBlob = createBlob(inputData);
                        if (sessionPromiseRef.current) {
                            sessionPromiseRef.current.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        }
                    };
                    source.connect(scriptProcessor);
                    scriptProcessor.connect(inputAudioContextRef.current!.destination);
                },
                onmessage: async (message: LiveServerMessage) => {
                    if (message.serverContent?.modelTurn?.parts[0]?.inlineData?.data) {
                        const base64Audio = message.serverContent.modelTurn.parts[0].inlineData.data;
                        const outputAudioContext = outputAudioContextRef.current;
                        if (base64Audio && outputAudioContext) {
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
                            const source = outputAudioContext.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputAudioContext.destination);
                            source.addEventListener('ended', () => sourcesRef.current.delete(source));
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            sourcesRef.current.add(source);
                        }
                    }

                    if (message.serverContent?.interrupted) {
                        sourcesRef.current.forEach(s => s.stop());
                        sourcesRef.current.clear();
                        nextStartTimeRef.current = 0;
                    }
                    
                    if (message.serverContent?.inputTranscription) {
                        setCurrentTranscription(prev => ({...prev, user: prev.user + message.serverContent.inputTranscription.text}));
                    }
                    if (message.serverContent?.outputTranscription) {
                        setCurrentTranscription(prev => ({...prev, model: prev.model + message.serverContent.outputTranscription.text}));
                    }
                    if (message.serverContent?.turnComplete) {
                        setTranscriptionHistory(prev => [
                            ...prev, 
                            { speaker: 'user', text: currentTranscription.user }, 
                            { speaker: 'model', text: currentTranscription.model }
                        ]);
                        setCurrentTranscription({user: '', model: ''});
                    }
                },
                onerror: (e: ErrorEvent) => {
                    console.error('Live session error:', e);
                    setStatus(`Error: ${e.message}. Session closed.`);
                    stopSession();
                },
                onclose: (e: CloseEvent) => {
                    setStatus('Session closed.');
                    stopSession();
                },
            }
        });
    } catch (err) {
        const error = err as Error;
        console.error('Failed to start session:', error);
        setStatus(`Error: ${error.message}`);
        setIsSessionActive(false);
    }
  };

  useEffect(() => {
    return () => {
      stopSession();
    };
  }, [stopSession]);

  return (
    <div className="flex flex-col h-full bg-race-dark-200 p-6 rounded-lg shadow-2xl">
      <h1 className="text-3xl font-bold text-race-green mb-2">Live Race Commentary</h1>
      <p className="text-race-light mb-4">Talk to an AI race commentator in real-time. Ask questions or get live reactions to the race.</p>
      
      <div className="flex flex-col sm:flex-row items-center justify-between bg-race-dark-300 p-3 rounded-lg mb-4">
        <p className="text-race-light text-center sm:text-left">Status: <span className="font-bold text-race-green">{status}</span></p>
        <button
          onClick={isSessionActive ? stopSession : startSession}
          className={`w-full sm:w-auto mt-2 sm:mt-0 font-bold py-2 px-6 rounded-lg transition-colors duration-300 ${
            isSessionActive ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-race-green hover:bg-white text-race-dark'
          }`}
        >
          {isSessionActive ? 'Stop Commentary' : 'Start Commentary'}
        </button>
      </div>

      <div className="flex-1 bg-black/30 rounded-lg p-4 overflow-y-auto space-y-4">
        {transcriptionHistory.map((entry, index) => (
          <div key={index} className={`flex ${entry.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs lg:max-w-md p-3 rounded-lg ${entry.speaker === 'user' ? 'bg-race-green text-race-dark' : 'bg-race-dark-300 text-race-light'}`}>
              <span className="font-bold capitalize">{entry.speaker}: </span>{entry.text}
            </div>
          </div>
        ))}
         {currentTranscription.user && <div className="flex justify-end"><div className="max-w-xs lg:max-w-md p-3 rounded-lg bg-race-green/50 text-race-dark animate-pulse">{currentTranscription.user}</div></div>}
         {currentTranscription.model && <div className="flex justify-start"><div className="max-w-xs lg:max-w-md p-3 rounded-lg bg-race-dark-300/50 text-race-light animate-pulse">{currentTranscription.model}</div></div>}
      </div>
    </div>
  );
};

export default LiveCommentator;
