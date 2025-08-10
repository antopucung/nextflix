import type { NextApiRequest, NextApiResponse } from 'next';
import { getMilestones, Milestone } from '../../utils/mockDb';
import { getLocalMilestones } from '../../utils/localContent';

export default function handler(_req: NextApiRequest, res: NextApiResponse<{ type: 'Success'; data: Milestone[] }>) {
  const local = getLocalMilestones();
  const data = (local.length ? local : getMilestones()) as unknown as Milestone[];
  res.status(200).json({ type: 'Success', data });
} 