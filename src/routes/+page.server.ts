import type { PageServerLoad } from './$types';
import prisma from "$lib/server/prisma";


export type User = {
    id: string;
    email: string;
    name: string;
}

export const load: PageServerLoad = async ({ cookies }) => {
    const accessToken = cookies.get('access_token');
    
    let user = null;
    if (accessToken) {
        // Find the token and include the associated user data
        const tokenData = await prisma.accessToken.findUnique({
            where: { token: accessToken },
            include: { user: true }
        });

        console.log("tokenData", tokenData);
        
        if (tokenData && tokenData.expiresAt > new Date()) {
            user = tokenData.user;
        }
    }
    console.log("accessToken", accessToken);
    console.log("user", user);
    
    return {
        isLoggedIn: !!user,
        user: user ? {
            id: user.id,
            email: user.email,
            name: user.name
        } : null
    };
}; 