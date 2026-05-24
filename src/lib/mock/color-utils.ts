// Converts a d3 color string (rgb(...) or #rrggbb) to a Deck.gl RGBA tuple
export function hexToRgba(
  colorStr: string,
  alpha: number
): [number, number, number, number] {
  const rgbMatch = colorStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (rgbMatch) {
    return [
      parseInt(rgbMatch[1]),
      parseInt(rgbMatch[2]),
      parseInt(rgbMatch[3]),
      Math.round(alpha * 255),
    ];
  }
  const hex = colorStr.startsWith("#") ? colorStr : `#${colorStr}`;
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
    Math.round(alpha * 255),
  ];
}
