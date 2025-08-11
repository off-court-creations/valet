// src/pages/ParallaxDemo.tsx
import React from 'react';
import { Surface, Typography, Button } from '@archway/valet';

import { ParallaxScroll, ParallaxBackground, ParallaxLayer } from '@archway/valet';

import prettyScroll from '../assets/pretty-scroll.jpg';

/**
 * ParallaxDemo
 * ------------
 * A full-viewport demo of ZeroUI’s parallax utilities.
 *
 * - Background: pretty-scroll.jpg
 * - Mid-layer: translucent overlay copy
 * - Foreground: call-to-action button
 */
export const ParallaxDemo: React.FC = () => {
  return (
    <Surface>
      <ParallaxScroll style={{ minHeight: '220vh' }}>
        {/* BACKGROUND IMAGE (moves slowly) */}
        <ParallaxBackground
          src={prettyScroll}
          speed={0.3}
        />

        {/* MID-GROUND COPY (slightly slower than scroll) */}
        <ParallaxLayer
          speed={0.6}
          style={{ marginTop: '30vh' }}
        >
          <div
            style={{
              maxWidth: 600,
              margin: '0 auto',
              padding: '2rem',
              background: 'rgba(0,0,0,0.45)',
              borderRadius: 16,
              textAlign: 'center',
            }}
          >
            <Typography
              variant='h1'
              style={{ color: '#fff' }}
            >
              zeroui
              <br />
              Parallax
            </Typography>
            <Typography
              variant='subtitle'
              style={{ color: '#fff', marginTop: 16, lineHeight: 1.4 }}
            >
              Smooth, GPU-accelerated scrolling with zero extra dependencies—and it works inside
              any&nbsp;<code>&lt;Surface&gt;</code>.
            </Typography>
          </div>
        </ParallaxLayer>

        {/* FOREGROUND BUTTON (moves a bit faster) */}
        <ParallaxLayer
          speed={1}
          style={{ marginTop: '110vh', textAlign: 'center' }}
        >
          <Button
            size='lg'
            variant='contained'
          >
            Get Started →
          </Button>
        </ParallaxLayer>
      </ParallaxScroll>
    </Surface>
  );
};

export default ParallaxDemo;
