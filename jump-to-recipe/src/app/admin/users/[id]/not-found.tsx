import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function UserNotFound() {
  return (
    <div className="container mx-auto py-16 px-4 text-center">
      <h1 className="text-4xl font-bold mb-4">User Not Found</h1>
      <p className="text-muted-foreground mb-8">
        The user you are looking for does not exist or has been deleted.
      </p>
      <Button asChild>
        <Link href="/admin/users">Back to User List</Link>
      </Button>
    </div>
  );
}
