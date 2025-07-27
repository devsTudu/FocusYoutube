import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pause, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTimer } from "@/hooks/use-timer";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { StudySession } from "@shared/schema";

export default function StudyTimer() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRunning, setIsRunning] = useState(false);

  const { data: activeSession } = useQuery<StudySession | null>({
    queryKey: ["/api/study-session/active"],
  });

  const { time, start, pause, reset } = useTimer({
    initialTime: 0,
    onTick: (currentTime) => {
      // Update session every minute
      if (currentTime % 60 === 0 && activeSession) {
        updateSessionMutation.mutate({
          id: activeSession.id,
          videosCompleted: activeSession.videosCompleted,
        });
      }
    },
  });

  const startSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/study-session", {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study-session/active"] });
      start();
      setIsRunning(true);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to start study session",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateSessionMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const response = await apiRequest("PATCH", `/api/study-session/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study-session/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/today"] });
    },
  });

  const handleStart = () => {
    if (!activeSession) {
      startSessionMutation.mutate();
    } else {
      start();
      setIsRunning(true);
    }
  };

  const handlePause = () => {
    pause();
    setIsRunning(false);
  };

  const handleStop = () => {
    if (activeSession) {
      updateSessionMutation.mutate({
        id: activeSession.id,
        isActive: false,
        endTime: new Date().toISOString(),
      });
    }
    reset();
    setIsRunning(false);
    toast({
      title: "Study session ended",
      description: `Great work! You studied for ${formatTime(time)}.`,
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-apple-dark mb-4">Study Session</h3>
      <div className="text-center">
        <div className="text-3xl font-bold text-apple-blue mb-2">
          {formatTime(time)}
        </div>
        <p className="text-sm text-apple-gray mb-4">Current Session</p>
        <div className="flex space-x-2">
          {!isRunning ? (
            <Button
              onClick={handleStart}
              className="flex-1 bg-apple-blue hover:bg-blue-600 text-white"
              disabled={startSessionMutation.isPending}
            >
              <Play className="mr-1" size={16} />
              {time === 0 ? "Start" : "Resume"}
            </Button>
          ) : (
            <Button
              onClick={handlePause}
              className="flex-1 bg-apple-blue hover:bg-blue-600 text-white"
            >
              <Pause className="mr-1" size={16} />
              Pause
            </Button>
          )}
          <Button
            onClick={handleStop}
            variant="outline"
            className="flex-1 border-gray-300 text-apple-gray hover:bg-gray-50"
            disabled={time === 0}
          >
            <Square className="mr-1" size={16} />
            Stop
          </Button>
        </div>
      </div>
    </div>
  );
}
