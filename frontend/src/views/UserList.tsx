import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Link } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import {
  Users,
  Search,
  Mail,
  Phone,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  AlertCircle,
  FileText,
} from "lucide-react";
import { Github } from "../components/icons/Github";

export function UserList() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: usersData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["users", page],
    queryFn: () => api.listUsers(page),
  });

  const results = usersData?.results || [];
  const totalCount = usersData?.count || 0;
  const pageSize = 6; // match backend page size
  const totalPages = Math.ceil(totalCount / pageSize);

  // Client-side search matching name, surname or about
  const filteredUsers = results.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(query) ||
      user.surname.toLowerCase().includes(query) ||
      (user.about && user.about.toLowerCase().includes(query))
    );
  });

  const getUserInitials = (name: string, surname: string) => {
    return `${name[0] || ""}${surname[0] || ""}`.toUpperCase();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-extrabold text-foreground tracking-tight mb-2 flex items-center gap-3">
            <Users className="w-9 h-9 text-primary" />
            Участники платформы
          </h1>
          <p className="text-muted-foreground">
            Найдите специалистов и единомышленников для совместной разработки Pet-проектов
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-md mb-8">
        <div className="relative">
          <Input
            type="text"
            placeholder="Поиск по имени, фамилии или ключевым словам..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10"
          />
          <Search className="absolute right-3 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
        </div>
      </div>

      {isLoading ? (
        /* Skeletal Loaders */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-56 rounded-xl border border-border/40 bg-muted/10 animate-pulse flex flex-col p-6 gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-2/3 bg-muted rounded" />
                  <div className="h-3 w-1/2 bg-muted rounded" />
                </div>
              </div>
              <div className="h-3 w-full bg-muted rounded mt-2" />
              <div className="h-3 w-5/6 bg-muted rounded" />
              <div className="h-8 w-full bg-muted rounded mt-auto" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <Alert variant="destructive">
          <AlertCircle className="w-5 h-5" />
          <AlertTitle>Ошибка при загрузке участников</AlertTitle>
          <AlertDescription>{error?.message || "Пожалуйста, обновите страницу."}</AlertDescription>
        </Alert>
      ) : filteredUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center border border-dashed border-border/60 bg-card rounded-2xl p-16 text-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center text-primary">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold mb-1">Никого не найдено</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Попробуйте скорректировать запрос в поле поиска.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Members grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((member) => (
              <Card
                key={member.id}
                className="flex flex-col h-full overflow-hidden border bg-card hover:border-muted-foreground/30 hover:shadow-md transition-all duration-300 group"
              >
                {/* Header with Avatar and Basic info */}
                <CardHeader className="p-5 pb-3 flex flex-row items-center gap-3">
                  <Avatar className="h-12 w-12 border">
                    <AvatarImage src={member.avatar} alt={`${member.name} ${member.surname}`} />
                    <AvatarFallback className="bg-primary text-primary-foreground font-bold text-sm">
                      {getUserInitials(member.name, member.surname)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="overflow-hidden">
                    <h3 className="font-bold text-base text-foreground truncate group-hover:text-primary transition-colors">
                      {member.name} {member.surname}
                    </h3>
                    <span className="text-xs text-muted-foreground truncate block">{member.email}</span>
                  </div>
                </CardHeader>

                {/* About section */}
                <CardContent className="p-5 pt-0 pb-4 flex-1 flex flex-col gap-3">
                  <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                    {member.about || "Информация о себе не заполнена."}
                  </p>

                  {/* Contact details */}
                  <div className="space-y-1 mt-auto">
                    {member.phone && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="w-3.5 h-3.5 shrink-0 text-muted-foreground/70" />
                        <span>{member.phone}</span>
                      </div>
                    )}
                    {member.github_url && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Github className="w-3.5 h-3.5 shrink-0 text-muted-foreground/70" />
                        <a
                          href={member.github_url}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline text-primary truncate"
                        >
                          GitHub профиль
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>

                {/* Footer details link */}
                <CardFooter className="p-5 pt-3 border-t border-border/50 bg-muted/20 flex justify-end">
                  <Link
                    to={`/users/${member.id}`}
                    className="inline-flex items-center gap-0.5 text-xs font-bold text-primary hover:underline transition-colors"
                  >
                    Подробнее
                    <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border/50 pt-6 mt-8">
              <span className="text-sm text-muted-foreground">
                Показано участников: <span className="font-semibold text-foreground">{filteredUsers.length}</span> из{" "}
                <span className="font-semibold text-foreground">{totalCount}</span>
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Назад
                </Button>
                <span className="text-xs text-muted-foreground font-semibold px-2">
                  Страница {page} из {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="gap-1"
                >
                  Вперед
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
