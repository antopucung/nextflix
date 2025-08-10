import mock from '../data/mock.json';
import { Media, MediaType, Ebook } from '../types';

export function getMockByType(type: string | string[] | undefined): Media[] {
  const key = (Array.isArray(type) ? type[0] : type) as MediaType | undefined;
  if (!key || (key !== 'movie' && key !== 'tv')) return [];
  return (mock as any)[key] as Media[];
}

export function filterByGenre(items: Media[], genreId?: string | string[]): Media[] {
  if (!genreId) return items;
  const idNum = Number(Array.isArray(genreId) ? genreId[0] : genreId);
  if (!idNum) return items;
  return items.filter(m => m.genre.some(g => g.id === idNum));
}

export function getTrending(items: Media[]): Media[] {
  return items.slice(0, 10);
}

export function getPopular(items: Media[]): Media[] {
  return items.slice(0, 10);
}

export function getEbooks(): Ebook[] {
  return (mock as any).ebooks as Ebook[];
}

export type Milestone = { id: number; title: string; overview: string; banner: string };
export function getMilestones(): Milestone[] {
  return (mock as any).milestones as Milestone[];
} 