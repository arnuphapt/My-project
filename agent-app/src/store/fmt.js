/* number helpers */
export const fmt = {
  n: (v, d = 2) => {
    if (v == null || isNaN(v)) return '–';
    return Number(v).toLocaleString('en-US', {
      minimumFractionDigits: d,
      maximumFractionDigits: d
    });
  },
  money: (v, cur, d = 2) => {
    const sym = cur === 'USD' ? '$' : '฿';
    const s = v < 0 ? '-' : '';
    return s + sym + fmt.n(Math.abs(v), d);
  },
  pct: (v, d = 2) => {
    if (v == null || isNaN(v)) return '–';
    return (v >= 0 ? '+' : '') + fmt.n(v, d) + '%';
  },
  compact: (v) => {
    const a = Math.abs(v);
    if (a >= 1e12) return (v / 1e12).toFixed(2) + 'T';
    if (a >= 1e9) return (v / 1e9).toFixed(1) + 'B';
    if (a >= 1e6) return (v / 1e6).toFixed(1) + 'M';
    if (a >= 1e3) return (v / 1e3).toFixed(1) + 'K';
    return v.toFixed(0);
  }
};
