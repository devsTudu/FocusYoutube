import { useQuery } from "@tanstack/react-query";

interface TodayStats {
  videosCompleted: number;
  studyTime: number;
  currentStreak: number;
}

export default function StudyStats() {
  const { data: stats = { videosCompleted: 0, studyTime: 0, currentStreak: 0 } } = useQuery<TodayStats>({
    queryKey: ["/api/stats/today"],
  });

  const formatStudyTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-apple-dark mb-4">Today's Progress</h3>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-apple-gray">Videos Completed</span>
          <span className="font-semibold text-apple-blue">{stats.videosCompleted}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-apple-gray">Study Time</span>
          <span className="font-semibold text-apple-green">{formatStudyTime(stats.studyTime)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-apple-gray">Current Streak</span>
          <span className="font-semibold text-apple-orange">{stats.currentStreak} days</span>
        </div>
      </div>
    </div>
  );
}
