'use client'
import AudioPlayer from './audio/AudioPlayer';
import { useSession } from 'next-auth/react';
import { useAudioPlayer } from './audio/AudioPlayerContext';

export default function AppClientWrapper({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const { currentTrack } = useAudioPlayer();
  // Solo muestra el reproductor si hay sesión iniciada y hay pista activa
  const mostrarAudioPlayer = !!session && !!currentTrack;
  return (
    <>
      {children}
      {mostrarAudioPlayer && <AudioPlayer />}
    </>
  );
}