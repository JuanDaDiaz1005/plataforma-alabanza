'use client';
import React, { useRef, useEffect, useState } from 'react';
import { useAudioPlayer } from './AudioPlayerContext';
import { Play, Pause, Volume2, VolumeX, Download, RotateCcw } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { SidebarContext } from '../Layout';

export default function AudioPlayer() {
  const { data: session, status } = useSession();
  const { currentTrack, isPlaying, play, pause, setIsPlaying } = useAudioPlayer();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoop, setIsLoop] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const { sidebarOpen } = React.useContext(SidebarContext);

  useEffect(() => {
    const handleResize = () => {
      setSidebarVisible(window.innerWidth >= 1024); // lg breakpoint
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play();
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentTrack]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  if (status !== 'authenticated') return null;
  if (!currentTrack) return null;

  const formatearDuracion = (segundos: number) => {
    if (isNaN(segundos)) return '0:00';
    const minutos = Math.floor(segundos / 60);
    const segs = Math.floor(segundos % 60);
    return `${minutos}:${segs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`fixed bottom-0 right-0 z-40 ${sidebarOpen ? 'bg-black/60' : 'bg-white'} border-t shadow flex flex-col sm:flex-row items-center p-2 sm:p-5 ${sidebarVisible ? 'w-[calc(100%-16rem)]' : 'w-full'}`}>
      <div className="w-full flex flex-col items-center mb-1">
        <span className="font-semibold text-gray-900 text-xs sm:text-sm truncate w-full text-center">
          {currentTrack.title || 'Sin título'}
        </span>
        {currentTrack.artist && (
          <span className="text-xs text-gray-500 truncate w-full text-center">{currentTrack.artist}</span>
        )}
      </div>
      <audio
        ref={audioRef}
        src={currentTrack.url}
        onEnded={() => {
          if (isLoop && audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play();
          } else {
            setIsPlaying(false);
          }
        }}
        preload="auto"
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      {currentTrack.cover && (
        <img src={currentTrack.cover} alt="cover" className="w-10 h-10 rounded object-cover" />
      )}
      <div className="flex flex-wrap items-center gap-2 w-full justify-center sm:justify-start">
        <button
          onClick={isPlaying ? pause : play}
          className="rounded-full bg-purple-100 hover:bg-purple-200 p-2 text-purple-700 transition"
          aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
        >
          {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
        </button>
        <button
          onClick={() => {
            if (audioRef.current?.src) {
              window.open(audioRef.current.src, '_blank');
            }
          }}
          className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
          title="Descargar"
        >
          <Download className="h-5 w-5" />
        </button>
        <button
          onClick={() => setIsLoop(!isLoop)}
          className={`p-2 rounded-md transition-colors ${isLoop ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}
          title="Repetir"
        >
          <RotateCcw className="h-5 w-5" />
        </button>
        <button onClick={() => setIsMuted(!isMuted)} className="text-gray-600 hover:text-gray-900">
          {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={e => setVolume(parseFloat(e.target.value))}
          className="w-20 sm:w-24"
        />
        <div className="text-xs text-gray-600 min-w-[60px] sm:min-w-[80px] text-right">
          {formatearDuracion(currentTime)} / {formatearDuracion(duration)}
        </div>
      </div>
      <input
        type="range"
        min="0"
        max={duration || 0}
        value={currentTime}
        onChange={e => {
          if (audioRef.current) {
            audioRef.current.currentTime = parseFloat(e.target.value);
            setCurrentTime(parseFloat(e.target.value));
          }
        }}
        className="w-full mt-2 sm:mt-0"
      />
    </div>
  );
} 