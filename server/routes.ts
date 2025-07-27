import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { youtubePlaylistSchema } from "@shared/schema";
import { z } from "zod";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || process.env.VITE_YOUTUBE_API_KEY || "your_youtube_api_key";

interface YouTubePlaylistResponse {
  items: Array<{
    id: string;
    snippet: {
      title: string;
      description: string;
      channelTitle: string;
      thumbnails: {
        medium: { url: string };
      };
    };
    contentDetails: {
      itemCount: number;
    };
  }>;
}

interface YouTubePlaylistItemsResponse {
  items: Array<{
    snippet: {
      title: string;
      description: string;
      position: number;
      resourceId: {
        videoId: string;
      };
      thumbnails: {
        medium: { url: string };
      };
    };
    contentDetails: {
      videoId: string;
    };
  }>;
}

interface YouTubeVideosResponse {
  items: Array<{
    id: string;
    contentDetails: {
      duration: string;
    };
  }>;
}

function extractPlaylistId(url: string): string | null {
  const match = url.match(/[?&]list=([^&]+)/);
  return match ? match[1] : null;
}

function formatDuration(isoDuration: string): string {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "0:00";
  
  const hours = parseInt(match[1] || "0");
  const minutes = parseInt(match[2] || "0");
  const seconds = parseInt(match[3] || "0");
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all playlists
  app.get("/api/playlists", async (req, res) => {
    try {
      const playlists = await storage.getAllPlaylists();
      res.json(playlists);
    } catch (error) {
      console.error("Error fetching playlists:", error);
      res.status(500).json({ message: "Failed to fetch playlists" });
    }
  });

  // Add a new playlist from YouTube URL
  app.post("/api/playlists", async (req, res) => {
    try {
      const { url } = youtubePlaylistSchema.parse(req.body);
      const playlistId = extractPlaylistId(url);
      
      if (!playlistId) {
        return res.status(400).json({ message: "Invalid YouTube playlist URL" });
      }

      // Check if playlist already exists
      const existingPlaylist = await storage.getPlaylistByYoutubeId(playlistId);
      if (existingPlaylist) {
        return res.status(400).json({ message: "Playlist already added" });
      }

      // Fetch playlist details from YouTube API
      const playlistResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&id=${playlistId}&key=${YOUTUBE_API_KEY}`
      );

      if (!playlistResponse.ok) {
        throw new Error("Failed to fetch playlist from YouTube");
      }

      const playlistData: YouTubePlaylistResponse = await playlistResponse.json();
      
      if (!playlistData.items || playlistData.items.length === 0) {
        return res.status(404).json({ message: "Playlist not found" });
      }

      const playlistInfo = playlistData.items[0];

      // Create playlist in storage
      const playlist = await storage.createPlaylist({
        youtubeId: playlistId,
        title: playlistInfo.snippet.title,
        description: playlistInfo.snippet.description || "",
        channelTitle: playlistInfo.snippet.channelTitle,
        thumbnailUrl: playlistInfo.snippet.thumbnails.medium.url,
        videoCount: playlistInfo.contentDetails.itemCount,
      });

      // Fetch playlist items
      const itemsResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${playlistId}&maxResults=50&key=${YOUTUBE_API_KEY}`
      );

      if (itemsResponse.ok) {
        const itemsData: YouTubePlaylistItemsResponse = await itemsResponse.json();
        
        // Get video details for durations
        const videoIds = itemsData.items.map(item => item.contentDetails.videoId).join(",");
        const videosResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${YOUTUBE_API_KEY}`
        );

        let videoDurations: { [key: string]: string } = {};
        if (videosResponse.ok) {
          const videosData: YouTubeVideosResponse = await videosResponse.json();
          videoDurations = videosData.items.reduce((acc, video) => {
            acc[video.id] = formatDuration(video.contentDetails.duration);
            return acc;
          }, {} as { [key: string]: string });
        }

        // Create videos in storage
        for (const item of itemsData.items) {
          await storage.createVideo({
            youtubeId: item.contentDetails.videoId,
            playlistId: playlist.id,
            title: item.snippet.title,
            description: item.snippet.description || "",
            thumbnailUrl: item.snippet.thumbnails.medium.url,
            duration: videoDurations[item.contentDetails.videoId] || "0:00",
            position: item.snippet.position,
            isWatched: false,
            watchedAt: null,
          });
        }
      }

      res.json(playlist);
    } catch (error) {
      console.error("Error adding playlist:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add playlist" });
    }
  });

  // Get playlist with videos
  app.get("/api/playlists/:id", async (req, res) => {
    try {
      const playlist = await storage.getPlaylist(req.params.id);
      if (!playlist) {
        return res.status(404).json({ message: "Playlist not found" });
      }

      const videos = await storage.getVideosByPlaylistId(playlist.id);
      const progress = await storage.getPlaylistProgress(playlist.id);

      res.json({ ...playlist, videos, progress });
    } catch (error) {
      console.error("Error fetching playlist:", error);
      res.status(500).json({ message: "Failed to fetch playlist" });
    }
  });

  // Delete a playlist
  app.delete("/api/playlists/:id", async (req, res) => {
    try {
      await storage.deletePlaylist(req.params.id);
      res.json({ message: "Playlist deleted successfully" });
    } catch (error) {
      console.error("Error deleting playlist:", error);
      res.status(500).json({ message: "Failed to delete playlist" });
    }
  });

  // Update video watch status
  app.patch("/api/videos/:id/watch-status", async (req, res) => {
    try {
      const { isWatched } = z.object({ isWatched: z.boolean() }).parse(req.body);
      const video = await storage.updateVideoWatchStatus(req.params.id, isWatched);
      
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }

      res.json(video);
    } catch (error) {
      console.error("Error updating video watch status:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update video status" });
    }
  });

  // Study session endpoints
  app.get("/api/study-session/active", async (req, res) => {
    try {
      const session = await storage.getActiveStudySession();
      res.json(session);
    } catch (error) {
      console.error("Error fetching active study session:", error);
      res.status(500).json({ message: "Failed to fetch study session" });
    }
  });

  app.post("/api/study-session", async (req, res) => {
    try {
      // End any existing active session
      const activeSession = await storage.getActiveStudySession();
      if (activeSession) {
        await storage.updateStudySession(activeSession.id, { 
          isActive: false,
          endTime: new Date(),
          duration: Math.floor((new Date().getTime() - activeSession.startTime.getTime()) / 1000)
        });
      }

      const session = await storage.createStudySession({
        endTime: null,
        duration: null,
        videosCompleted: 0,
        isActive: true,
      });

      res.json(session);
    } catch (error) {
      console.error("Error creating study session:", error);
      res.status(500).json({ message: "Failed to create study session" });
    }
  });

  app.patch("/api/study-session/:id", async (req, res) => {
    try {
      const updates = z.object({
        isActive: z.boolean().optional(),
        videosCompleted: z.number().optional(),
        endTime: z.string().optional(),
      }).parse(req.body);

      const processedUpdates: Partial<any> = { ...updates };
      if (updates.endTime) {
        processedUpdates.endTime = new Date(updates.endTime);
      }

      // Calculate duration if ending session
      if (updates.isActive === false) {
        const session = await storage.getActiveStudySession();
        if (session) {
          processedUpdates.duration = Math.floor((new Date().getTime() - session.startTime.getTime()) / 1000);
        }
      }

      const session = await storage.updateStudySession(req.params.id, processedUpdates);
      
      if (!session) {
        return res.status(404).json({ message: "Study session not found" });
      }

      res.json(session);
    } catch (error) {
      console.error("Error updating study session:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update study session" });
    }
  });

  // Get today's study statistics
  app.get("/api/stats/today", async (req, res) => {
    try {
      const stats = await storage.getTodayStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching today's stats:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
