# YouTube Study Playlists Application

## Overview

This is a full-stack web application that helps users manage and track their study progress through YouTube playlists. The application allows users to add YouTube playlists, track video completion status, and monitor their study sessions with timing and progress statistics. Videos are played directly within the app using an embedded YouTube player for a distraction-free learning experience.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with a custom design system inspired by Apple's aesthetic
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Style**: RESTful API endpoints
- **Development**: Hot reloading with Vite integration for full-stack development

### Data Storage Solutions
- **Database**: PostgreSQL configured for production
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema synchronization
- **Development Storage**: In-memory storage implementation for development/testing

### External Service Integrations
- **YouTube API**: Integration for fetching playlist and video metadata
- **Neon Database**: Serverless PostgreSQL provider for production hosting

## Key Components

### Database Schema
- **Playlists Table**: Stores YouTube playlist metadata (title, description, channel, thumbnail, video count)
- **Videos Table**: Individual video information with watch status and position tracking
- **Study Sessions Table**: Time tracking for study sessions with completion metrics

### API Endpoints
- `GET /api/playlists` - Retrieve all user playlists with progress
- `POST /api/playlists` - Add new YouTube playlist
- `DELETE /api/playlists/:id` - Remove playlist
- `GET /api/playlists/:id` - Get specific playlist with videos
- `PATCH /api/videos/:id/watch-status` - Update video completion status
- `GET /api/stats/today` - Get daily study statistics
- `POST /api/study-session` - Start new study session
- `PATCH /api/study-session/:id` - Update study session

### Frontend Components
- **Dashboard**: Main application view with playlist management
- **Playlist Input**: YouTube URL input with validation
- **Video Player**: Embedded YouTube player using IFrame API for in-app video playback
- **Study Timer**: Session timing with automatic progress tracking
- **Progress Tracking**: Visual progress indicators and statistics with real-time updates
- **Keyboard Shortcuts**: Navigation and video completion controls

## Data Flow

1. **Playlist Addition**: User inputs YouTube playlist URL → API validates and fetches metadata → Stores playlist and video data
2. **Video Tracking**: User marks videos as watched → Updates database → Recalculates playlist progress
3. **Study Sessions**: Timer tracks study time → Periodically updates session duration → Calculates daily statistics
4. **Progress Display**: Real-time updates via React Query invalidation and refetching

## External Dependencies

### Core Dependencies
- **Database**: `@neondatabase/serverless`, `drizzle-orm`, `drizzle-zod`
- **UI Framework**: `@radix-ui/*` components, `class-variance-authority`, `tailwindcss`
- **State Management**: `@tanstack/react-query`
- **Development**: `vite`, `tsx`, `esbuild`

### API Integrations
- YouTube Data API v3 for playlist and video metadata
- Requires `YOUTUBE_API_KEY` environment variable

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds React application to `dist/public`
- **Backend**: esbuild bundles Express server to `dist/index.js`
- **Database**: Drizzle migrations applied via `db:push` command

### Environment Configuration
- **Development**: Uses Vite dev server with Express middleware integration
- **Production**: Serves static frontend files through Express with API routes
- **Database**: PostgreSQL connection via `DATABASE_URL` environment variable

### Development Workflow
- Single command development with `npm run dev`
- Automatic TypeScript compilation and hot reloading
- Shared types between frontend and backend via `shared/` directory

The application follows a traditional full-stack architecture with clear separation between client and server code, unified by TypeScript and modern tooling for an efficient development experience.