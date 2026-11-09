import React from 'react';
import { DevServerInfo } from '../types';
import { Radio, ArrowUpRight } from 'lucide-react';

interface DevServersBannerProps {
  servers: DevServerInfo[];
  onSelectServer: (url: string) => void;
}

export const DevServersBanner: React.FC<DevServersBannerProps> = ({ servers, onSelectServer }) => {
  if (!servers || servers.length === 0) return null;

  return (
    <div className="w-full max-w-xl mx-auto mb-6 bg-mobi-green-subtle border border-mobi-green-border rounded-xl p-3.5 shadow-subtle transition-all duration-200">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-mobi-green opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-mobi-green"></span>
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-mobi-green">
            Active Dev Server{servers.length > 1 ? 's' : ''} Detected
          </span>
        </div>
        <span className="text-[11px] text-mobi-charcoal-light">Localhost Bridge</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {servers.map((server) => (
          <button
            key={server.port}
            onClick={() => onSelectServer(server.url)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-mobi-green-border hover:border-mobi-green rounded-lg text-xs font-medium text-mobi-charcoal hover:text-mobi-green transition-all shadow-xs group"
          >
            <Radio className="w-3.5 h-3.5 text-mobi-green group-hover:scale-110 transition-transform" />
            <span>{server.framework}</span>
            <span className="font-mono text-mobi-charcoal-light group-hover:text-mobi-green">:{server.port}</span>
            <ArrowUpRight className="w-3 h-3 text-mobi-charcoal-light group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        ))}
      </div>
    </div>
  );
};

