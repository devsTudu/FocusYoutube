import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const playlists = pgTable("playlists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  youtubeId: text("youtube_id").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  channelTitle: text("channel_title").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  videoCount: integer("video_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const videos = pgTable("videos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  youtubeId: text("youtube_id").notNull().unique(),
  playlistId: varchar("playlist_id").references(() => playlists.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  duration: text("duration"),
  position: integer("position").notNull(),
  isWatched: boolean("is_watched").default(false).notNull(),
  watchedAt: timestamp("watched_at"),
});

export const studySessions = pgTable("study_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  startTime: timestamp("start_time").defaultNow().notNull(),
  endTime: timestamp("end_time"),
  duration: integer("duration"), // in seconds
  videosCompleted: integer("videos_completed").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const insertPlaylistSchema = createInsertSchema(playlists).omit({
  id: true,
  createdAt: true,
});

export const insertVideoSchema = createInsertSchema(videos).omit({
  id: true,
});

export const insertStudySessionSchema = createInsertSchema(studySessions).omit({
  id: true,
  startTime: true,
});

export type InsertPlaylist = z.infer<typeof insertPlaylistSchema>;
export type Playlist = typeof playlists.$inferSelect;
export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type Video = typeof videos.$inferSelect;
export type InsertStudySession = z.infer<typeof insertStudySessionSchema>;
export type StudySession = typeof studySessions.$inferSelect;

// YouTube API types
export const youtubePlaylistSchema = z.object({
  url: z.string().url().refine((url) => {
    return url.includes('youtube.com/playlist') || url.includes('youtu.be/playlist');
  }, { message: "Must be a valid YouTube playlist URL" }),
});

export type YoutubePlaylistRequest = z.infer<typeof youtubePlaylistSchema>;
