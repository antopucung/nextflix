import type { NextApiRequest, NextApiResponse } from 'next';
import { Ebook } from '../../types';
import { getEbooks } from '../../utils/mockDb';
import { getLocalEbooks } from '../../utils/localContent';

export default function handler(_req: NextApiRequest, res: NextApiResponse<{ type: 'Success'; data: Ebook[] }>) {
  const local = getLocalEbooks();
  const data = local.length ? local : getEbooks();
  res.status(200).json({ type: 'Success', data });
} 