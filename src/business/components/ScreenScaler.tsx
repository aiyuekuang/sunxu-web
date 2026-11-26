import React, { useEffect, useRef, useState } from 'react';
import './large-screen-components.css';

export const SCREEN_DESIGN_WIDTH = 1920;
export const SCREEN_DESIGN_HEIGHT = 1080;

export interface ScreenCanvasLayout {
  scale: number;
  width: number;
  height: number;
}

/** Short-side scale: the extra dimension stretches beyond the design canvas. */
export function computeCanvasLayout(
  clientWidth: number,
  clientHeight: number,
): ScreenCanvasLayout {
  if (clientWidth <= 0 || clientHeight <= 0) {
    return {
      scale: 1,
      width: SCREEN_DESIGN_WIDTH,
      height: SCREEN_DESIGN_HEIGHT,
    };
  }

  const scale = Math.min(
    clientWidth / SCREEN_DESIGN_WIDTH,
    clientHeight / SCREEN_DESIGN_HEIGHT,
  );
  return {
    scale,
    width: clientWidth / scale,
    height: clientHeight / scale,
  };
}

function getInitialLayout(): ScreenCanvasLayout {
  if (typeof window === 'undefined') {
    return {
      scale: 1,
      width: SCREEN_DESIGN_WIDTH,
      height: SCREEN_DESIGN_HEIGHT,
    };
  }
  return computeCanvasLayout(window.innerWidth, window.innerHeight);
}

/**
 * @sunxu-layer business
 * @sunxu-domain large-screen dashboard canvas
 * @sunxu-reason MES large-screen pages share the 1920 × 1080 short-side scaling contract.
 *
 * Fills the viewport and resizes the design canvas to preserve its 16:9 baseline
 * while allowing the long side to stretch into the remaining space.
 */
export function ScreenScaler({ children }: { children: React.ReactNode }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState(getInitialLayout);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return undefined;

    const updateLayout = () => {
      const { clientWidth, clientHeight } = viewport;
      if (clientWidth > 0 && clientHeight > 0) {
        setLayout(computeCanvasLayout(clientWidth, clientHeight));
      }
    };

    updateLayout();
    const observer = new ResizeObserver(updateLayout);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={viewportRef} className="sunxu-mes-screen-scaler-viewport">
      <div
        className="sunxu-mes-screen-scaler-canvas"
        style={{
          width: layout.width,
          height: layout.height,
          transform: `scale(${layout.scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
