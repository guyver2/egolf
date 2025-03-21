import prisma from "$lib/server/prisma";
import type { Hole } from "@prisma/client";

export async function getHoles(page: number=0, limit: number=20) : Promise<{holes: Hole[], total: number}> {
  const skip = page * limit;
  const [holes, total] = await Promise.all([
    prisma.hole.findMany({
      skip,
      take: limit,
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
        courses: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
    prisma.hole.count(),
  ]);
  return { holes, total };
}


export async function getHole(holeId: number) : Promise<Hole> {
    const hole = await prisma.hole.findUnique({
        where: { id: holeId },
        include: {
            author: {
              select: {
                id: true,
                name: true,
              },
            },
            courses: {
              select: {
                id: true,
                name: true,
              },
            },
        },
    });
    if (!hole) throw new Error(`Hole with id ${holeId} not found`);
    return hole;
}