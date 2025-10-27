
import { GoogleGenAI } from '@google/genai';
import React, { useState } from 'react';

const CarCustomizer: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('A formula 1 car, carbon fiber body, with neon green and black lightning patterns.');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const generateImage = async () => {
    if (!prompt) {
      setError('Please enter a prompt to design the car.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '16:9',
        },
      });

      const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
      const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;
      setGeneratedImage(imageUrl);
    } catch (e) {
      const error = e as Error;
      setError(`Failed to generate image: ${error.message}`);
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-race-dark-200 p-6 rounded-lg shadow-2xl">
      <h1 className="text-3xl font-bold text-race-green mb-4">Car Livery Customizer</h1>
      <p className="text-race-light mb-6">Describe your dream race car livery and our AI designer, powered by Imagen 4, will bring it to life.</p>
      
      <div className="flex flex-col space-y-4 mb-6">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., A sleek race car with a matte black finish and glowing cyan circuits..."
          className="w-full p-3 bg-race-dark-300 border-2 border-race-dark-300 rounded-lg focus:outline-none focus:border-race-green transition-colors text-race-light resize-none"
          rows={3}
        />
        <button
          onClick={generateImage}
          disabled={isLoading}
          className="bg-race-green text-race-dark font-bold py-3 px-6 rounded-lg hover:bg-white disabled:bg-race-dark-300 disabled:cursor-not-allowed transition-colors duration-300"
        >
          {isLoading ? 'Designing...' : 'Generate Design'}
        </button>
      </div>

      {error && <p className="text-red-500 bg-red-900/50 p-3 rounded-lg">{error}</p>}

      <div className="flex-1 flex items-center justify-center bg-black/30 rounded-lg overflow-hidden mt-4">
        {isLoading && (
           <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-race-green mx-auto"></div>
            <p className="mt-4 text-race-light">Generating your masterpiece...</p>
          </div>
        )}
        {generatedImage && !isLoading && (
          <img src={generatedImage} alt="Generated car livery" className="object-contain max-h-full max-w-full rounded-lg" />
        )}
        {!generatedImage && !isLoading && (
            <div className="text-center text-race-dark-300">
                <CarCustomizerIcon />
                <p className="mt-2 text-race-light/50">Your generated car design will appear here.</p>
            </div>
        )}
      </div>
    </div>
  );
};

const CarCustomizerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
)

export default CarCustomizer;
