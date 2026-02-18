'use server';

import { prisma } from '@/lib/db';
import { sendMessage } from '@/services/messagingService';
import { revalidatePath } from 'next/cache';

export async function getCustomersForSMS() {
    // Fetch customers, prioritize pending ones or recently added
    // For now, fetch all, ordered by created_at desc
    const customers = await prisma.customer.findMany({
        orderBy: { created_at: 'desc' },
        where: {
            // Optional: filter where status is 'PENDING'
            status: 'PENDING'
        },
        select: {
            id: true,
            full_name: true,
            phone_number: true,
            session_token: true,
            status: true,
            created_at: true,
            external_id: true,
            account_number: true,
        }
    });
    return customers;
}

export async function sendBulkSMS(customerIds: string[], messageTemplate: string) {
    const results = {
        success: 0,
        failed: 0,
        errors: [] as string[]
    };

    const customers = await prisma.customer.findMany({
        where: {
            id: { in: customerIds }
        }
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    for (const customer of customers) {
        try {
            // Replace placeholders
            // Supported: {name}, {link}, {account}
            let message = messageTemplate;
            message = message.replace(/{name}/g, customer.full_name);
            message = message.replace(/{account}/g, customer.account_number || '');
            
            // Construct mandate link
            const link = `${baseUrl}/mandate?token=${customer.session_token}`;
            message = message.replace(/{link}/g, link);

            const response = await sendMessage(customer.id, 'SMS', message);

            if (response.success) {
                results.success++;
            } else {
                results.failed++;
                results.errors.push(`Failed to send to ${customer.full_name}: ${response.error}`);
            }
        } catch (error: any) {
            results.failed++;
            results.errors.push(`Failed to process ${customer.full_name}: ${error.message}`);
        }
    }

    revalidatePath('/admin/sms/trigger');
    return results;
}

export async function getSMSLogs() {
    try {
        const logs = await prisma.message.findMany({
            orderBy: { sent_at: 'desc' },
            include: {
                customer: {
                    select: {
                        full_name: true,
                        phone_number: true,
                        external_id: true,
                    }
                }
            }
        });
        return logs;
    } catch (error) {
        console.error('Error fetching SMS logs:', error);
        return [];
    }
}

