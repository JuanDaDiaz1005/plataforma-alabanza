'use client'
import AudioPlayer from './audio/AudioPlayer';

export default function AppClientWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <AudioPlayer />
    </>
  );
} 