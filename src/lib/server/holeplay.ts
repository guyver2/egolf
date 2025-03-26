import prisma from "$lib/server/prisma";
import type { HolePlay } from "@prisma/client";

export async function getHolePlays(page: number=0, limit: number=20, userId?: number, holeId?: number) : Promise<{holePlays: HolePlay[], total: number}> {
  const skip = page * limit;
  const [holePlays, total] = await Promise.all([
    prisma.holePlay.findMany({
      skip,
      take: limit,
      where: {
        userId,
        holeId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        strokes: {
          select: {
            id: true,
            startX: true,
            startY: true,
            endX: true,
            endY: true,
          },
        },
      },
    }),
    prisma.holePlay.count(),
  ]);
  return { holePlays, total };
}

export async function getHolePlay(holePlayId: number) : Promise<HolePlay> {
    const holePlay = await prisma.holePlay.findUnique({
        where: { id: holePlayId },
        include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
            strokes: {
              select: {
                id: true,
                startX: true,
                startY: true,
                endX: true,
                endY: true,
              },
            },
        },
    });
    if (!holePlay) throw new Error(`Hole play with id ${holePlayId} not found`);
    return holePlay;
}

export async function createHolePlay(userId: number, holeId: number, strokes: number[][]) : Promise<HolePlay> {
    console.log("strokes", strokes);
    const holePlay = await prisma.holePlay.create({
        data: {
            userId,
            holeId,
        },
    });
    for (let i = 0; i < strokes.length-1; i++) {
        await prisma.stroke.create({
            data: {
                holePlayId: holePlay.id,
                startX: strokes[i][0],
                startY: strokes[i][1],
                endX: strokes[i+1][0],
                endY: strokes[i+1][1],
            },
        });
    }
    return getHolePlay(holePlay.id);
}