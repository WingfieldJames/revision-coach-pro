'use client';
import React, { useMemo } from 'react';
import { DottedSurface } from './dotted-surface';
import { FlowFieldBackground } from './flow-field-background';

type BackgroundType = 'dotted' | 'flowfield';

export function RandomChatbotBackground() {
  const backgroundType = useMemo<BackgroundType>(() => {
    const options: BackgroundType[] = ['dotted', 'flowfield'];
    const randomIndex = Math.floor(Math.random() * options.length);
    return options[randomIndex];
  }, []);

  switch (backgroundType) {
    case 'dotted':
      return <DottedSurface />;
    case 'flowfield':
    default:
      return <FlowFieldBackground color="#FF9A2E" trailOpacity={0.08} />;
  }
}
