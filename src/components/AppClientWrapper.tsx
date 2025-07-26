'use client'
import AudioPlayer from './audio/AudioPlayer';
import { useSession } from 'next-auth/react';
import { useAudioPlayer } from './audio/AudioPlayerContext';
import { usePathname } from 'next/navigation';

export default function AppClientWrapper({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const { currentTrack } = useAudioPlayer();
  const pathname = usePathname();
  
  // Rutas donde NO se debe mostrar el reproductor
  const rutasExcluidas = ['/auth/login', '/auth', '/'];
  const estaEnRutaExcluida = rutasExcluidas.some(ruta => pathname === ruta || pathname.startsWith(ruta + '/'));
  
  // Solo muestra el reproductor si hay sesión iniciada, hay pista activa y no estamos en una ruta excluida
  const mostrarAudioPlayer = !!session && !!currentTrack && !estaEnRutaExcluida;
  
  return (
    <>
      {children}
      {mostrarAudioPlayer && <AudioPlayer />}
    </>
  );
}