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
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting customer:', error);
        return { success: false, error: error.message };
    }
}
