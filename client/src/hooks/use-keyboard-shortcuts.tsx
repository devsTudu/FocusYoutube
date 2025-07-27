import { useEffect } from "react";

interface KeyboardShortcutsProps {
  onNext?: () => void;
  onPrevious?: () => void;
  onMarkComplete?: () => void;
  onPlayPause?: () => void;
}

export function useKeyboardShortcuts({
  onNext,
  onPrevious,
  onMarkComplete,
  onPlayPause,
}: KeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when user is typing in an input
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.key) {
        case "ArrowRight":
          event.preventDefault();
          onNext?.();
          break;
        case "ArrowLeft":
          event.preventDefault();
          onPrevious?.();
          break;
        case "c":
        case "C":
          event.preventDefault();
          onMarkComplete?.();
          break;
        case " ":
          event.preventDefault();
          onPlayPause?.();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onNext, onPrevious, onMarkComplete, onPlayPause]);
}
