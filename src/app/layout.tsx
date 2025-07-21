
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import AudioPlayer from '@/components/audio/AudioPlayer';
import AppClientWrapper from '@/components/AppClientWrapper';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Plataforma Alabanza",
  description: "Gestión integral para equipos de alabanza y adoración",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Elimina la lógica de usePathname/useRouter/useEffect para redirección
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <AppClientWrapper>
            {children}
          </AppClientWrapper>
        </Providers>
      </body>
    </html>
  );
}
