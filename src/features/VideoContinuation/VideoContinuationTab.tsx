
import React, { useState, useEffect } from 'react';
import type { VeoOperationContext } from '../../types';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { GeneratedMedia } from '../../components/GeneratedMedia';
import { extendVideo, pollVideoOperation, getVideoUrl } from '../../services/geminiService';
import { useVeoApiKey } from '../../hooks/useVeoApiKey';
import { ApiKeySelector } from '../../components/ApiKeySelector';
import { Film } from 'lucide-react';

const LOADING_MESSAGES = [
    "Extending the story...",
    "Directing the next scene...",
    "This may take a few minutes...",
    "Weaving new frames into the sequence...",
    "Continuing the adventure...",
];

interface VideoContinuationTabProps {
  veoContext: VeoOperationContext | null;
  setVeoContext: (context: VeoOperationContext) => void;
}

export const VideoContinuationTab: React.FC<VideoContinuationTabProps> = ({ veoContext, setVeoContext }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previousVideoUrl, setPreviousVideoUrl] = useState<string | null>(null);
  const [continuedVideoUrl, setContinuedVideoUrl] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);

  const { hasApiKey, isChecking, selectApiKey, resetApiKey } = useVeoApiKey();
  
  useEffect(() => {
    const fetchPreviousVideo = async () => {
        if (veoContext) {
            try {
                const uri = veoContext.operation.response?.generatedVideos?.[0]?.video?.uri;
                if(uri) {
                    const url = await getVideoUrl(uri);
                    setPreviousVideoUrl(url);
                }
            } catch (err) {
                console.error("Failed to load previous video", err);
                setError("Could not load the previously generated video.");
            }
        }
    };
    fetchPreviousVideo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [veoContext]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt) {
      setError('Please enter a prompt to continue the video.');
      return;
    }
    if (!veoContext) {
      setError('No previous video to continue. Please generate a video first.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setContinuedVideoUrl(null);
    
    const messageInterval = setInterval(() => {
        setLoadingMessage(LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]);
    }, 5000);

    try {
      let operation = await extendVideo(prompt, veoContext.operation);
      operation = await pollVideoOperation(operation);
      
      if (operation.error) {
          // Fix: Explicitly cast error message to string to prevent type errors.
          throw new Error(String(operation.error.message) || "An unknown error occurred during video extension.");
      }

      const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (uri) {
        const url = await getVideoUrl(uri);
        setContinuedVideoUrl(url);
        // Update context to allow chaining continuations
        setVeoContext({ operation, prompt: `${veoContext.prompt}, then ${prompt}` });
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
  
  if (!veoContext) {
    return (
        <div className="text-center p-8 bg-gray-800/50 rounded-lg">
            <h2 className="text-xl font-bold mb-2">No Video to Continue</h2>
            <p className="text-gray-400">Please go to the "Video Generation" tab to create a video first.</p>
        </div>
    );
  }
  
  if (!hasApiKey) {
      return <ApiKeySelector isChecking={isChecking} onSelectKey={selectApiKey} />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-xl font-bold mb-4 text-center">Continue Your Video</h2>
      
      {previousVideoUrl && (
          <div className="mb-6">
              <h3 className="text-lg font-semibold text-center mb-2">Previous Video</h3>
              <GeneratedMedia url={previousVideoUrl} type="video" alt={veoContext.prompt} />
          </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="continue-prompt" className="block text-sm font-medium text-gray-300 mb-2">
            What happens next?
          </label>
          <textarea
            id="continue-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., The cat looks surprised as a UFO appears in the sky"
            className="w-full p-3 bg-gray-800 border-2 border-gray-700 rounded-lg focus:ring-purple-500 focus:border-purple-500 transition-colors"
            rows={3}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center bg-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          {isLoading ? <LoadingSpinner message={loadingMessage} /> : <><Film className="mr-2" size={18} /> Continue Video</>}
        </button>
      </form>

      {error && <div className="mt-4 text-center text-red-400 bg-red-900/50 p-3 rounded-lg">{error}</div>}
      
      {continuedVideoUrl && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-center mb-4">Extended Video</h3>
            <GeneratedMedia url={continuedVideoUrl} type="video" alt={`Continued: ${prompt}`} />
          </div>
      )}
    </div>
  );
};
