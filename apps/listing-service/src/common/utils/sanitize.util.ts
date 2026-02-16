import sanitizeHtml from 'sanitize-html';

export function sanitizeDescription(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();
}
