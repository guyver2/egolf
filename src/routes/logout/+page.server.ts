import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import type { Cookies } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ cookies }) => {
    // Delete the access token cookie
    cookies.delete('access_token', { path: '/' });
    console.log("logged out");

    
    // Redirect to home page
    throw redirect(302, '/');
};

export const actions = {
    default: async ({ cookies }: { cookies: Cookies }) => {
        cookies.delete('access_token', { path: '/' });
        console.log("logged out");
        throw redirect(302, '/');
    }
} satisfies Actions;