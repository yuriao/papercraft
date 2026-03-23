/** Given n panels, return the nearest-square grid dimensions */
export function getGridDimensions(n: number): { cols: number; rows: number } {
  if (n === 0) return { cols: 1, rows: 1 }
  const cols = Math.ceil(Math.sqrt(n))
  const rows = Math.ceil(n / cols)
  return { cols, rows }
}

/** Returns the total number of cells in the grid (including empty slots) */
export function getGridCellCount(n: number): number {
  const { cols, rows } = getGridDimensions(n)
  return cols * rows
}
