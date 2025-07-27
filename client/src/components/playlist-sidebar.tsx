import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import type { Playlist } from "@shared/schema";

interface PlaylistSidebarProps {
  playlists: Playlist[];
  activePlaylistId: string | null;
  onPlaylistSelect: (id: string) => void;
}

export default function PlaylistSidebar({ playlists, activePlaylistId, onPlaylistSelect }: PlaylistSidebarProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deletePlaylistMutation = useMutation({
    mutationFn: async (playlistId: string) => {
      const response = await apiRequest("DELETE", `/api/playlists/${playlistId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/playlists"] });
      toast({
        title: "Playlist deleted",
        description: "The playlist has been removed from your library.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete playlist",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDeletePlaylist = (playlistId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deletePlaylistMutation.mutate(playlistId);
  };

  if (playlists.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-apple-dark mb-4">My Playlists</h3>
        <p className="text-apple-gray text-sm text-center py-4">
          No playlists added yet. Add a YouTube playlist to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-apple-dark mb-4">My Playlists</h3>
      <div className="space-y-3">
        {playlists.map((playlist) => (
          <div
            key={playlist.id}
            className={cn(
              "flex items-center space-x-3 p-3 rounded-lg transition-colors cursor-pointer group",
              playlist.id === activePlaylistId ? "bg-blue-50" : "hover:bg-apple-light"
            )}
            onClick={() => onPlaylistSelect(playlist.id)}
          >
            <div className="w-12 h-8 bg-gray-200 rounded overflow-hidden flex-shrink-0">
              <img
                src={playlist.thumbnailUrl || "https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3&auto=format&fit=crop&w=48&h=32"}
                alt={playlist.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-apple-dark text-sm truncate">{playlist.title}</h4>
              <p className="text-xs text-apple-gray">
                {playlist.channelTitle} • {playlist.videoCount} videos
              </p>
            </div>
            <div className="flex items-center space-x-1">
              {playlist.id === activePlaylistId && (
                <div className="w-2 h-2 bg-apple-blue rounded-full" />
              )}
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:text-red-600"
                onClick={(e) => handleDeletePlaylist(playlist.id, e)}
                disabled={deletePlaylistMutation.isPending}
              >
                <Trash2 size={12} />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
