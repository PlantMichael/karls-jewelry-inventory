import { PrismaClient } from "@prisma/client";
import type { PageServerLoad } from './$types';

const prisma = new PrismaClient();


export const load: PageServerLoad = async () => {
    const jewelry = await prisma.jewelry.findMany({
        orderBy: { createdAt: 'desc'}
    });

    return {
        jewelry
    };
};