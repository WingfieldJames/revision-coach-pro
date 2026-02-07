'use client';
import React, { useMemo } from 'react';
import { ChatbotFullscreenPaths } from './chatbot-fullscreen-paths';
import { DottedSurface } from './dotted-surface';
import { FlowFieldBackground } from './flow-field-background';

type BackgroundType = 'paths' | 'dotted' | 'flowfield';

export function RandomChatbotBackground() {
  const backgroundType = useMemo<BackgroundType>(() => {
    const options: BackgroundType[] = ['paths', 'dotted', 'flowfield'];
    const randomIndex = Math.floor(Math.random() * options.length);
    return options[randomIndex];
  }, []);

  switch (backgroundType) {
    case 'dotted':
      return <DottedSurface />;
    case 'flowfield':
      return <FlowFieldBackground color="#FF9A2E" trailOpacity={0.08} />;
    case 'paths':
    default:
      return <ChatbotFullscreenPaths />;
  }
}
