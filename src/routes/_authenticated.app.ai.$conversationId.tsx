import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";
import { PageLoader } from "@/shared/ui/page-loader";
import { EmptyState } from "@/shared/ui/empty-state";
import { Sparkles } from "lucide-react";
import { PageHeader } from "@/shared/navigation/page-header";
import { useCurrentWorkspace } from "@/features/bio-pages/hooks/use-current-workspace";
import { useSession } from "@/features/auth/hooks/use-session";
import {
  ChatWindow,
  ConversationList,
  useConversations,
  useCreateConversation,
} from "@/features/ai";
import { z } from "zod";

const searchSchema = z.object({
  seed: z.string().optional(),
});

function ConversationRoute() {
  const { conversationId } = Route.useParams();
  const { workspace, isLoading } = useCurrentWorkspace();
  const session = useSession();
  const userId = session.status === "authenticated" ? session.session.user.id : undefined;
  const navigate = useNavigate();
  const workspaceId = workspace?.id;
  const { data: convs = [] } = useConversations(workspaceId);
  const create = useCreateConversation();
  const active = convs.find((c) => c.id === conversationId);

  async function startNew() {
    if (!workspaceId || !userId) return;
    try {
      const c = await create.mutateAsync({ workspaceId, userId });
      navigate({ to: "/app/ai/$conversationId", params: { conversationId: c.id } });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  useEffect(() => {
    // if the conversation is not in the current list, that's okay — messages
    // still load by id via RLS
  }, [conversationId]);

  if (isLoading || !userId) return <PageLoader label="Loading conversation" />;
  if (!workspace)
    return (
      <EmptyState
        icon={<Sparkles className="h-8 w-8" />}
        title="No workspace"
        description="Create or join a workspace to use ZUPIX AI."
      />
    );

  return (
    <div>
      <PageHeader
        title={active?.title ?? "Conversation"}
        breadcrumbs={[
          { label: "Dashboard", href: "/app" },
          { label: "AI", href: "/app/ai" },
          { label: active?.title ?? "Chat" },
        ]}
      />
      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="hidden lg:block">
          <ConversationList
            workspaceId={workspace.id}
            activeId={conversationId}
            onCreate={startNew}
          />
        </div>
        <ChatWindow
          conversationId={conversationId}
          workspaceId={workspace.id}
          workspaceName={workspace.name}
          workspaceSlug={workspace.slug}
          userId={userId}
          title={active?.title ?? "Chat"}
        />
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/app/ai/$conversationId")({
  validateSearch: (s) => searchSchema.parse(s),
  component: ConversationRoute,
});
