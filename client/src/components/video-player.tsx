import { useState, useRef, useEffect } from "react";
import { Play, Pause, SkipBack, SkipForward, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Video } from "@shared/schema";

interface VideoPlayerProps {
  video: Video;
  onNext: () => void;
  onPrevious: () => void;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function VideoPlayer({ video, onNext, onPrevious }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load YouTube IFrame API
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        setIsPlayerReady(true);
      };
    } else {
      setIsPlayerReady(true);
    }
  }, []);

  useEffect(() => {
    if (isPlayerReady && showPlayer && containerRef.current && !playerRef.current) {
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId: video.youtubeId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 1,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          controls: 1,
          disablekb: 0,
          enablejsapi: 1,
          origin: window.location.origin
        },
        events: {
          onReady: (event: any) => {
            setIsPlaying(true);
          },
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
            } else if (event.data === window.YT.PlayerState.ENDED) {
              setIsPlaying(false);
              // Auto-advance to next video when current video ends
              onNext();
            }
          }
        }
      });
    }
  }, [isPlayerReady, showPlayer, video.youtubeId]);

  // Clean up player when video changes
  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
      setShowPlayer(false);
      setIsPlaying(false);
    }
  }, [video.youtubeId]);

  const handlePlayVideo = () => {
    setShowPlayer(true);
  };

  const handleOpenInYouTube = () => {
    window.open(`https://www.youtube.com/watch?v=${video.youtubeId}`, '_blank');
  };

  const handlePlayPause = () => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    }
  };

  return (
    <div className="p-6 bg-gray-50 border-b border-gray-200">
      <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4 relative">
        {showPlayer ? (
          <div ref={containerRef} className="w-full h-full" />
        ) : (
          <div className="cursor-pointer group h-full" onClick={handlePlayVideo}>
            <img
              src={video.thumbnailUrl || "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=675"}
              alt={video.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center transition-opacity group-hover:bg-opacity-50">
              <div className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all">
                <Play className="text-2xl text-apple-blue ml-1" size={24} />
              </div>
            </div>
            <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm">
              {video.duration}
            </div>
          </div>
        )}
      </div>
      
      <h3 className="text-lg font-medium text-apple-dark mb-2">
        {video.title}
      </h3>
      
      {video.description && (
        <p className="text-apple-gray text-sm line-clamp-2 mb-4">
          {video.description}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button 
          onClick={onPrevious}
          variant="outline"
          size="sm"
          className="text-apple-gray border-gray-300"
        >
          <SkipBack className="mr-1" size={14} />
          Previous
        </Button>
        
        {showPlayer ? (
          <Button 
            onClick={handlePlayPause}
            className="bg-apple-blue hover:bg-blue-600 text-white"
          >
            {isPlaying ? <Pause className="mr-2" size={16} /> : <Play className="mr-2" size={16} />}
            {isPlaying ? "Pause" : "Play"}
          </Button>
        ) : (
          <Button 
            onClick={handlePlayVideo}
            className="bg-apple-blue hover:bg-blue-600 text-white"
          >
            <Play className="mr-2" size={16} />
            Play Video
          </Button>
        )}
        
        <Button 
          onClick={onNext}
          variant="outline"
          size="sm"
          className="text-apple-gray border-gray-300"
        >
          Next
          <SkipForward className="ml-1" size={14} />
        </Button>
        
        <Button 
          onClick={handleOpenInYouTube}
          variant="outline"
          size="sm"
          className="text-apple-gray border-gray-300"
        >
          <ExternalLink className="mr-1" size={14} />
          Open in YouTube
        </Button>
      </div>
    </div>
  );
}
