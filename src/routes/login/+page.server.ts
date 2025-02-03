import { fail, redirect } from '@sveltejs/kit';
import prisma from "$lib/server/prisma";
import * as bcrypt from 'bcrypt';
import type { Actions } from './$types';

export const actions = {
    default: async ({ request, cookies }) => {
        const data = await request.formData();
        const email = data.get("email");
        const password = data.get("password");

        if (!email || !password) {
            return fail(400, { email, missing: true });
        }

        if (typeof email !== "string" || typeof password !== "string") {
            return fail(400, { incorrect: true });
        }

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return fail(400, { email, credentials: true });
        }

        const userPassword = await bcrypt.compare(password, user.password);

        if (!userPassword) {
            return fail(400, { email, credentials: true });
        }

        // Set a cookie to maintain the session
        cookies.set('sessionId', user.id.toString(), {
            path: '/',
            httpOnly: true,
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 30, // 30 days
        });

        throw redirect(303, '/');
    }
} satisfies Actions; 