import { Link, useNavigate, useLocation } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { LogOut, Users, FolderKanban, LogIn, UserPlus } from "lucide-react";
import logoUrl from "../logo.svg";

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isActive = (path: string) => {
    if (path === "/") {
      return (
        location.pathname === "/" || location.pathname.startsWith("/projects")
      );
    }
    return location.pathname.startsWith(path);
  };

  const linkClass = (path: string) =>
    `flex items-center gap-2 px-3 py-1.5 border text-xs font-mono transition-all duration-150 ${
      isActive(path)
        ? "text-primary border-primary bg-primary/5 font-semibold"
        : "text-muted-foreground border-transparent hover:text-foreground hover:border-border hover:bg-accent/30"
    }`;

  // Helper for generating initial avatar
  const getInitials = () => {
    if (!user) return "";
    return `${user.name[0] || ""}${user.surname[0] || ""}`.toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-xs">
      {/* Terminal window chrome bar */}
      <div className="w-full bg-muted/40 border-b border-border/40 px-4 py-1.5 flex items-center justify-between text-[10px] font-mono text-muted-foreground select-none">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-destructive/60 inline-block"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60 inline-block"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60 inline-block"></span>
        </div>
        <div className="absolute left-1/2 transform -translate-x-1/2 hidden md:block">
          guest@team-finder-cli: ~/workspace
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
          <span>STATUS: ONLINE</span>
        </div>
      </div>

      <div className="container mx-auto flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 group font-mono">
          <div className="relative flex h-8 items-center justify-center transition-transform group-hover:scale-105">
            <img
              src={logoUrl}
              className="h-8 w-auto max-w-[120px] object-contain"
              alt="Logo"
            />
          </div>
          <span className="hidden sm:inline-block font-extrabold text-base tracking-tight text-foreground group-hover:text-primary transition-colors">
            team-finder
          </span>
          <span className="terminal-cursor"></span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link to="/projects" className={linkClass("/projects")}>
            <FolderKanban className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">projects.sh</span>
          </Link>
          <Link to="/users" className={linkClass("/users")}>
            <Users className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">members.sh</span>
          </Link>
        </nav>

        {/* User Actions */}
        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                to="/profile"
                className="flex items-center gap-2 hover:opacity-90 group transition-all font-mono"
                title="Редактировать профиль"
              >
                <Avatar className="h-7 w-7 border border-primary/20 rounded-none group-hover:border-primary transition-all">
                  <AvatarImage src={user.avatar} className="rounded-none" alt={user.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-[10px] rounded-none">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:inline text-xs text-foreground max-w-[120px] truncate">
                  {user.name}_{user.surname[0]}.
                </span>
              </Link>

              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/30 rounded-none transition-all"
                title="Выйти"
              >
                <LogOut className="w-3.5 h-3.5" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1 sm:gap-2 font-mono">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/login")}
                className="gap-1 text-xs border border-transparent hover:border-border rounded-none h-8"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">login</span>
              </Button>
              <Button
                size="sm"
                onClick={() => navigate("/register")}
                className="gap-1 text-xs border border-primary rounded-none h-8 bg-primary hover:bg-primary/95"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">register</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
