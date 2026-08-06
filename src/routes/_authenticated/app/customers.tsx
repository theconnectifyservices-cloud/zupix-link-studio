
import { createFileRoute } from '@tanstack/react-router';
import { useBioPages } from '@/features/bio-pages/hooks/use-bio-pages';
import { CustomerCenter } from '@/features/customers';

export const Route = createFileRoute('/_authenticated/app/customers')({
  component: CustomersPage,
});

function CustomersPage() {
  const { currentWorkspace } = useBioPages();

  if (!currentWorkspace) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <p className="text-muted-foreground">Select a workspace to view customers.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customer Management</h1>
          <p className="text-muted-foreground">
            View and manage people who interacted with your bio links.
          </p>
        </div>
      </div>

      <CustomerCenter workspaceId={currentWorkspace.id} />
    </div>
  );
}
