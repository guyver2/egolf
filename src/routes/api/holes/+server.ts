import prisma from "$lib/server/prisma";
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getHoles, getHole } from "$lib/server/hole";

export const GET: RequestHandler = async ({ url }) => {
    const holeId = url.searchParams.get('id');
    if (holeId) {
      try {
        const hole = await getHole(parseInt(holeId));
        return json({ hole });
      } catch (error) {
        console.error('Failed to fetch hole with id:', holeId, error);
        return json(
          { error: 'Hole not found' },
          { status: 500 }
        );
      }
    } else {
      try {
        const page = parseInt(url.searchParams.get('page') ?? '0');
        const limit = parseInt(url.searchParams.get('limit') ?? '20');
        const { holes, total } = await getHoles(page, limit);
        return json({
        holes,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Failed to fetch holes:', error);
      return json(
        { error: 'Failed to fetch holes' },
        { status: 500 }
      );
    }
  }
}; 

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { name, seed, width, height, authorId} = await request.json();

    const hole = await prisma.hole.create({
      data: {
        name,
        seed,
        width,
        height,
        authorId
      }
    });

    return json(hole);
  } catch (error) {
    console.error('Failed to create hole:', error);
    return json(
      { error: 'Failed to create hole' },
      { status: 500 }
    );
  }
};
