/**
 * parseSignal - deterministic, regex/rule-based parser for manually-pasted
 * trading signal text (copied by a human from a LINE group chat).
 *
 * This is intentionally NOT an LLM/NLP parser. It only recognizes a fixed,
 * confirmed real-world format and tolerates common paste variance:
 *  - extra whitespace, tabs, multiple spaces
 *  - either one-line or multi-line paste (newlines treated like spaces)
 *  - lowercase/uppercase symbol or side
 *  - "TP1" / "TP 1" / "TP-1" spacing variants, arbitrary count of TP levels
 *  - entry as a range ("4098-4102") or a single price ("4100")
 *
 * Example input:
 *   "XAUUSD SELL 4098-4102 SL 4106 TP1 4090 TP2 4080"
 *
 * @param {string} text - raw pasted signal text
 * @returns {{ ok: true, data: ParsedSignal } | { ok: false, error: string }}
 *
 * @typedef {Object} ParsedSignal
 * @property {string} symbol - e.g. "XAUUSD"
 * @property {'BUY'|'SELL'} side
 * @property {{ low: number, high: number, isRange: boolean }} entry
 * @property {number} sl
 * @property {number[]} tp - ordered take-profit levels (TP1, TP2, ...)
 * @property {string} raw - original input text (untouched)
 */
export function parseSignal(text) {
  if (typeof text !== 'string' || !text.trim()) {
    return { ok: false, error: 'ไม่มีข้อความสัญญาณให้แปลง (empty input)' };
  }

  const raw = text;
  // Normalize: collapse all whitespace/newlines into single spaces, uppercase
  // for keyword matching (symbol casing is preserved separately below).
  const normalized = text.replace(/\s+/g, ' ').trim();
  const upper = normalized.toUpperCase();

  // Symbol: first alphabetic token at the start of the string (letters only,
  // 3-10 chars covers forex/crypto/metal-style symbols like XAUUSD, BTCUSD, EURUSD).
  const symbolMatch = upper.match(/^([A-Z]{3,10})\b/);
  if (!symbolMatch) {
    return { ok: false, error: 'ไม่พบสัญลักษณ์ (symbol) ที่จุดเริ่มต้นข้อความ' };
  }
  const symbol = symbolMatch[1];

  // Side: BUY or SELL, anywhere after the symbol.
  const sideMatch = upper.match(/\b(BUY|SELL)\b/);
  if (!sideMatch) {
    return { ok: false, error: 'ไม่พบคำสั่ง BUY หรือ SELL' };
  }
  const side = sideMatch[1];

  // Entry: a price, or a price range "num-num", appearing after side.
  // Look after the side keyword to avoid accidentally matching digits inside
  // the symbol (symbols here are letters-only so this is mostly a safety net).
  const afterSide = upper.slice(sideMatch.index + sideMatch[0].length);
  const entryMatch = afterSide.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/) || afterSide.match(/(\d+(?:\.\d+)?)/);
  if (!entryMatch) {
    return { ok: false, error: 'ไม่พบราคาเข้า (entry price)' };
  }
  const isRange = entryMatch.length === 3 && entryMatch[2] !== undefined;
  const low = parseFloat(entryMatch[1]);
  const high = isRange ? parseFloat(entryMatch[2]) : low;
  if (Number.isNaN(low) || (isRange && Number.isNaN(high))) {
    return { ok: false, error: 'รูปแบบราคาเข้าไม่ถูกต้อง' };
  }

  // Stop loss: "SL <number>"
  const slMatch = upper.match(/\bSL\s*[:-]?\s*(\d+(?:\.\d+)?)/);
  if (!slMatch) {
    return { ok: false, error: 'ไม่พบ SL (stop loss)' };
  }
  const sl = parseFloat(slMatch[1]);

  // Take-profit levels: "TP1 <n>", "TP 1 <n>", "TP-1 <n>", also bare "TP <n>"
  // (treated as TP1 if no number follows "TP" directly). Collect all, in
  // order of appearance, sorted by their TP index when present.
  const tpRegex = /\bTP\s*-?\s*(\d+)?\s*[:-]?\s*(\d+(?:\.\d+)?)/g;
  const tpEntries = [];
  let m;
  let fallbackIndex = 1;
  while ((m = tpRegex.exec(upper)) !== null) {
    const idx = m[1] ? parseInt(m[1], 10) : fallbackIndex;
    const val = parseFloat(m[2]);
    if (!Number.isNaN(val)) {
      tpEntries.push({ idx, val });
      fallbackIndex = idx + 1;
    }
  }
  if (tpEntries.length === 0) {
    return { ok: false, error: 'ไม่พบ TP (take profit) อย่างน้อย 1 ระดับ' };
  }
  tpEntries.sort((a, b) => a.idx - b.idx);
  const tp = tpEntries.map(e => e.val);

  return {
    ok: true,
    data: {
      symbol,
      side,
      entry: { low: Math.min(low, high), high: Math.max(low, high), isRange },
      sl,
      tp,
      raw,
    },
  };
}
