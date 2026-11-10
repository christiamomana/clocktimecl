import React from 'react';
import { Composition } from 'remotion';
import { DURATION, Historia } from './Historia';
import { FPS } from './theme';

export const Root: React.FC = () => (
  <Composition id="Historia" component={Historia} durationInFrames={DURATION} fps={FPS} width={1080} height={1920} />
);
