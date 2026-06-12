import { Link, useNavigate, useLocation } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { LogOut, Users, FolderKanban, LogIn, UserPlus } from "lucide-react";

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
      return location.pathname === "/" || location.pathname.startsWith("/projects");
    }
    return location.pathname.startsWith(path);
  };

  const linkClass = (path: string) =>
    `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
      isActive(path)
        ? "text-primary bg-primary/10 border-b-2 border-primary"
        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
    }`;

  // Helper for generating initial avatar
  const getInitials = () => {
    if (!user) return "";
    return `${user.name[0] || ""}${user.surname[0] || ""}`.toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg transition-transform group-hover:scale-105">
            <span className="font-bold text-lg font-mono">TF</span>
          </div>
          <span className="hidden sm:inline-block font-extrabold text-xl tracking-tight text-foreground hover:text-primary transition-colors">
            TeamFinder
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1 md:gap-4">
          <Link to="/projects" className={linkClass("/projects")}>
            <FolderKanban className="w-4 h-4" />
            <span>Проекты</span>
          </Link>
          <Link to="/users" className={linkClass("/users")}>
            <Users className="w-4 h-4" />
            <span>Участники</span>
          </Link>
        </nav>

        {/* User Actions */}
        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                to="/profile"
                className="flex items-center gap-2 hover:opacity-90 group transition-all"
                title="Редактировать профиль"
              >
                <Avatar className="h-9 w-9 border-2 border-primary/20 group-hover:border-primary transition-all">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-xs">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:inline text-sm font-medium text-foreground max-w-[120px] truncate">
                  {user.name} {user.surname}
                </span>
              </Link>

              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-destructive transition-all"
                title="Выйти"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1 md:gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate("/login")} className="gap-1">
                <LogIn className="w-4 h-4" />
                <span className="hidden xs:inline">Войти</span>
              </Button>
              <Button size="sm" onClick={() => navigate("/register")} className="gap-1 shadow-md">
                <UserPlus className="w-4 h-4" />
                <span className="hidden xs:inline">Регистрация</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

