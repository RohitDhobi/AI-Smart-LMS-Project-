// =====================================================
// AI SMART LMS - SEARCH HIGHLIGHT HELPER
// =====================================================

// Split `text` into segments around every case-insensitive
// occurrence of `keyword`, so callers can render the matches
// highlighted.
//
// Returns an array of:
//   { text: string, match: boolean }
//
// `match: true` segments are the parts that contain the keyword.

export function highlightSegments(text, keyword) {
  const source = text == null ? "" : String(text);

  if (!keyword || !keyword.trim()) {
    return [{ text: source, match: false }];
  }

  const needle = String(keyword).trim();

  if (!needle) {
    return [{ text: source, match: false }];
  }

  const lowerSource = source.toLowerCase();
  const lowerNeedle = needle.toLowerCase();

  const segments = [];

  let index = 0;

  while (index < source.length) {

    const at =
      lowerSource.indexOf(lowerNeedle, index);

    if (at === -1) {
      segments.push({
        text: source.slice(index),
        match: false
      });
      break;
    }

    if (at > index) {
      segments.push({
        text: source.slice(index, at),
        match: false
      });
    }

    segments.push({
      text: source.slice(at, at + needle.length),
      match: true
    });

    index = at + needle.length;

    if (index >= source.length) {
      break;
    }
  }

  if (segments.length === 0) {
    return [{ text: source, match: false }];
  }

  return segments;
}
