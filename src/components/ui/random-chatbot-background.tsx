'use client';
import React, { useMemo } from 'react';
import { ChatbotFullscreenPaths } from './chatbot-fullscreen-paths';
import { DottedSurface } from './dotted-surface';

type BackgroundType = 'paths' | 'dotted';

export function RandomChatbotBackground() {
  const backgroundType = useMemo<BackgroundType>(() => {
    const options: BackgroundType[] = ['paths', 'dotted'];
    const randomIndex = Math.floor(Math.random() * options.length);
    return options[randomIndex];
  }, []);

  switch (backgroundType) {
    case 'dotted':
      return <DottedSurface />;
    case 'paths':
    default:
      return <ChatbotFullscreenPaths />;
  }
}
