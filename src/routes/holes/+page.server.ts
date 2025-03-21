
import type { PageServerLoad } from './$types';
import { getHoles } from "$lib/server/hole";


export const load: PageServerLoad = async ({ url }) => {
    const page = parseInt(url.searchParams.get('page') ?? '0');
    const limit = 20;
    const { holes, total } = await getHoles(page, limit);
    
    return {
        holes,
        pagination: {
            total,
            page,
            pages: Math.ceil(total / limit)
        }
    };
}; 