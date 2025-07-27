import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Play, RotateCcw, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import type { Video } from "@shared/schema";

interface VideoListProps {
  videos: Video[];
  currentVideoIndex: number;
  onVideoSelect: (index: number) => void;
}

export default function VideoList({ videos, currentVideoIndex, onVideoSelect }: VideoListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateWatchStatusMutation = useMutation({
    mutationFn: async ({ videoId, isWatched }: { videoId: string; isWatched: boolean }) => {
      const response = await apiRequest("PATCH", `/api/videos/${videoId}/watch-status`, { isWatched });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/playlists"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update video status",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleToggleWatchStatus = (video: Video, e: React.MouseEvent) => {
    e.stopPropagation();
    updateWatchStatusMutation.mutate({
      videoId: video.id,
      isWatched: !video.isWatched,
    });
  };

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-apple-dark mb-4">Playlist Videos</h3>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {videos.map((video, index) => (
          <div
            key={video.id}
            className={cn(
              "flex items-center space-x-4 p-3 rounded-lg transition-colors cursor-pointer group",
              index === currentVideoIndex
                ? "bg-blue-50 border-l-4 border-apple-blue"
                : "hover:bg-apple-light"
            )}
            onClick={() => onVideoSelect(index)}
          >
            <div className="relative flex-shrink-0">
              <img
                src={video.thumbnailUrl || "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&h=68"}
                alt={video.title}
                className="w-20 h-12 rounded object-cover"
              />
              
              {index === currentVideoIndex ? (
                <div className="absolute inset-0 bg-apple-blue bg-opacity-20 rounded flex items-center justify-center">
                  <Volume2 className="text-apple-blue" size={16} />
                </div>
              ) : (
                <div className="absolute inset-0 bg-black bg-opacity-20 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="text-white" size={12} />
                </div>
              )}

              {video.isWatched && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-apple-green rounded-full flex items-center justify-center">
                  <Check className="text-white" size={12} />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className={cn(
                "font-medium truncate transition-colors",
                index === currentVideoIndex ? "text-apple-blue" : "text-apple-dark group-hover:text-apple-blue"
              )}>
                {video.title}
              </h4>
              <p className="text-sm text-apple-gray">
                {video.duration} • {
                  index === currentVideoIndex ? "Currently Playing" :
                  video.isWatched ? "Completed" : "Not Started"
                }
              </p>
            </div>

            <div className="flex items-center space-x-2">
              {index === currentVideoIndex && (
                <Volume2 className="text-apple-blue" size={16} />
              )}
              
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "opacity-0 group-hover:opacity-100 transition-all p-2",
                  video.isWatched ? "text-apple-orange hover:text-apple-orange" : "text-apple-gray hover:text-apple-green"
                )}
                onClick={(e) => handleToggleWatchStatus(video, e)}
                disabled={updateWatchStatusMutation.isPending}
              >
                {video.isWatched ? (
                  <RotateCcw size={14} />
                ) : (
                  <Check size={14} />
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
