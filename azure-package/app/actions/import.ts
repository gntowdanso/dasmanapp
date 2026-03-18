'use server';

import { prisma } from '@/lib/db';
import { generateSecureToken } from '@/lib/token';
import { revalidatePath } from 'next/cache';

export async function importCustomersAction(customers: any[]) {
    let successCount = 0;
    const errors: string[] = [];

    for (const customer of customers) {
        try {
            const fullName = customer['Name'];
            const accountNo = customer['Account no'];
            const externalId = customer['Customer No'];
            const loanStatus = customer['Status'];
            const mobile = customer['Mobile'];
            
            // New fields
            const loanBalance = customer['Loan Balance'];
            const monthlyRepayment = customer['Monthly Repayment'];
            const startDateRaw = customer['Start Date'];
            const noOfMonths = customer['No of Months'];

            let startDate: Date | undefined;
            if (startDateRaw) {
                const parsedDate = new Date(startDateRaw);
                if (!isNaN(parsedDate.getTime())) {
                    startDate = parsedDate;
                }
            }

            if (!fullName || !mobile) {
                continue;
            }

            // Check if customer exists by external_id
            let existingCustomer = null;
            if (externalId) {
                existingCustomer = await prisma.customer.findFirst({
                    where: { external_id: String(externalId) }
                });
            }

            if (existingCustomer) {
                await prisma.customer.update({
                    where: { id: existingCustomer.id },
                    data: {
                        full_name: String(fullName),
                        phone_number: String(mobile),
                        account_number: accountNo ? String(accountNo) : null,
                        loan_status: loanStatus ? String(loanStatus) : null,
                        loan_balance: loanBalance ? String(loanBalance) : null,
                        monthly_repayment: monthlyRepayment ? String(monthlyRepayment) : null,
                        start_date: startDate,
                        no_of_months: noOfMonths ? Number(noOfMonths) : null,
                    }
                });
            } else {
                const token = generateSecureToken(); // Use the proper imported function
                const expiry = new Date();
                expiry.setHours(expiry.getHours() + 48);

                await prisma.customer.create({
                    data: {
                        full_name: String(fullName),
                        phone_number: String(mobile),
                        account_number: accountNo ? String(accountNo) : null,
                        external_id: externalId ? String(externalId) : null,
                        loan_status: loanStatus ? String(loanStatus) : null,
                        loan_balance: loanBalance ? String(loanBalance) : null,
                        monthly_repayment: monthlyRepayment ? String(monthlyRepayment) : null,
                        start_date: startDate,
                        no_of_months: noOfMonths ? Number(noOfMonths) : null,
                        session_token: token,
                        token_expiry: expiry,
                        status: 'PENDING',
                    }
                });
            }
            successCount++;
        } catch (error: any) {
            console.error('Error processing row', customer, error);
            errors.push(`Failed to import ${customer['Name'] || 'Unknown'}: ${error.message}`);
        }
    }

    revalidatePath('/admin/import');
    return { successCount, errors };
}
