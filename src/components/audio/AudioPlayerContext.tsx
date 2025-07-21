'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

export interface AudioTrack {
  id: string;
  title: string;
  artist?: string;
  url: string;
  cover?: string;
}

interface AudioPlayerContextProps {
  currentTrack: AudioTrack | null;
  setTrack: (track: AudioTrack) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  play: () => void;
  pause: () => void;
  clearTrack: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextProps | undefined>(undefined);

export const AudioPlayerProvider = ({ children }: { children: ReactNode }) => {
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const { data: session } = useSession();

  // Al montar, intenta cargar la última canción del localStorage
  useEffect(() => {
    const last = localStorage.getItem('lastAudioTrack');
    if (last) {
      try {
        const track = JSON.parse(last);
        setCurrentTrack(track);
        setIsPlaying(false); // No auto-reproducir
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (currentTrack) {
      localStorage.setItem('lastAudioTrack', JSON.stringify(currentTrack));
    }
  }, [currentTrack]);

  const setTrack = (track: AudioTrack) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    // Ya no guardar en base de datos
  };

  const play = () => setIsPlaying(true);
  const pause = () => setIsPlaying(false);

  const clearTrack = () => {
    setCurrentTrack(null);
    setIsPlaying(false);
    localStorage.removeItem('lastAudioTrack');
  };

  return (
    <AudioPlayerContext.Provider value={{ currentTrack, setTrack, isPlaying, setIsPlaying, play, pause, clearTrack }}>
      {children}
    </AudioPlayerContext.Provider>
  );
};

export const useAudioPlayer = () => {
  const context = useContext(AudioPlayerContext);
  if (!context) throw new Error('useAudioPlayer debe usarse dentro de AudioPlayerProvider');
  return context;
}; 