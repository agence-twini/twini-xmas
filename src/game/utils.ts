export function rectsOverlap(
  a: { x: number; y: number },
  b: { x: number; y: number },
  aw: number,
  ah: number,
  bw: number,
  bh: number,
): boolean {
  return a.x < b.x + bw && a.x + aw > b.x && a.y < b.y + bh && a.y + ah > b.y
}
