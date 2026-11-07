// Small, deterministic teaching examples. They are not research experiment outputs.
export const poseSequenceA = [0, 0.4, 0.8, 1, 0.5, 0];
export const poseSequenceB = [0, 0, 0.4, 0.8, 0.8, 1, 0.5, 0.5, 0];

// Cosine distance between two unit direction vectors representing a toy joint angle.
export function alignPoses(a, b) {
  if (!a.length || !b.length) return [];
  const costs = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(Infinity));
  const previous = new Map();
  costs[0][0] = 0;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const choices = [[i - 1, j - 1], [i - 1, j], [i, j - 1]];
      const best = choices.reduce((x, y) => costs[x[0]][x[1]] <= costs[y[0]][y[1]] ? x : y);
      costs[i][j] = 1 - Math.cos((a[i - 1] - b[j - 1]) * Math.PI / 2) + costs[best[0]][best[1]];
      previous.set(`${i},${j}`, best);
    }
  }
  const path = [];
  let i = a.length, j = b.length;
  while (i && j) {
    path.push([i - 1, j - 1]);
    [i, j] = previous.get(`${i},${j}`);
  }
  return path.reverse();
}

export function queensTrace(size = 4) {
  if (!Number.isInteger(size) || size < 1 || size > 10) throw new RangeError('Use a board size from 1 to 10.');
  const full = (1 << size) - 1;
  const positions = [];
  const frames = [];
  function visit(columns, leftDiagonal, rightDiagonal) {
    const row = positions.length;
    const available = full & ~(columns | leftDiagonal | rightDiagonal);
    frames.push({ kind: row === size ? 'solved' : available ? 'search' : 'dead-end', positions: [...positions], available, row });
    if (row === size) return true;
    let remaining = available;
    while (remaining) {
      const bit = remaining & -remaining;
      remaining ^= bit;
      positions.push(Math.log2(bit));
      if (visit(columns | bit, ((leftDiagonal | bit) << 1) & full, (rightDiagonal | bit) >>> 1)) return true;
      positions.pop();
      frames.push({ kind: 'backtrack', positions: [...positions], available: remaining, row });
    }
    return false;
  }
  visit(0, 0, 0);
  return frames;
}
