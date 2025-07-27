import { type Playlist, type InsertPlaylist, type Video, type InsertVideo, type StudySession, type InsertStudySession } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Playlist methods
  getPlaylist(id: string): Promise<Playlist | undefined>;
  getPlaylistByYoutubeId(youtubeId: string): Promise<Playlist | undefined>;
  getAllPlaylists(): Promise<Playlist[]>;
  createPlaylist(playlist: InsertPlaylist): Promise<Playlist>;
  deletePlaylist(id: string): Promise<void>;

  // Video methods
  getVideo(id: string): Promise<Video | undefined>;
  getVideosByPlaylistId(playlistId: string): Promise<Video[]>;
  createVideo(video: InsertVideo): Promise<Video>;
  updateVideoWatchStatus(id: string, isWatched: boolean): Promise<Video | undefined>;
  getPlaylistProgress(playlistId: string): Promise<{ completed: number; total: number; percentage: number }>;

  // Study session methods
  getActiveStudySession(): Promise<StudySession | undefined>;
  createStudySession(session: InsertStudySession): Promise<StudySession>;
  updateStudySession(id: string, updates: Partial<StudySession>): Promise<StudySession | undefined>;
  getTodayStats(): Promise<{ videosCompleted: number; studyTime: number; currentStreak: number }>;
}

export class MemStorage implements IStorage {
  private playlists: Map<string, Playlist>;
  private videos: Map<string, Video>;
  private studySessions: Map<string, StudySession>;

  constructor() {
    this.playlists = new Map();
    this.videos = new Map();
    this.studySessions = new Map();
  }

  async getPlaylist(id: string): Promise<Playlist | undefined> {
    return this.playlists.get(id);
  }

  async getPlaylistByYoutubeId(youtubeId: string): Promise<Playlist | undefined> {
    return Array.from(this.playlists.values()).find(
      (playlist) => playlist.youtubeId === youtubeId
    );
  }

  async getAllPlaylists(): Promise<Playlist[]> {
    return Array.from(this.playlists.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createPlaylist(insertPlaylist: InsertPlaylist): Promise<Playlist> {
    const id = randomUUID();
    const playlist: Playlist = { 
      ...insertPlaylist,
      description: insertPlaylist.description ?? null,
      thumbnailUrl: insertPlaylist.thumbnailUrl ?? null,
      id, 
      createdAt: new Date() 
    };
    this.playlists.set(id, playlist);
    return playlist;
  }

  async deletePlaylist(id: string): Promise<void> {
    this.playlists.delete(id);
    // Delete associated videos
    const playlistVideos = Array.from(this.videos.values()).filter(v => v.playlistId === id);
    playlistVideos.forEach(video => this.videos.delete(video.id));
  }

  async getVideo(id: string): Promise<Video | undefined> {
    return this.videos.get(id);
  }

  async getVideosByPlaylistId(playlistId: string): Promise<Video[]> {
    return Array.from(this.videos.values())
      .filter(video => video.playlistId === playlistId)
      .sort((a, b) => a.position - b.position);
  }

  async createVideo(insertVideo: InsertVideo): Promise<Video> {
    const id = randomUUID();
    const video: Video = { 
      ...insertVideo, 
      description: insertVideo.description ?? null,
      thumbnailUrl: insertVideo.thumbnailUrl ?? null,
      duration: insertVideo.duration ?? null,
      watchedAt: insertVideo.watchedAt ?? null,
      id 
    };
    this.videos.set(id, video);
    return video;
  }

  async updateVideoWatchStatus(id: string, isWatched: boolean): Promise<Video | undefined> {
    const video = this.videos.get(id);
    if (!video) return undefined;

    const updatedVideo: Video = {
      ...video,
      isWatched,
      watchedAt: isWatched ? new Date() : null,
    };
    this.videos.set(id, updatedVideo);
    return updatedVideo;
  }

  async getPlaylistProgress(playlistId: string): Promise<{ completed: number; total: number; percentage: number }> {
    const videos = await this.getVideosByPlaylistId(playlistId);
    const completed = videos.filter(v => v.isWatched).length;
    const total = videos.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
  }

  async getActiveStudySession(): Promise<StudySession | undefined> {
    return Array.from(this.studySessions.values()).find(s => s.isActive);
  }

  async createStudySession(insertSession: InsertStudySession): Promise<StudySession> {
    const id = randomUUID();
    const session: StudySession = {
      ...insertSession,
      duration: insertSession.duration ?? null,
      endTime: insertSession.endTime ?? null,
      id,
      startTime: new Date(),
    };
    this.studySessions.set(id, session);
    return session;
  }

  async updateStudySession(id: string, updates: Partial<StudySession>): Promise<StudySession | undefined> {
    const session = this.studySessions.get(id);
    if (!session) return undefined;

    const updatedSession: StudySession = { ...session, ...updates };
    this.studySessions.set(id, updatedSession);
    return updatedSession;
  }

  async getTodayStats(): Promise<{ videosCompleted: number; studyTime: number; currentStreak: number }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaySessions = Array.from(this.studySessions.values()).filter(s => {
      const sessionDate = new Date(s.startTime);
      sessionDate.setHours(0, 0, 0, 0);
      return sessionDate.getTime() === today.getTime();
    });

    const videosCompleted = todaySessions.reduce((sum, s) => sum + s.videosCompleted, 0);
    const studyTime = todaySessions.reduce((sum, s) => sum + (s.duration || 0), 0);

    // Simple streak calculation - consecutive days with sessions
    let currentStreak = 0;
    const checkDate = new Date();
    while (true) {
      checkDate.setHours(0, 0, 0, 0);
      const hasSessions = Array.from(this.studySessions.values()).some(s => {
        const sessionDate = new Date(s.startTime);
        sessionDate.setHours(0, 0, 0, 0);
        return sessionDate.getTime() === checkDate.getTime();
      });
      
      if (hasSessions) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return { videosCompleted, studyTime, currentStreak };
  }
}

export const storage = new MemStorage();
