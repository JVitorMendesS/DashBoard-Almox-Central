import React from 'react';

// Code 39 encoding map
// 1 = black bar, 0 = white space
// Each character contains 9 elements (5 bars, 4 spaces)
// Pattern encoding: 'W' for wide, 'N' for narrow
// We map them to an SVG string or sequence of elements
// For simplicity and complete reliability, here is a standard pattern for each char:
const CODE39_PATTERNS: Record<string, string> = {
  '0': 'N-N-N-W-W-N-W-N-N',
  '1': 'W-N-N-W-N-N-N-N-W',
  '2': 'N-N-W-W-N-N-N-N-W',
  '3': 'W-N-W-W-N-N-N-N-N',
  '4': 'N-N-N-W-W-N-N-N-W',
  '5': 'W-N-N-W-W-N-N-N-N',
  '6': 'N-N-W-W-W-N-N-N-N',
  '7': 'N-N-N-W-N-N-W-N-W',
  '8': 'W-N-N-W-N-N-W-N-N',
  '9': 'N-N-W-W-N-N-W-N-N',
  'A': 'W-N-N-N-N-W-N-N-W',
  'B': 'N-N-W-N-N-W-N-N-W',
  'C': 'W-N-W-N-N-W-N-N-N',
  'D': 'N-N-N-N-W-W-N-N-W',
  'E': 'W-N-N-N-W-W-N-N-N',
  'F': 'N-N-W-N-W-W-N-N-N',
  'G': 'N-N-N-N-N-W-W-N-W',
  'H': 'W-N-N-N-N-W-W-N-N',
  'I': 'N-N-W-N-N-W-W-N-N',
  'J': 'N-N-N-N-W-W-W-N-N',
  'K': 'W-N-N-N-N-N-N-W-W',
  'L': 'N-N-W-N-N-N-N-W-W',
  'M': 'W-N-W-N-N-N-N-W-N',
  'N': 'N-N-N-N-W-N-N-W-W',
  'O': 'W-N-N-N-W-N-N-W-N',
  'P': 'N-N-W-N-W-N-N-W-N',
  'Q': 'N-N-N-N-N-N-W-W-W',
  'R': 'W-N-N-N-N-N-W-W-N',
  'S': 'N-N-W-N-N-N-W-W-N',
  'T': 'N-N-N-N-W-N-W-W-N',
  'U': 'W-W-N-N-N-N-N-N-W',
  'V': 'N-W-W-N-N-N-N-N-W',
  'W': 'W-W-W-N-N-N-N-N-N',
  'X': 'N-W-N-N-W-N-N-N-W',
  'Y': 'W-W-N-N-W-N-N-N-N',
  'Z': 'N-W-W-N-W-N-N-N-N',
  '-': 'N-W-N-N-N-N-W-N-W',
  '.': 'W-W-N-N-N-N-W-N-N',
  ' ': 'N-W-W-N-N-N-W-N-N',
  '*': 'N-W-N-N-W-N-W-N-N'
};

interface BarcodeGeneratorProps {
  value: string;
  height?: number;
  showText?: boolean;
}

export default function BarcodeGenerator({ value, height = 55, showText = true }: BarcodeGeneratorProps) {
  // Sanitize input to uppercase and allowed characters. Code 39 supports capitals, digits, and a few symbols.
  const formattedValue = value.toUpperCase().replace(/[^A-Z0-9.\- ]/g, '');
  const testString = `*${formattedValue}*`; // Code 39 starts and ends with asterisk

  // We convert the 'W' (wide) and 'N' (narrow) sequence to actual bar/space widths
  // Standard ratio: Wide is 2.5 to 3 times the width of narrow. Let's use 2.5.
  const wWidth = 3;
  const nWidth = 1.1;

  let elements: { type: 'bar' | 'space'; width: number }[] = [];

  for (let i = 0; i < testString.length; i++) {
    const char = testString[i];
    const pattern = CODE39_PATTERNS[char] || CODE39_PATTERNS[' ']; // fallback to space
    const parts = pattern.split('-');

    // Each character is 9 bars/spaces: 5 bars (odd indices 0,2,4,6,8) and 4 spaces (even indices 1,3,5,7)
    for (let pIndex = 0; pIndex < parts.length; pIndex++) {
      const isBar = pIndex % 2 === 0;
      const isWide = parts[pIndex] === 'W';
      const width = isWide ? wWidth : nWidth;

      elements.push({
        type: isBar ? 'bar' : 'space',
        width: width
      });
    }

    // Add inter-character gap (always narrow space)
    if (i < testString.length - 1) {
      elements.push({
        type: 'space',
        width: nWidth
      });
    }
  }

  // Calculate total SVG width
  const totalWidth = elements.reduce((acc, el) => acc + el.width, 0);

  // Accumulate X coordinates to draw rects
  let currentX = 0;
  const rects: React.ReactNode[] = [];

  elements.forEach((el, index) => {
    if (el.type === 'bar') {
      rects.push(
        <rect
          key={index}
          x={currentX}
          y={0}
          width={el.width}
          height={height}
          fill="currentColor"
          className="text-gray-900 dark:text-white"
        />
      );
    }
    currentX += el.width;
  });

  return (
    <div className="flex flex-col items-center justify-center p-3 bg-white rounded-none shadow-sm border-2 border-slate-900 max-w-fit pointer-events-auto">
      <svg
        width={totalWidth + 20}
        height={height + 5}
        viewBox={`-10 0 ${totalWidth + 20} ${height + 5}`}
        className="text-slate-950"
      >
        <g>{rects}</g>
      </svg>
      {showText && (
        <span className="mt-2 font-mono text-[10px] tracking-[0.2em] text-slate-950 font-black uppercase">
          {formattedValue}
        </span>
      )}
    </div>
  );
}
