import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Play } from "lucide-react";
import PlaylistInput from "@/components/playlist-input";
import VideoPlayer from "@/components/video-player";
import VideoList from "@/components/video-list";
import StudyTimer from "@/components/study-timer";
import StudyStats from "@/components/study-stats";
import PlaylistSidebar from "@/components/playlist-sidebar";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Playlist, Video } from "@shared/schema";

interface PlaylistWithVideos extends Playlist {
  videos: Video[];
  progress: {
    completed: number;
    total: number;
    percentage: number;
  };
}

export default function Dashboard() {
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: playlists = [] } = useQuery<Playlist[]>({
    queryKey: ["/api/playlists"],
  });

  const { data: activePlaylist, isLoading: isPlaylistLoading } = useQuery<PlaylistWithVideos>({
    queryKey: ["/api/playlists", activePlaylistId],
    enabled: !!activePlaylistId,
  });

  const currentVideo = activePlaylist?.videos[currentVideoIndex];

  const updateWatchStatusMutation = useMutation({
    mutationFn: async ({ videoId, isWatched }: { videoId: string; isWatched: boolean }) => {
      const response = await apiRequest("PATCH", `/api/videos/${videoId}/watch-status`, { isWatched });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/playlists"] });
      queryClient.invalidateQueries({ queryKey: ["/api/playlists", activePlaylistId] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update video status",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePlaylistAdded = (playlist: Playlist) => {
    setActivePlaylistId(playlist.id);
    setCurrentVideoIndex(0);
  };

  const handleVideoSelect = (index: number) => {
    setCurrentVideoIndex(index);
  };

  const handleNextVideo = () => {
    if (activePlaylist && currentVideoIndex < activePlaylist.videos.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1);
    }
  };

  const handlePreviousVideo = () => {
    if (currentVideoIndex > 0) {
      setCurrentVideoIndex(currentVideoIndex - 1);
    }
  };

  const handleMarkComplete = () => {
    if (currentVideo && !updateWatchStatusMutation.isPending) {
      const newWatchStatus = !currentVideo.isWatched;
      
      updateWatchStatusMutation.mutate({
        videoId: currentVideo.id,
        isWatched: newWatchStatus,
      });
      
      if (newWatchStatus) {
        toast({
          title: "Video marked as complete",
          description: `"${currentVideo.title}" has been marked as watched.`,
        });
        // Auto-advance to next video after a short delay
        setTimeout(() => {
          handleNextVideo();
        }, 1000);
      } else {
        toast({
          title: "Video unmarked",
          description: `"${currentVideo.title}" has been marked as not watched.`,
        });
      }
    }
  };

  const handlePlayPause = () => {
    // This will be handled by the VideoPlayer component
  };

  useKeyboardShortcuts({
    onNext: handleNextVideo,
    onPrevious: handlePreviousVideo,
    onMarkComplete: handleMarkComplete,
    onPlayPause: handlePlayPause,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-apple-blue rounded-lg flex items-center justify-center">
                <Play className="text-white" size={16} />
              </div>
              <h1 className="text-xl font-semibold text-apple-dark">StudyTube</h1>
            </div>
            <nav className="hidden md:flex space-x-6">
              <a href="#" className="text-apple-blue font-medium">Dashboard</a>
              <a href="#" className="text-apple-gray hover:text-apple-dark transition-colors">Statistics</a>
              <a href="#" className="text-apple-gray hover:text-apple-dark transition-colors">Settings</a>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            <PlaylistInput onPlaylistAdded={handlePlaylistAdded} />
            
            {activePlaylist && !isPlaylistLoading ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Playlist Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-apple-dark">{activePlaylist.title}</h2>
                      <p className="text-apple-gray text-sm mt-1">
                        by {activePlaylist.channelTitle} • {activePlaylist.videoCount} videos
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-apple-blue">
                        {activePlaylist.progress.percentage}%
                      </div>
                      <div className="text-sm text-apple-gray">Complete</div>
                    </div>
                  </div>
                  <div className="w-full bg-apple-light rounded-full h-2">
                    <div
                      className="bg-apple-blue h-2 rounded-full transition-all duration-300"
                      style={{ width: `${activePlaylist.progress.percentage}%` }}
                    />
                  </div>
                </div>

                {/* Video Player */}
                {currentVideo && (
                  <VideoPlayer
                    video={currentVideo}
                    onNext={handleNextVideo}
                    onPrevious={handlePreviousVideo}
                  />
                )}

                {/* Video List */}
                <VideoList
                  videos={activePlaylist.videos}
                  currentVideoIndex={currentVideoIndex}
                  onVideoSelect={handleVideoSelect}
                />
              </div>
            ) : activePlaylistId && isPlaylistLoading ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <div className="text-center text-apple-gray">Loading playlist...</div>
              </div>
            ) : null}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <StudyTimer />
            <StudyStats />
            <PlaylistSidebar
              playlists={playlists}
              activePlaylistId={activePlaylistId}
              onPlaylistSelect={setActivePlaylistId}
            />

            {/* Keyboard Shortcuts */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-apple-dark mb-4">Shortcuts</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-apple-gray">Play/Pause</span>
                  <kbd className="px-2 py-1 bg-apple-light text-apple-dark rounded text-xs font-mono">Space</kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-apple-gray">Next Video</span>
                  <kbd className="px-2 py-1 bg-apple-light text-apple-dark rounded text-xs font-mono">→</kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-apple-gray">Previous Video</span>
                  <kbd className="px-2 py-1 bg-apple-light text-apple-dark rounded text-xs font-mono">←</kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-apple-gray">Toggle Complete</span>
                  <kbd className="px-2 py-1 bg-apple-light text-apple-dark rounded text-xs font-mono">C</kbd>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
