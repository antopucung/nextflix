import type { NextApiRequest, NextApiResponse } from 'next';
import { getLocalHeroSlides } from '../../utils/localContent';
import type { HeroSlide } from '../../types';

export default function handler(_req: NextApiRequest, res: NextApiResponse<{ type: 'Success'; data: HeroSlide[] }>) {
  const slides = getLocalHeroSlides();
  res.status(200).json({ type: 'Success', data: slides });
} 