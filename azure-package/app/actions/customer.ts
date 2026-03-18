'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function updateCustomerMobile(customerId: string, newMobile: string) {
    try {
        await prisma.customer.update({
            where: { id: customerId },
            data: { phone_number: newMobile }
        });
        revalidatePath('/admin/sms/trigger');
        return { success: true };
    } catch (error: any) {
        console.error('Error updating mobile:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteCustomer(customerId: string) {
    try {
        await prisma.customer.delete({
            where: { id: customerId }
        });
        revalidatePath('/admin/sms/trigger');
        revalidatePath('/admin/customers');
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting customer:', error);
        return { success: false, error: error.message };
    }
}

export async function getCustomers(page = 1, pageSize = 20, search = '') {
    try {
        const skip = (page - 1) * pageSize;
        const where = search ? {
            OR: [
                { full_name: { contains: search, mode: 'insensitive' as const } },
                { phone_number: { contains: search } },
                { external_id: { contains: search } },
                { account_number: { contains: search } }
            ]
        } : {};

        const [customers, total] = await Promise.all([
            prisma.customer.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { created_at: 'desc' },
            }),
            prisma.customer.count({ where })
        ]);

        return {
            success: true,
            data: customers,
            pagination: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize)
            }
        };
    } catch (error: any) {
        console.error('Error fetching customers:', error);
        return { success: false, error: error.message };
    }
}

export async function updateCustomerDetails(customerId: string, data: any) {
    try {
        await prisma.customer.update({
            where: { id: customerId },
            data: {
                full_name: data.full_name,
                phone_number: data.phone_number,
                external_id: data.external_id,
                account_number: data.account_number,
                loan_balance: data.loan_balance,
                monthly_repayment: data.monthly_repayment,
                status: data.status,
                start_date: data.start_date ? new Date(data.start_date) : null,
                no_of_months: data.no_of_months ? parseInt(data.no_of_months.toString(), 10) : null
            }
        });
        revalidatePath('/admin/customers');
        return { success: true };
    } catch (error: any) {
        console.error('Error updating customer:', error);
        return { success: false, error: error.message };
    }
}
