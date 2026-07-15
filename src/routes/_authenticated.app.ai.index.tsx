import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Sparkles, MessageSquare, Plus, Wand2, Palette } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/shared/navigation/page-header";
import { PageLoader } from "@/shared/ui/page-loader";
import { EmptyState } from "@/shared/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrentWorkspace } from "@/features/bio-pages/hooks/use-current-workspace";
import { useSession } from "@/features/auth/hooks/use-session";
import {
  ActivityList,
  ContextSummary,
  ConversationList,
  PromptLibrary,
  ToolsPanel,
  useConversations,
  useCreateConversation,
} from "@/features/ai";
import { formatDistanceToNow } from "date-fns";

function AiHome() {
  const { workspace, isLoading } = useCurrentWorkspace();
  const session = useSession();
  const userId = session.status === "authenticated" ? session.session.user.id : undefined;
  const navigate = useNavigate();
  const workspaceId = workspace?.id;
  const { data: convs = [] } = useConversations(workspaceId);
  const create = useCreateConversation();

  async function startNew() {
    if (!workspaceId || !userId) return;
    try {
      const c = await create.mutateAsync({ workspaceId, userId });
      navigate({ to: "/app/ai/$conversationId", params: { conversationId: c.id } });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  if (isLoading || !userId) return <PageLoader label="Loading AI workspace" />;
  if (!workspace)
    return (
      <EmptyState
        icon={<Sparkles className="h-8 w-8" />}
        title="No workspace"
        description="Create or join a workspace to use ZUPIX AI."
      />
    );

  const recent = convs.slice(0, 6);

  return (
    <div>
      <PageHeader
        title="ZUPIX AI Workspace"
        description="Your intelligent assistant for bio pages, templates, analytics and more."
        breadcrumbs={[{ label: "Dashboard", href: "/app" }, { label: "AI" }]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate({ to: "/app/ai/studio" })}>
              <Wand2 className="mr-1 h-4 w-4" /> Content Studio
            </Button>
            <Button onClick={startNew} disabled={create.isPending}>
              <Plus className="mr-1 h-4 w-4" /> New chat
            </Button>
          </div>
        }
      />
      <div className="space-y-6">
        <ContextSummary
          workspaceId={workspace.id}
          workspaceName={workspace.name}
          workspaceSlug={workspace.slug}
          userId={userId}
        />
        <Tabs defaultValue="recent">
          <TabsList>
            <TabsTrigger value="recent">Recent</TabsTrigger>
            <TabsTrigger value="suggested">Suggested tasks</TabsTrigger>
            <TabsTrigger value="tools">AI Tools</TabsTrigger>
            <TabsTrigger value="prompts">Prompt Library</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
          <TabsContent value="recent" className="mt-4">
            {recent.length === 0 ? (
              <EmptyState
                icon={<MessageSquare className="h-8 w-8" />}
                title="No conversations yet"
                description="Start a chat with ZUPIX AI to get help across your workspace."
                action={<Button onClick={startNew}>Start a chat</Button>}
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {recent.map((c) => (
                  <button
                    key={c.id}
                    onClick={() =>
                      navigate({
                        to: "/app/ai/$conversationId",
                        params: { conversationId: c.id },
                      })
                    }
                    className="rounded-lg border bg-card p-4 text-left transition hover:bg-muted/40"
                  >
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      <span className="truncate font-medium">{c.title}</span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {c.last_message_at
                        ? formatDistanceToNow(new Date(c.last_message_at), { addSuffix: true })
                        : "no messages yet"}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="suggested" className="mt-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <div key={s.title} className="rounded-lg border bg-card p-4">
                  <h4 className="font-medium">{s.title}</h4>
                  <p className="mt-1 text-xs text-muted-foreground">{s.description}</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-3"
                    onClick={async () => {
                      if (!workspaceId || !userId) return;
                      const c = await create.mutateAsync({
                        workspaceId,
                        userId,
                        title: s.title,
                      });
                      navigate({
                        to: "/app/ai/$conversationId",
                        params: { conversationId: c.id },
                        search: { seed: s.prompt } as never,
                      });
                    }}
                  >
                    Start
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="tools" className="mt-4">
            <ToolsPanel />
          </TabsContent>
          <TabsContent value="prompts" className="mt-4">
            <PromptLibrary workspaceId={workspace.id} userId={userId} />
          </TabsContent>
          <TabsContent value="activity" className="mt-4">
            <ActivityList workspaceId={workspace.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

const SUGGESTIONS = [
  {
    title: "Summarize my bio pages",
    description: "Get an overview of your active pages and their status.",
    prompt: "Give me a quick summary of my current bio pages and their statuses.",
  },
  {
    title: "Improve my top page",
    description: "Ideas to boost engagement on your best performing page.",
    prompt: "Suggest ways to improve engagement on my top bio page.",
  },
  {
    title: "Plan a launch checklist",
    description: "Draft a step-by-step checklist for launching a new page.",
    prompt: "Create a launch checklist for publishing a new bio page.",
  },
  {
    title: "Explain my recent analytics",
    description: "Ask about traffic, sources or conversions this week.",
    prompt: "Explain the key trends in my analytics this week.",
  },
];

export const Route = createFileRoute("/_authenticated/app/ai/")({
  component: AiHome,
});
