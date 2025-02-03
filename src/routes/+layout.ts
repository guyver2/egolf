import type { LayoutLoad } from './$types';

export const prerender = true;

export const load: LayoutLoad = async () => {
    return {
        meta: {
            title: 'eGolf',
            description: 'A minimalist golf game built with SvelteKit'
        }
    };
};