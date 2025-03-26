import { fail, redirect } from '@sveltejs/kit';
import prisma from "$lib/server/prisma";
import * as bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { Actions } from './$types';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
}

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

        const userPassword = bcrypt.compare(password, user.password);

        if (!userPassword) {
            return fail(400, { email, credentials: true });
        }

        // Create JWT payload
        const payload = {
            userId: user.id,
            email: user.email
        };

        // Generate JWT token
        const token = jwt.sign(payload, JWT_SECRET, {
            expiresIn: '1d' // 1 day
        });

        // Delete any existing tokens for this user
        await prisma.accessToken.deleteMany({
            where: {
                userId: user.id
            }
        });

        // Store the token in the database
        await prisma.accessToken.create({
            data: {
                token,
                userId: user.id,
            }
        });

        // Set a cookie with the JWT token
        cookies.set('access_token', token, {
            path: '/',
            httpOnly: true,
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24, // 1 day in seconds
        });

        throw redirect(303, '/');
    }
} satisfies Actions; 