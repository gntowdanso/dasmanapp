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

  // 1. Try Arkesel API First
  //https://sms.arkesel.com/sms/api?action=send-sms&api_key=Om45NHFsZjdmMlozd0llb1A=&to=0550585977&from=SenderID&sms=test2
  try {
    const arkeselUrl = process.env.SMS_API_ARKESEL;
    if (arkeselUrl) {
      console.log('Attempting to send SMS via Arkesel to:', to);
      const params = new URLSearchParams({
        action: 'send-sms',
        api_key: 'Om45NHFsZjdmMlozd0llb1A=',
        to: to,
        from: 'SenderID', // Using a generic sender ID or 'DASMAN' if 'LetsGo' is restricted. Trying 'DASMAN' or 'SenderID' based on user success.
        sms: body,
      });
      // The user mentioned "SenderID" works. Let's try that first as a fallback if DASMAN doesn't work, but for now let's use what the user likely has registered.
      // Wait, let's stick to 'SenderID' as per user example if unsure about 'LetsGo'.
      params.set('from', 'SenderID'); 

      const url = `${arkeselUrl}${params.toString()}`;
      //var url1="https://sms.arkesel.com/sms/api?action=send-sms&api_key=Om45NHFsZjdmMlozd0llb1A=&to=0550585977&from=SenderID&sms=test2"
      console.log('Arkesel Request URL:', url); // Log the full URL for debugging
      
      const response = await fetch(url);

      if (response.ok) {
        const data: any = await response.json().catch(() => ({}));
        console.log('Arkesel response:', data);
        
        // Arkesel usually returns: { code: 'ok', message: 'Successfully Sent', balance: ... }
        const isSuccess = (data.code && String(data.code).toLowerCase() === 'ok') ||
                          (data.status && String(data.status).toLowerCase() === 'success');

        if (isSuccess) {
          return { success: true };
        } else {
             console.warn('Arkesel API returned 200 OK but body indicated failure:', data);
             // Fall through to Hubtel
        }
      } else {
        console.warn('Arkesel HTTP error (or non-OK status), falling back to Hubtel. Status:', response.status);
      }
    } else {
      console.warn('SMS_API_ARKESEL not configured, skipping to Hubtel.');
    }
  } catch (error) {
    console.warn('Error sending via Arkesel, falling back to Hubtel:', error);
  }

  // 2. Fallback to Hubtel SMS API
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
    console.log('Sending SMS via Hubtel to:', to);
    
    const response = await fetch(url);
    
    if (response.ok) {
        const data: any = await response.json().catch(() => ({})); 
        console.log('Hubtel response:', data);

        // Check for Hubtel success status
        // Hubtel can return multiple success indicators: 'Success', 0, '0'
        const statusStr = String(data.status).toLowerCase();
        
        if (statusStr === 'success' || statusStr === '0' || data.status === 0) {
             console.log('Hubtel status indicates success:', data.status);
             return { success: true };
        }
        
        console.error('Hubtel API returned 200 OK but status was not Success:', data);
        return { success: false, error: `Hubtel API Error: ${JSON.stringify(data)}` };
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
