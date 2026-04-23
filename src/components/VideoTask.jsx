import { useState, useRef } from "react";
import { CheckCircle, Play } from "lucide-react";

/**
 * Extract YouTube video ID from various YouTube URL formats
 * Supports: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID, etc.
 */
export function extractYouTubeId(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

export default function VideoTask({ task, onComplete }) {
  const [videoWatched, setVideoWatched] = useState(false);
  const videoRef = useRef(null);

  // Get video URL from task data (admin-controlled)
  const videoUrl = task.videoUrl || task.url || "";
  const videoId = extractYouTubeId(videoUrl);

  // Fallback video if no valid URL provided
  const fallbackVideoId = "dQw4w9WgXcQ";
  const embedId = videoId || fallbackVideoId;

  const handleVideoLoad = () => {
    setVideoWatched(true);
  };

  return (
    <div className="space-y-4">
      <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
        <iframe
          ref={videoRef}
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${embedId}?autoplay=0&mute=0&rel=0`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={handleVideoLoad}
          className="absolute inset-0"
        />
      </div>

      {!videoId && videoUrl && (
        <div className="card bg-warning/10 border-warning/20 p-3 text-sm text-warning">
          Invalid YouTube URL provided. Showing fallback video.
        </div>
      )}

      <p className="text-sm text-text-muted text-center">
        Watch the video above to complete this task
      </p>

      <button
        onClick={onComplete}
        className="btn-success w-full flex items-center justify-center gap-2"
      >
        <CheckCircle className="w-5 h-5" />
        I Watched the Video — Complete Task
      </button>
    </div>
  );
}
