import { prisma } from '@/lib/db';
import { generateSecureToken } from '@/lib/token';
import { revalidatePath } from 'next/cache';
import { getDashboardStats } from '@/app/actions/dashboard';
import { Users, MessageSquare, FileText } from 'lucide-react';

export const dynamic = 'force-dynamic';

function StatCard({ 
  title, 
  icon, 
  data, 
  colorClass 
}: { 
  title: string; 
  icon: React.ReactNode; 
  data: { total: number; today: number; month: number; year: number };
  colorClass: string;
}) {
  return (
    <div className='bg-white p-6 rounded-lg shadow-sm border border-gray-200'>
      <div className='flex items-center justify-between mb-4'>
        <h3 className='text-gray-500 text-sm font-medium uppercase tracking-wider'>{title}</h3>
        <div className={`p-2 rounded-lg ${colorClass} bg-opacity-10 text-${colorClass.replace('bg-', '')}`}>
          {icon}
        </div>
      </div>
      
      <div className='flex items-baseline mb-4'>
        <span className='text-3xl font-bold text-gray-900'>{data.total}</span>
        <span className='ml-2 text-sm text-gray-500'>Total</span>
      </div>

      <div className='grid grid-cols-3 gap-2 text-xs border-t pt-4'>
        <div>
          <span className='block text-gray-400 mb-1'>Today</span>
          <span className='font-semibold text-gray-700'>{data.today}</span>
        </div>
        <div>
          <span className='block text-gray-400 mb-1'>This Month</span>
          <span className='font-semibold text-gray-700'>{data.month}</span>
        </div>
        <div>
          <span className='block text-gray-400 mb-1'>This Year</span>
          <span className='font-semibold text-gray-700'>{data.year}</span>
        </div>
      </div>
    </div>
  );
}

export default async function AdminDashboard() {
  let customers = [];
  let stats = { 
    customers: { total: 0, today: 0, month: 0, year: 0 }, 
    sms: { total: 0, today: 0, month: 0, year: 0 }, 
    mandates: { total: 0, today: 0, month: 0, year: 0 } 
  };

  try {
    const [fetchedCustomers, fetchedStats] = await Promise.all([
      prisma.customer.findMany({
        orderBy: { created_at: 'desc' },
        take: 20,
      }),
      getDashboardStats()
    ]);
    
    customers = fetchedCustomers;
    stats = fetchedStats;
  } catch (error) {
    console.error("Dashboard data fetch error:", error);
    // Silent fail or partial data - stats are already init to zero
  }

  async function createCustomer(formData: FormData) {
    'use server';
    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    
    if (!name || !phone) return;

    const token = generateSecureToken();
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 48); // 48 hours expiry

    await prisma.customer.create({
      data: {
        full_name: name,
        phone_number: phone,
        session_token: token,
        token_expiry: expiry,
        status: 'PENDING',
      },
    });
    
    revalidatePath('/admin');
  }

  // Helper for status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'SUBMITTED': return 'bg-green-100 text-green-800';
      case 'EXPIRED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className='flex flex-col space-y-6'>
      <div className='flex justify-between items-center'>
            <h1 className='text-2xl font-bold text-gray-900'>Dashboard Overview</h1>
        </div>

        {/* Stats Grid */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <StatCard 
            title="Total Customers" 
            icon={<Users className="w-6 h-6 text-blue-600" />} 
            data={stats.customers}
            colorClass="bg-blue-600"
          />
          <StatCard 
            title="SMS Sent" 
            icon={<MessageSquare className="w-6 h-6 text-purple-600" />} 
            data={stats.sms}
            colorClass="bg-purple-600"
          />
          <StatCard 
            title="Mandates Submitted" 
            icon={<FileText className="w-6 h-6 text-green-600" />} 
            data={stats.mandates}
            colorClass="bg-green-600"
          />
        </div>
        
        {/* Quick Action: New Customer */}
        <div className='bg-white p-6 rounded-lg shadow-sm border border-gray-200'>
          <h2 className='text-lg font-semibold text-gray-800 mb-4'>Quick Action: New Walk-in Customer</h2>
          <form action={createCustomer} className='flex gap-4 items-end'>
            <div className='flex-1'>
              <label className='block text-sm font-medium text-gray-700'>Customer Name</label>
              <input name='name' type='text' className='mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border' required />
            </div>
            <div className='flex-1'>
              <label className='block text-sm font-medium text-gray-700'>Phone Number</label>
              <input name='phone' type='text' className='mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border' required />
            </div>
            <button type='submit' className='bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700'>
              Generate Link
            </button>
          </form>
        </div>

        {/* Customer List */}
        <div className='bg-white rounded-lg shadow overflow-hidden'>
          <div className='px-6 py-4 border-b'>
            <h2 className='text-lg font-semibold'>Recent Mandate Requests</h2>
          </div>
          <table className='min-w-full divide-y divide-gray-200'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Name</th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Status</th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Generated Link</th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Created</th>
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-200'>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>{c.full_name}</td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(c.status)}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-blue-600'>
                    {c.session_token ? (
                        <a href={'/session/' + c.session_token} target='_blank' rel='noopener noreferrer' className='hover:underline'>
                            Open Form
                        </a>
                    ) : (
                        <span className='text-gray-400'>Completed</span>
                    )}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>{c.created_at.toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
  );
}
