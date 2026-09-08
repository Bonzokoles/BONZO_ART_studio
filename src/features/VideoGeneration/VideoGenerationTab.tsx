
import React, { useState } from 'react';
import type { UploadedFile, VideoAspectRatio, VeoOperationContext } from '../../types';
import { AspectRatioSelector } from '../../components/AspectRatioSelector';
import { ImageUpload } from '../../components/ImageUpload';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { GeneratedMedia } from '../../components/GeneratedMedia';
import { generateVideo, pollVideoOperation, getVideoUrl } from '../../services/geminiService';
import { useVeoApiKey } from '../../hooks/useVeoApiKey';
import { ApiKeySelector } from '../../components/ApiKeySelector';
import { Clapperboard } from 'lucide-react';

const LOADING_MESSAGES = [
    "Brewing pixels into motion...",
    "Choreographing digital actors...",
    "This can take a few minutes, hang tight!",
    "Rendering your masterpiece frame by frame...",
    "Almost there, adding the final touches...",
];

interface VideoGenerationTabProps {
    setVeoContext: (context: VeoOperationContext) => void;
}

export const VideoGenerationTab: React.FC<VideoGenerationTabProps> = ({ setVeoContext }) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>('16:9');
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
  
  const { hasApiKey, isChecking, selectApiKey, resetApiKey } = useVeoApiKey();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt && !uploadedFile) {
      setError('Please enter a prompt or upload an image.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedVideoUrl(null);

    const messageInterval = setInterval(() => {
        setLoadingMessage(LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]);
    }, 5000);

    try {
      let operation = await generateVideo(prompt, aspectRatio, uploadedFile);
      operation = await pollVideoOperation(operation);

      if (operation.error) {
          // Fix: Explicitly cast error message to string to prevent type errors.
          throw new Error(String(operation.error.message) || "An unknown error occurred during video generation.");
      }
      
      const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (uri) {
        const url = await getVideoUrl(uri);
        setGeneratedVideoUrl(url);
        setVeoContext({ operation, prompt });
      } else {
          throw new Error("Video URI not found in operation response.");
      }

    } catch (err) {
      // Fix: Handle 'unknown' error type from catch block before setting state.
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      console.error(err);
      if (errorMessage.includes("Requested entity was not found")) {
          setError("API Key error. Please try selecting your key again.");
          resetApiKey();
      }
    } finally {
      setIsLoading(false);
      clearInterval(messageInterval);
    }
  };

  if (!hasApiKey) {
      return <ApiKeySelector isChecking={isChecking} onSelectKey={selectApiKey} />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <ImageUpload
            uploadedFile={uploadedFile}
            setUploadedFile={setUploadedFile}
            onFileUpload={(file) => setUploadedFile(file)}
            label="Starting Image (Optional)"
        />
        
        <div>
          <label htmlFor="video-prompt" className="block text-sm font-medium text-gray-300 mb-2">
            Prompt
          </label>
          <textarea
            id="video-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., A neon hologram of a cat driving at top speed"
            className="w-full p-3 bg-gray-800 border-2 border-gray-700 rounded-lg focus:ring-purple-500 focus:border-purple-500 transition-colors"
            rows={3}
          />
        </div>

        <AspectRatioSelector<VideoAspectRatio>
          value={aspectRatio}
          onChange={setAspectRatio}
          options={['16:9', '9:16']}
          label="Aspect Ratio"
        />

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center bg-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          {isLoading ? <LoadingSpinner message={loadingMessage} /> : <><Clapperboard className="mr-2" size={18}/> Generate Video</>}
        </button>
      </form>

      {error && <div className="mt-4 text-center text-red-400 bg-red-900/50 p-3 rounded-lg">{error}</div>}
      
      {generatedVideoUrl && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-center mb-4">Generated Video</h3>
            <GeneratedMedia url={generatedVideoUrl} type="video" alt={prompt} />
          </div>
      )}
    </div>
  );
};
