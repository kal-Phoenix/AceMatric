import DOMPurify from 'dompurify';

// Config: allow basic formatting tags but strip scripts, event handlers, etc.
const ALLOWED_TAGS = [
  'b', 'i', 'em', 'strong', 'u', 's', 'br', 'p', 'span', 'div',
  'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'blockquote', 'pre', 'code', 'sub', 'sup', 'mark',
  'img', 'a', 'hr', 'details', 'summary',
];

const ALLOWED_ATTR = [
  'class', 'href', 'target', 'rel', 'src', 'alt', 'title',
  'width', 'height', 'colspan', 'rowspan',
];

/**
 * Sanitize HTML content for safe rendering via dangerouslySetInnerHTML.
 * Strips scripts, event handlers, and dangerous attributes.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  } as any) as unknown as string;
}
