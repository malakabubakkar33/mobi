import React from 'react';
import { ViewportMode, ViewportConfig } from '../types';
import {
  Maximize2,
  Smartphone,
  Tablet,
  Monitor,
  RotateCw,
} from 'lucide-react';

export const VIEWPORTS: Record<ViewportMode, ViewportConfig> = {
  responsive: {
    id: 'responsive',
    name: 'Full Window',
    width: '100%',
    height: '100%',
    isMobileDevice: false,
  },
  'iphone-15-pro': {
    id: 'iphone-15-pro',
    name: 'iPhone 15 Pro',
    width: 393,
    height: 852,
    devicePixelRatio: 3,
    isMobileDevice: true,
  },
  'iphone-se': {
    id: 'iphone-se',
    name: 'iPhone SE',
    width: 375,
    height: 667,
    devicePixelRatio: 2,
    isMobileDevice: true,
  },
  'ipad-mini': {
    id: 'ipad-mini',
    name: 'iPad Mini',
    width: 768,
    height: 1024,
    devicePixelRatio: 2,
    isMobileDevice: true,
  },
  desktop: {
    id: 'desktop',
    name: 'Desktop (1280×800)',
    width: 1280,
    height: 800,
    isMobileDevice: false,
  },
};

interface ViewportSwitcherProps {
  currentMode: ViewportMode;
  onSelectMode: (mode: ViewportMode) => void;
  isLandscape: boolean;
  onToggleOrientation: () => void;
}

export const ViewportSwitcher: React.FC<ViewportSwitcherProps> = ({
  currentMode,
  onSelectMode,
  isLandscape,
  onToggleOrientation,
}) => {
  const isDevice = currentMode !== 'responsive' && currentMode !== 'desktop';

  return (
    <div className="flex items-center gap-1 bg-mobi-gray-50 p-1 border border-mobi-border rounded-lg text-xs">
      <button
        onClick={() => onSelectMode('responsive')}
        title="Full Screen / Fluid Window"
        className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 font-medium transition-all ${
          currentMode === 'responsive'
            ? 'bg-white text-mobi-green shadow-xs border border-mobi-border'
            : 'text-mobi-charcoal-light hover:text-mobi-charcoal'
        }`}
      >
        <Maximize2 className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Fluid</span>
      </button>

      <button
        onClick={() => onSelectMode('iphone-15-pro')}
        title="iPhone 15 Pro (393 × 852)"
        className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 font-medium transition-all ${
          currentMode === 'iphone-15-pro'
            ? 'bg-white text-mobi-green shadow-xs border border-mobi-border'
            : 'text-mobi-charcoal-light hover:text-mobi-charcoal'
        }`}
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span className="hidden md:inline">iPhone 15</span>
      </button>

      <button
        onClick={() => onSelectMode('iphone-se')}
        title="iPhone SE (375 × 667)"
        className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 font-medium transition-all ${
          currentMode === 'iphone-se'
            ? 'bg-white text-mobi-green shadow-xs border border-mobi-border'
            : 'text-mobi-charcoal-light hover:text-mobi-charcoal'
        }`}
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span className="hidden lg:inline">iPhone SE</span>
      </button>

      <button
        onClick={() => onSelectMode('ipad-mini')}
        title="iPad Mini (768 × 1024)"
        className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 font-medium transition-all ${
          currentMode === 'ipad-mini'
            ? 'bg-white text-mobi-green shadow-xs border border-mobi-border'
            : 'text-mobi-charcoal-light hover:text-mobi-charcoal'
        }`}
      >
        <Tablet className="w-3.5 h-3.5" />
        <span className="hidden lg:inline">iPad</span>
      </button>

      <button
        onClick={() => onSelectMode('desktop')}
        title="Desktop Preset (1280 × 800)"
        className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 font-medium transition-all ${
          currentMode === 'desktop'
            ? 'bg-white text-mobi-green shadow-xs border border-mobi-border'
            : 'text-mobi-charcoal-light hover:text-mobi-charcoal'
        }`}
      >
        <Monitor className="w-3.5 h-3.5" />
        <span className="hidden xl:inline">1280px</span>
      </button>

      {isDevice && (
        <button
          onClick={onToggleOrientation}
          title={`Rotate Orientation (${isLandscape ? 'Landscape' : 'Portrait'})`}
          className="p-1 rounded-md text-mobi-charcoal-light hover:text-mobi-green hover:bg-white transition-all ml-0.5 border border-transparent hover:border-mobi-border"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

