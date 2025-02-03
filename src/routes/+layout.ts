import type { LayoutLoad } from './$types';

export const prerender = false;

export const load: LayoutLoad = async () => {
    return {
        meta: {
            title: 'eGolf',
            description: 'A minimalist golf game built with SvelteKit'
        }
    };
};