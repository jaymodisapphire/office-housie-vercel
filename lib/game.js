import { PRIZE_NAME } from './constants.js';

export const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const newSeq = () => shuffle(Array.from({ length: 90 }, (_, i) => i + 1));
export const genCode = () => Array.from({ length: 4 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.floor(Math.random() * 24)]).join('');
export const genId = () => Array.from(crypto.getRandomValues(new Uint8Array(6)), b => b.toString(16).padStart(2, '0')).join('');

// 3 rows x 9 cols, 5 numbers per row, every column has 1-3 numbers (standard tambola ticket)
export function makeTicket() {
  for (;;) {
    const rows = [0, 1, 2].map(() => shuffle([...Array(9).keys()]).slice(0, 5));
    const cnt = Array(9).fill(0);
    rows.forEach(r => r.forEach(c => cnt[c]++));
    if (cnt.includes(0)) continue;
    const t = [0, 1, 2].map(() => Array(9).fill(0));
    for (let c = 0; c < 9; c++) {
      const lo = c === 0 ? 1 : c * 10, hi = c === 8 ? 90 : c * 10 + 9;
      const nums = shuffle(Array.from({ length: hi - lo + 1 }, (_, i) => lo + i)).slice(0, cnt[c]).sort((a, b) => a - b);
      let k = 0;
      for (let r = 0; r < 3; r++) if (rows[r].includes(c)) t[r][c] = nums[k++];
    }
    return t;
  }
}

export function complete(ticket, calledList, prize) {
  if (!PRIZE_NAME[prize]) return false;
  const called = new Set(calledList), nums = ticket.flat().filter(Boolean), has = n => called.has(n);
  const row = i => ticket[i].every(n => !n || has(n));
  const ends = i => { const v = ticket[i].filter(Boolean); return [v[0], v[v.length - 1]]; };
  switch (prize) {
    case 'early5': return nums.filter(has).length >= 5;
    case 'corners': return [...ends(0), ...ends(2)].every(has);
    case 'top': return row(0);
    case 'middle': return row(1);
    case 'bottom': return row(2);
    case 'queens': return nums.filter(n => n <= 45).every(has);
    case 'kings': return nums.filter(n => n >= 46).every(has);
    case 'full': return nums.every(has);
  }
  return false;
}
