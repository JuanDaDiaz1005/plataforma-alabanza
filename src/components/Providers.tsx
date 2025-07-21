'use client'

import { SessionProvider } from 'next-auth/react'
import { AudioPlayerProvider } from './audio/AudioPlayerContext'

interface ProvidersProps {
  children: React.ReactNode
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <AudioPlayerProvider>
        {children}
      </AudioPlayerProvider>
    </SessionProvider>
  )
} 