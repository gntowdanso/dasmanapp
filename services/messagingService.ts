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
    const success = await sendToProvider(type, messageBody, customer.phone_number);

    // 3. Update status based on provider response
    if (success) {
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
      return { success: false, messageId: message.id };
    }
  } catch (error) {
    console.error('Error sending message:', error);
    return { success: false, error };
  }
}

async function sendToProvider(type: string, body: string, to: string): Promise<boolean> {
  if (type !== 'SMS') {
    console.log(`Sending ${type} to ${to}: ${body} (simulated)`);
    return true; // Only SMS is implemented with real provider
  }

  try {
    // Hubtel SMS API
    const clientId = 'vgtkpiui';
    const clientSecret = 'etmataoj';
    const from = 'LetsGo';
    
    // Ensure phone number is in correct format (e.g., removing leading 0 or adding country code if needed)
    // Assuming 'to' is already in a compatible format or purely numeric
    
    // Using URLSearchParams for proper encoding
    const params = new URLSearchParams({
      clientsecret: clientSecret,
      clientid: clientId,
      from: from,
      to: to,
      content: body,
    });

    const url = `https://sms.hubtel.com/v1/messages/send?${params.toString()}`;
    
    const response = await fetch(url);
    
    if (response.ok) {
        // Hubtel might return JSON, let's verify if needed, but for now 200 OK is success
        const data = await response.json().catch(() => ({})); 
        // console.log('Hubtel response:', data);
        return true;
    } else {
        const errorText = await response.text();
        console.error('Hubtel API Error:', response.status, errorText);
        return false;
    }
  } catch (error) {
    console.error('Failed to send SMS via Hubtel:', error);
    return false;
  }
}
