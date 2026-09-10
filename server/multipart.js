// Minimal binary-safe parser for `multipart/mixed` HTTP responses (RFC 2046).
// Used to read ElevenLabs' /v1/music/detailed response, which packs a JSON metadata
// part (lyrics + word timestamps) and a binary audio part into one multipart body.
// Node has no built-in parser for multipart *responses* (only request uploads via
// libraries like multer), so this hand-rolls the small subset we actually need.

const CRLF = Buffer.from('\r\n');
const HEADER_SEP = Buffer.from('\r\n\r\n');

// Extracts the boundary token from a `Content-Type: multipart/mixed; boundary=XXX` header.
export const extractBoundary = (contentTypeHeader) => {
  if (!contentTypeHeader) return null;
  const match = contentTypeHeader.match(/boundary="?([^";]+)"?/i);
  return match ? match[1] : null;
};

// Returns an array of { headers: Record<string,string>, body: Buffer } for each part.
export const parseMultipart = (buffer, boundary) => {
  const delimiter = Buffer.from(`--${boundary}`);
  const parts = [];
  let searchStart = 0;

  while (true) {
    const start = buffer.indexOf(delimiter, searchStart);
    if (start === -1) break;

    const afterDelimiter = start + delimiter.length;
    const isClosing = buffer.slice(afterDelimiter, afterDelimiter + 2).toString('ascii') === '--';
    if (isClosing) break;

    const nextStart = buffer.indexOf(delimiter, afterDelimiter);
    if (nextStart === -1) break;

    // Content between this delimiter's line-end and the next delimiter, minus the
    // trailing CRLF that always precedes the next boundary marker.
    let partBuf = buffer.slice(afterDelimiter, nextStart);
    if (partBuf.slice(0, 2).equals(CRLF)) partBuf = partBuf.slice(2);
    if (partBuf.slice(-2).equals(CRLF)) partBuf = partBuf.slice(0, -2);

    const headerEnd = partBuf.indexOf(HEADER_SEP);
    if (headerEnd === -1) {
      searchStart = nextStart;
      continue;
    }

    const headers = {};
    partBuf
      .slice(0, headerEnd)
      .toString('utf-8')
      .split('\r\n')
      .forEach((line) => {
        const idx = line.indexOf(':');
        if (idx === -1) return;
        headers[line.slice(0, idx).trim().toLowerCase()] = line.slice(idx + 1).trim();
      });

    parts.push({ headers, body: partBuf.slice(headerEnd + HEADER_SEP.length) });
    searchStart = nextStart;
  }

  return parts;
};
