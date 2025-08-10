import { NextApiRequest, NextApiResponse } from 'next';

import axios from '../../utils/axios';
import { Media, MediaType } from '../../types';
import { parse } from '../../utils/apiResolvers';
import { getMockByType, getPopular } from '../../utils/mockDb';
import { getLocalMovies } from '../../utils/localContent';

interface Response {
  type: 'Success' | 'Error';
  data: Media[] | Error;
}

const apiKey = process.env.TMDB_KEY;

export default async function handler(request: NextApiRequest, response: NextApiResponse<Response>) {
  const { type } = request.query as { type?: MediaType };

  const local = getLocalMovies();
  if (local.length) {
    response.status(200).json({ type: 'Success', data: local });
    return;
  }

  try {
    const result = await axios().get(`/${type}/popular`, {
      params: {
        api_key: apiKey,
        watch_region: 'US', 
        language: 'en-US',
      }
    });
    const data = parse(result.data.results, type as MediaType);

    response.status(200).json({ type: 'Success', data });
  } catch (error) {
    const mock = getPopular(getMockByType(type));
    response.status(200).json({ type: 'Success', data: mock });
  }
}
