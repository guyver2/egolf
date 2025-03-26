// import prisma from "$lib/server/prisma";
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getHolePlay, getHolePlays, createHolePlay } from "$lib/server/holeplay";

export const GET: RequestHandler = async ({ url }) => {
    const holePlayId = url.searchParams.get('id');
    const userId = url.searchParams.get('userId');
    const holeId = url.searchParams.get('holeId');
    if (holePlayId) {
      try {
        const holePlay = await getHolePlay(parseInt(holePlayId));
        return json({ holePlay });
      } catch (error) {
        console.error('Failed to fetch hole play with id:', holePlayId, error);
        return json(
          { error: 'Hole play not found' },
          { status: 500 }
        );
      }
    } else {
      try {
        const page = parseInt(url.searchParams.get('page') ?? '0');
        const limit = parseInt(url.searchParams.get('limit') ?? '20');
        const { holePlays, total } = await getHolePlays(page, limit, userId ? parseInt(userId) : undefined, holeId ? parseInt(holeId) : undefined);
        return json({
        holePlays,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Failed to fetch hole plays:', error);
      return json(
        { error: 'Failed to fetch hole plays' },
        { status: 500 }
      );
    }
  }
}; 



export const POST: RequestHandler = async ({ request }) => {
  try {
    const params = await request.json();
    const holePlay = await createHolePlay(params.userId, params.holeId, params.strokes);
    return json(holePlay);
  } catch (error) {
    console.error('Failed to create hole play:', error);
    return json(
      { error: 'Failed to create hole play' },
      { status: 500 }
    );
  }
};