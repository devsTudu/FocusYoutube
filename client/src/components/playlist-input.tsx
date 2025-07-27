import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Playlist } from "@shared/schema";

interface PlaylistInputProps {
  onPlaylistAdded: (playlist: Playlist) => void;
}

export default function PlaylistInput({ onPlaylistAdded }: PlaylistInputProps) {
  const [url, setUrl] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addPlaylistMutation = useMutation({
    mutationFn: async (url: string) => {
      const response = await apiRequest("POST", "/api/playlists", { url });
      return response.json();
    },
    onSuccess: (playlist: Playlist) => {
      queryClient.invalidateQueries({ queryKey: ["/api/playlists"] });
      onPlaylistAdded(playlist);
      setUrl("");
      toast({
        title: "Playlist added successfully",
        description: `Added "${playlist.title}" to your study playlists.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add playlist",
        description: error.message || "Please check the URL and try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    if (!url.includes('youtube.com/playlist') && !url.includes('youtu.be/playlist')) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid YouTube playlist URL.",
        variant: "destructive",
      });
      return;
    }

    addPlaylistMutation.mutate(url);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-apple-dark mb-4">Add New Playlist</h2>
      <form onSubmit={handleSubmit} className="flex space-x-3">
        <Input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste YouTube playlist URL here..."
          className="flex-1"
          disabled={addPlaylistMutation.isPending}
        />
        <Button
          type="submit"
          disabled={addPlaylistMutation.isPending || !url.trim()}
          className="bg-apple-blue hover:bg-blue-600 text-white"
        >
          <Plus className="mr-2" size={16} />
          {addPlaylistMutation.isPending ? "Adding..." : "Add Playlist"}
        </Button>
      </form>
    </div>
  );
}
