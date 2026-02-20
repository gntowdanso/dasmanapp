import { prisma } from '../lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function sendMessage(customerId: string, type: 'SMS' | 'WHATSAPP', messageBody: string) {
  try {
    // 0. Fetch customer to get phone number
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { phone_number: true }
    });

    if (!customer?.phone_number) {
      return { success: false, error: 'Customer phone number not found' };
    }

    // 1. Log the attempt in the database
    const message = await prisma.message.create({
      data: {
        customer_id: customerId,
        type,
        message_body: messageBody,
        status: 'PENDING',
      },
    });

    // 2. Call the provider API
    const result = await sendToProvider(type, messageBody, customer.phone_number);

    // 3. Update status based on provider response
    if (result.success) {
      await prisma.message.update({
        where: { id: message.id },
        data: { status: 'SENT', sent_at: new Date() },
      });
      return { success: true, messageId: message.id };
    } else {
      await prisma.message.update({
        where: { id: message.id },
        data: { status: 'FAILED' },
      });
      return { success: false, error: result.error, messageId: message.id };
    }
  } catch (error: any) {
    console.error('Error sending message:', error);
    return { success: false, error: error?.message || 'Unknown error sending message' };
  }
}

async function sendToProvider(type: string, body: string, to: string): Promise<{ success: boolean; error?: string }> {
  if (type !== 'SMS') {
    console.log(`Sending ${type} to ${to}: ${body} (simulated)`);
    return { success: true };
  }

  try {
    // Hubtel SMS API
    const clientId = 'vgtkpiui';
    const clientSecret = 'etmataoj';
    const from = 'LetsGo';

    const smsApiUrl = process.env.SMS_API;
    if (!smsApiUrl) {
      console.error('SMS_API environment variable is not set');
      return { success: false, error: 'SMS API URL not configured' };
    }
    
    // Using URLSearchParams for proper encoding
    const params = new URLSearchParams({
      clientsecret: clientSecret,
      clientid: clientId,
      from: from,
      to: to,
      content: body,
    });

    const url = `${smsApiUrl}${params.toString()}`;
    console.log('Sending SMS to:', to);
    
    const response = await fetch(url);
    
    if (response.ok) {
        const data = await response.json().catch(() => ({})); 
        console.log('Hubtel response:', data);
        return { success: true };
    } else {
        const errorText = await response.text();
        console.error('Hubtel API Error:', response.status, errorText);
        return { success: false, error: `Hubtel API error: ${response.status} - ${errorText}` };
    }
  } catch (error: any) {
    console.error('Failed to send SMS via Hubtel:', error);
    return { success: false, error: `SMS send failed: ${error.message}` };
  }
}
