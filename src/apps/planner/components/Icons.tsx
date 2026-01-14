
import React from 'react';

export const MarvellousLogo: React.FC<{ className?: string, mode?: 'dark' | 'light' }> = ({ className = "h-10", mode = 'dark' }) => {
  const fillColor = mode === 'dark' ? '#111827' : '#FFFFFF'; // gray-900 or white
  const subFillColor = mode === 'dark' ? '#4B5563' : '#E5E7EB'; // gray-600 or gray-200
  
  return (
    <svg viewBox="0 0 400 80" className={`${className} select-none`} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Icon Shape */}
      <g transform="translate(0, 0)">
         <path d="M0 10 L15 10 L25 40 L35 10 L50 10 L50 70 L38 70 L38 35 L30 60 L20 60 L12 35 L12 70 L0 70 Z" fill={fillColor} />
         <path d="M60 10 L100 10 L100 22 L75 22 L75 34 L95 34 L95 46 L75 46 L75 58 L100 58 L100 70 L60 70 Z" fill={fillColor} />
      </g>
      
      {/* Divider */}
      <rect x="115" y="10" width="1" height="60" fill={fillColor} fillOpacity="0.2" />

      {/* Text as SVG Paths/Text for export stability */}
      <text x="130" y="42" fontFamily="sans-serif" fontWeight="bold" fontSize="28" fill={fillColor}>麦迩威教育</text>
      <text x="130" y="68" fontFamily="sans-serif" fontWeight="500" fontSize="11" letterSpacing="0.15em" fill={subFillColor} style={{ textTransform: 'uppercase' }}>Marvellous Education</text>
    </svg>
  );
};

export const Watermark: React.FC = () => {
  // SVG Pattern for repeating watermark
  const svgString = encodeURIComponent(`
    <svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
      <style>
        .text { fill: #111827; font-family: sans-serif; font-weight: 900; opacity: 0.04; font-size: 24px; }
        .sub { fill: #111827; font-family: sans-serif; font-weight: 700; opacity: 0.04; font-size: 14px; letter-spacing: 2px; }
      </style>
      <g transform="translate(150, 150) rotate(-45)">
        <text x="0" y="0" text-anchor="middle" class="text">麦迩威教育</text>
        <text x="0" y="25" text-anchor="middle" class="sub">MARVELLOUS</text>
      </g>
    </svg>
  `);

  return (
    <div 
      className="absolute inset-0 z-[0] pointer-events-none print:block"
      style={{
        backgroundImage: `url("data:image/svg+xml;charset=utf-8,${svgString}")`,
        backgroundRepeat: 'repeat',
        backgroundPosition: 'center',
        // Ensure it covers full height even if content grows
        height: '100%',
        width: '100%'
      }}
    />
  );
};
