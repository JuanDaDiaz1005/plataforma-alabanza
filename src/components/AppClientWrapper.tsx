'use client'
import AudioPlayer from './audio/AudioPlayer';
import { useState } from 'react';

export default function AppClientWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <AudioPlayer />
    </>
  );
} 