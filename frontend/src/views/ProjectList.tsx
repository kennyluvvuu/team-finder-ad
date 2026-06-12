import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Project, Skill } from "../lib/types";
import { useAuth } from "../hooks/useAuth";
import { ProjectCard } from "../components/ProjectCard";
import { SkillBadge } from "../components/SkillBadge";
import { Modal } from "../components/Modal";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { z } from "zod";
import {
  Search,
  Plus,
  FilterX,
  Loader2,
  ChevronLeft,
  ChevronRight,
  FolderPlus,
  AlertCircle,
  Tag,
} from "lucide-react";
import { Github } from "../components/icons/Github";

// Zod validation for project creation
const createProjectSchema = z.object({
  name: z.string().min(1, "Название обязательно").max(200, "Не более 200 символов"),
  description: z.string().optional(),
  github_url: z
    .string()
    .url("Некорректный URL (должен начинаться с http:// или https://)")
    .or(z.literal(""))
    .optional(),
});

type CreateProjectForm = z.infer<typeof createProjectSchema>;

const POPULAR_SKILLS = ["Python", "JavaScript", "React", "Django", "TypeScript", "PostgreSQL", "CSS", "HTML"];

export function ProjectList() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const [activeSkills, setActiveSkills] = useState<string[]>([]);
  const [skillQuery, setSkillQuery] = useState("");
  const [skillSuggestions, setSkillSuggestions] = useState<Skill[]>([]);
  const [isSkillLoading, setIsSkillLoading] = useState(false);
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);
  const [page, setPage] = useState(1);

  // Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState<CreateProjectForm>({
    name: "",
    description: "",
    github_url: "",
  });
  const [formErrors, setFormErrors] = useState<Partial<CreateProjectForm>>({});
  const [createError, setCreateError] = useState("");

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close skill dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSkillDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch skill suggestions
  useEffect(() => {
    if (!skillQuery.trim()) {
      setSkillSuggestions([]);
      return;
    }

    const fetchSuggestions = setTimeout(async () => {
      setIsSkillLoading(true);
      try {
        const skills = await api.autocompleteSkills(skillQuery);
        // Exclude currently active filters
        const filtered = skills.filter(
          (skill) => !activeSkills.some((s) => s.toLowerCase() === skill.name.toLowerCase())
        );
        setSkillSuggestions(filtered);
        setShowSkillDropdown(true);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSkillLoading(false);
      }
    }, 250);

    return () => clearTimeout(fetchSuggestions);
  }, [skillQuery, activeSkills]);

  // Fetch projects list
  const {
    data: projectsData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["projects", activeSkills.join(","), page],
    queryFn: () => api.listProjects({ skills: activeSkills.join(","), page }),
    placeholderData: (previousData) => previousData, // keep old data while fetching new page
  });

  // Create Project mutation
  const createMutation = useMutation({
    mutationFn: api.createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setIsCreateOpen(false);
      setFormData({ name: "", description: "", github_url: "" });
      setFormErrors({});
      setCreateError("");
    },
    onError: (err: any) => {
      setCreateError(err?.message || "Не удалось создать проект");
    },
  });

  const handleAddSkillFilter = (skillName: string) => {
    const trimmed = skillName.trim();
    if (!trimmed) return;
    if (!activeSkills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setActiveSkills((prev) => [...prev, trimmed]);
      setPage(1); // reset to first page
    }
    setSkillQuery("");
    setShowSkillDropdown(false);
  };

  const handleRemoveSkillFilter = (skillName: string) => {
    setActiveSkills((prev) => prev.filter((s) => s.toLowerCase() !== skillName.toLowerCase()));
    setPage(1);
  };

  const handleClearFilters = () => {
    setActiveSkills([]);
    setPage(1);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");

    const result = createProjectSchema.safeParse(formData);
    if (!result.success) {
      const errors: Partial<CreateProjectForm> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as keyof CreateProjectForm] = err.message;
        }
      });
      setFormErrors(errors);
      return;
    }

    createMutation.mutate({
      name: formData.name,
      description: formData.description || "",
      github_url: formData.github_url || "",
      status: "open",
    });
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name as keyof CreateProjectForm]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // Pagination details
  const results = projectsData?.results || [];
  const totalCount = projectsData?.count || 0;
  const pageSize = 6; // matching backend page size
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Title section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-extrabold text-foreground tracking-tight mb-2">
            Поиск Pet-проектов
          </h1>
          <p className="text-muted-foreground">
            Найдите интересную команду или опубликуйте свой проект для поиска единомышленников
          </p>
        </div>

        {isAuthenticated && (
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="font-semibold gap-1.5 shrink-0"
          >
            <Plus className="w-5 h-5" />
            Создать проект
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4 border-b border-border/50 pb-4 mb-4">
              <h2 className="font-bold text-lg flex items-center gap-2 text-foreground">
                <Tag className="w-4 h-4 text-primary" />
                Фильтрация
              </h2>
              {activeSkills.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="h-8 text-xs font-semibold text-muted-foreground hover:text-destructive gap-1 px-2"
                >
                  <FilterX className="w-3.5 h-3.5" />
                  Сбросить
                </Button>
              )}
            </div>

            {/* Autocomplete Input */}
            <div className="space-y-4" ref={dropdownRef}>
              <div className="space-y-1.5">
                <Label htmlFor="search-skills" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Поиск по навыкам
                </Label>
                <div className="relative">
                  <Input
                    id="search-skills"
                    type="text"
                    value={skillQuery}
                    onChange={(e) => setSkillQuery(e.target.value)}
                    onFocus={() => skillQuery.trim() && setShowSkillDropdown(true)}
                    placeholder="Например, Python..."
                    className="w-full pr-8"
                  />
                  <Search className="absolute right-2.5 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
                </div>
                
                {/* Suggestions dropdown */}
                {showSkillDropdown && skillSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 rounded-md border border-border bg-popover text-popover-foreground shadow-lg max-h-48 overflow-y-auto">
                    <ul className="py-1">
                      {skillSuggestions.map((skill) => (
                        <li
                          key={skill.id}
                          onClick={() => handleAddSkillFilter(skill.name)}
                          className="relative flex cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                        >
                          {skill.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {showSkillDropdown && skillSuggestions.length === 0 && skillQuery.trim() && !isSkillLoading && (
                  <div className="absolute z-10 w-full mt-1 rounded-md border border-border bg-popover text-popover-foreground shadow-lg p-3 text-xs text-muted-foreground">
                    Нажмите Enter, чтобы отфильтровать по "{skillQuery.trim()}"
                  </div>
                )}
                
                {/* Fallback to Enter submit for arbitrary skills */}
                <input
                  type="submit"
                  className="hidden"
                  onClick={(e) => {
                    e.preventDefault();
                    if (skillQuery.trim()) {
                      handleAddSkillFilter(skillQuery);
                    }
                  }}
                />
              </div>

              {/* Active filters display */}
              {activeSkills.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Активные фильтры
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeSkills.map((skill) => (
                      <SkillBadge
                        key={skill}
                        name={skill}
                        onRemove={() => handleRemoveSkillFilter(skill)}
                        active
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Popular Skills */}
              <div className="space-y-2 pt-2 border-t border-border/40">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Популярные навыки
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_SKILLS.map((skill) => {
                    const isActive = activeSkills.some((s) => s.toLowerCase() === skill.toLowerCase());
                    return (
                      <SkillBadge
                        key={skill}
                        name={skill}
                        onClick={() => (isActive ? handleRemoveSkillFilter(skill) : handleAddSkillFilter(skill))}
                        active={isActive}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Projects Grid Panel */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {isLoading ? (
            /* Skeletal loaders */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-64 rounded-xl border border-border/40 bg-muted/10 animate-pulse flex flex-col p-6 gap-4">
                  <div className="h-6 w-1/3 bg-muted rounded" />
                  <div className="h-4 w-full bg-muted rounded" />
                  <div className="h-4 w-5/6 bg-muted rounded" />
                  <div className="h-10 w-full bg-muted rounded mt-auto" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <Alert variant="destructive">
              <AlertCircle className="w-5 h-5" />
              <AlertTitle>Ошибка загрузки проектов</AlertTitle>
              <AlertDescription>{error?.message || "Пожалуйста, попробуйте обновить страницу."}</AlertDescription>
            </Alert>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center border border-dashed bg-card rounded-2xl p-16 text-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center text-primary">
                <FolderPlus className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">Проекты не найдены</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  {activeSkills.length > 0
                    ? "Попробуйте изменить критерии фильтрации или сбросить навыки."
                    : "На платформе пока нет проектов. Будьте первыми!"}
                </p>
              </div>
              {activeSkills.length > 0 && (
                <Button onClick={handleClearFilters} variant="outline" size="sm" className="mt-2">
                  Сбросить фильтры
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Projects Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {results.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-border/50 pt-6 mt-4">
                  <span className="text-sm text-muted-foreground">
                    Показано проектов: <span className="font-semibold text-foreground">{results.length}</span> из{" "}
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
      </div>

      {/* Project Creation Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Создание проекта">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {createError && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertTitle>Ошибка</AlertTitle>
              <AlertDescription>{createError}</AlertDescription>
            </Alert>
          )}

          {/* Project Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">Название проекта *</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Например, Веб-чат на Django и React"
              value={formData.name}
              onChange={handleFormChange}
              disabled={createMutation.isPending}
            />
            {formErrors.name && (
              <p className="text-xs font-semibold text-destructive">{formErrors.name}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Описание проекта</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Опишите суть вашего проекта, цели, стек технологий и кого вы ищете..."
              className="min-h-[120px] resize-y"
              value={formData.description}
              onChange={handleFormChange}
              disabled={createMutation.isPending}
            />
            {formErrors.description && (
              <p className="text-xs font-semibold text-destructive">{formErrors.description}</p>
            )}
          </div>

          {/* GitHub URL */}
          <div className="space-y-1.5">
            <Label htmlFor="github_url">Ссылка на репозиторий GitHub</Label>
            <div className="relative">
              <Github className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
              <Input
                id="github_url"
                name="github_url"
                type="text"
                placeholder="https://github.com/username/project"
                className="pl-10"
                value={formData.github_url}
                onChange={handleFormChange}
                disabled={createMutation.isPending}
              />
            </div>
            {formErrors.github_url && (
              <p className="text-xs font-semibold text-destructive">{formErrors.github_url}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-border/50 pt-4 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
              disabled={createMutation.isPending}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              className="font-semibold"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Создание...
                </>
              ) : (
                "Создать"
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
