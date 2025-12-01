import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function UserManagement() {
  const session = await getServerSession(authOptions);
  
  // Double-check authorization (defense in depth)
  if (!session?.user || session.user.role !== 'admin') {
    redirect('/?unauthorized=1');
  }
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col items-center space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            User Management Coming Soon
          </p>
        </div>
      </div>
    </div>
  );
}
