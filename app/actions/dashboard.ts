'use server';

import { prisma } from '@/lib/db';
import { startOfDay, startOfMonth, startOfYear } from 'date-fns';

export async function getDashboardStats() {
    const now = new Date();
    const today = startOfDay(now);
    const thisMonth = startOfMonth(now);
    const thisYear = startOfYear(now);

    // Helper to get counts for different time ranges
    async function getCounts(model: any, dateField: string, additionalWhere: any = {}) {
        const [total, todayCount, monthCount, yearCount] = await Promise.all([
            model.count({ where: additionalWhere }),
            model.count({
                where: {
                    ...additionalWhere,
                    [dateField]: {
                        gte: today
                    }
                }
            }),
            model.count({
                where: {
                    ...additionalWhere,
                    [dateField]: {
                        gte: thisMonth
                    }
                }
            }),
            model.count({
                where: {
                    ...additionalWhere,
                    [dateField]: {
                        gte: thisYear
                    }
                }
            })
        ]);
        
        return { total, today: todayCount, month: monthCount, year: yearCount };
    }

    const customers = await getCounts(prisma.customer, 'created_at');
    
    // Only count SENT messages
    const sms = await getCounts(prisma.message, 'sent_at', { status: 'SENT' });
    
    // Mandates
    const mandates = await getCounts(prisma.directDebitMandate, 'submitted_at');

    return {
        customers,
        sms,
        mandates
    };
}
