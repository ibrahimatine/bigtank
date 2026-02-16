import slugify from 'slugify';
import { nanoid } from 'nanoid';

export function generateListingSlug(
  brand: string,
  model: string,
  sizeEu: number,
  city: string,
): string {
  const base = slugify(`${brand} ${model} ${sizeEu} ${city}`, {
    lower: true,
    strict: true,
    locale: 'fr',
  });
  const shortId = nanoid(8);
  return `${base}-${shortId}`;
}
