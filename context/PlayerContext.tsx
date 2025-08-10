import React, { createContext, useCallback, useMemo, useState } from 'react';
import { Media } from '../types';

export type PlayerContextValue = {
  isPlaying: boolean;
  currentMedia: Media | null;
  videoUrl: string | null;
  play: (media: Media) => void;
  stop: () => void;
};

export const PlayerContext = createContext<PlayerContextValue>({} as PlayerContextValue);

function getTrailerUrlFor(media: Media): string {
  const local = (media as any).videoUrl as string | undefined;
  if (local && local.length > 0) return local;
  const samples = [
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4'
  ];
  const index = media.id % samples.length;
  return samples[index];
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMedia, setCurrentMedia] = useState<Media | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const stop = useCallback(() => {
    setIsPlaying(false);
    setCurrentMedia(null);
    setVideoUrl(null);
  }, []);

  const play = useCallback((media: Media) => {
    setCurrentMedia(media);
    setVideoUrl(getTrailerUrlFor(media));
    setIsPlaying(true);
  }, []);

  const value = useMemo(
    () => ({ isPlaying, currentMedia, videoUrl, play, stop }),
    [isPlaying, currentMedia, videoUrl, play, stop]
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
} 