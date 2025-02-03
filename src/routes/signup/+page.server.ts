// src/routes/signup/+page.server.ts

import { fail } from '@sveltejs/kit';
import prisma from "$lib/server/prisma";
import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import * as bcrypt from 'bcrypt'

const validateEmail = (email: string) => {
    return (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email))
}

export const actions = {
    // 1.
    default: async ({ request }) => {
        const data = await request.formData();

        const name = data.get("name")
        const userEmail = data.get("userEmail")
        const password = data.get("password")

        // 2.
        if (!name || !userEmail || !password) {
            return fail(400, { name, userEmail, password, missing: true });
        }
				// 3.
        if (typeof name != "string" || typeof userEmail != "string" || typeof password != "string") {
            return fail(400, { incorrect: true })
        }
				// 4.
        if (!validateEmail(userEmail)) {
            return fail(400, { name, userEmail, password, incorrect: true });
        }

        // 5.
        await prisma.user.create({
            data: {
                name,
                email: userEmail,
                password: await bcrypt.hash(password, 10)
            },
        });

        throw redirect(303, `/login`)
    }
} satisfies Actions;
