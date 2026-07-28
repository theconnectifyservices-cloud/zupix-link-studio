import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, LayoutDashboard, User, Settings, Building2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "@/features/auth/hooks/use-session";
import { useProfile } from "@/features/auth/hooks/use-profile";
import { signOut } from "@/features/auth/api";
import { APP_CONFIG } from "@/config/app.config";

export function LandingHeader() {
  const session = useSession();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const userId = session.status === "authenticated" ? session.session.user.id : undefined;
  const { data: profile } = useProfile(userId);
  const isAuthed = session.status === "authenticated";
  const email = isAuthed ? session.session!.user.email : undefined;
  const name = profile?.display_name || profile?.username || email || "Account";
  const initials = (name || "?").slice(0, 2).toUpperCase();

  async function handleSignOut() {
    await qc.cancelQueries();
    qc.clear();
    await signOut();
    toast.success("Signed out");
    navigate({ to: "/" });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6">
        <Link to="/" className="flex min-w-0 shrink items-center gap-2 text-sm font-semibold tracking-tight">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-orange-500 to-pink-500 text-white">
            Z
          </span>
          <span className="truncate">{APP_CONFIG.shortName}</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <a href="#showcase" className="hover:text-foreground">Showcase</a>
          <a href="#features" className="hover:text-foreground">Features</a>
          <Link to="/pricing" className="hover:text-foreground">Pricing</Link>
          <a href="#ecosystem" className="hover:text-foreground">Ecosystem</a>
        </nav>

        <div className="flex items-center gap-2">
          {session.status === "loading" ? (
            <div className="h-9 w-40 animate-pulse rounded-md bg-muted" />
          ) : isAuthed ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="hidden sm:inline-flex"
                onClick={() => navigate({ to: "/app" })}
              >
                <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1 pl-1 pr-3 text-sm hover:bg-white/10">
                    <Avatar className="h-7 w-7">
                      {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt="" />}
                      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                    </Avatar>
                    <span className="max-w-[120px] truncate">{name}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="truncate">{email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate({ to: "/app" })}>
                    <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate({ to: "/app/projects" })}>
                    <Building2 className="mr-2 h-4 w-4" /> Workspace
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate({ to: "/app/settings/profile" })}>
                    <User className="mr-2 h-4 w-4" /> Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate({ to: "/app/settings/preferences" })}>
                    <Settings className="mr-2 h-4 w-4" /> Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate({ to: "/login" })}
              >
                Sign In
              </Button>
              <Button
                size="sm"
                className="bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:opacity-90"
                onClick={() => navigate({ to: "/signup" })}
              >
                Start Building
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
