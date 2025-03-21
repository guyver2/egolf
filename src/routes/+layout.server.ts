import type { LayoutServerLoad } from './$types';
import prisma from "$lib/server/prisma";


export type User = {
    id: string;
    email: string;
    name: string;
}

export const load: LayoutServerLoad = async ({ cookies }) => {
    const accessToken = cookies.get('access_token');
    
    let user = null;
    if (accessToken) {
        // Find the token and include the associated user data
        const tokenData = await prisma.accessToken.findUnique({
            where: { token: accessToken },
            include: { user: true }
        });
        
        if (tokenData && tokenData.expiresAt > new Date()) {
            user = tokenData.user;
        }
    }
    // console.log("accessToken", accessToken);
    // console.log("user", user);
    
    return {
        meta: {
            title: 'eGolf',
            description: 'A minimalist golf game built with SvelteKit'
        },
        isLoggedIn: !!user,
        user: user ? {
            id: user.id,
            email: user.email,
            name: user.name
        } : null
    };
}; 