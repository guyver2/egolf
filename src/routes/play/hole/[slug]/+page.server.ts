import type { PageServerLoad } from './$types';
import { getHole } from "$lib/server/hole";


export const load: PageServerLoad = async ({ params }) => {
    const { slug } = params;
    const hole = await getHole(parseInt(slug));
    
    return {
        hole
    };
}; 