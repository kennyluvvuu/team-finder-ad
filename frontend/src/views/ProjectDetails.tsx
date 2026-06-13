import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import { SkillBadge } from "../components/SkillBadge";
import { SkillsInput } from "../components/SkillsInput";
import { Modal } from "../components/Modal";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { z } from "zod";
import {
  ArrowLeft,
  Calendar,
  Users,
  CheckCircle,
  FileEdit,
  Trash2,
  Lock,
  UserCheck,
  UserPlus,
  Loader2,
  AlertCircle,
  User as UserIcon,
} from "lucide-react";
import { Github } from "../components/icons/Github";

const editProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Название обязательно")
    .max(200, "Не более 200 символов"),
  description: z.string().optional(),
  github_url: z
    .string()
    .url("Некорректный URL (должен начинаться с http:// или https://)")
    .or(z.literal(""))
    .optional(),
});

type EditProjectForm = z.infer<typeof editProjectSchema>;

export function ProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const projectId = parseInt(id || "0", 10);
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // Modal States
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Form States
  const [formData, setFormData] = useState<EditProjectForm>({
    name: "",
    description: "",
    github_url: "",
  });
  const [formErrors, setFormErrors] = useState<Partial<EditProjectForm>>({});
  const [errorMsg, setErrorMsg] = useState("");

  // Fetch Project Details
  const {
    data: project,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => api.getProject(projectId),
    enabled: projectId > 0,
  });

  // Init edit form
  React.useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        description: project.description || "",
        github_url: project.github_url || "",
      });
    }
  }, [project]);

  // Mutations
  const updateMutation = useMutation({
    mutationFn: (data: EditProjectForm) => api.updateProject(projectId, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(["project", projectId], updated);
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setIsEditOpen(false);
      setFormErrors({});
      setErrorMsg("");
    },
    onError: (err: any) => {
      setErrorMsg(err?.message || "Не удалось сохранить проект");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteProject(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      navigate("/projects");
    },
  });

  const completeMutation = useMutation({
    mutationFn: () => api.completeProject(projectId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const participateMutation = useMutation({
    mutationFn: () => api.toggleParticipate(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-2" />
        <span className="text-muted-foreground text-sm font-medium">
          Загрузка деталей проекта...
        </span>
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="w-5 h-5" />
          <AlertTitle>Ошибка загрузки</AlertTitle>
          <AlertDescription>
            {error?.message ||
              "Проект не найден или у вас нет прав на его просмотр."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const isOwner = user ? project?.owner?.id === user.id : false;
  const isParticipant = user
    ? project?.participants?.some((p) => p.id === user.id) ?? false
    : false;
  const isClosed = project?.status === "closed";

  const formattedDate = project?.created_at
    ? new Date(project.created_at).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const result = editProjectSchema.safeParse(formData);
    if (!result.success) {
      const errors: Partial<EditProjectForm> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as keyof EditProjectForm] = err.message;
        }
      });
      setFormErrors(errors);
      return;
    }

    updateMutation.mutate(formData);
  };

  const handleRemoveSkill = async (skillId: number) => {
    try {
      await api.removeSkillFromProject(projectId, skillId);
      // Invalidate query to refetch updated skills list
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["usedSkills"] });
    } catch (err) {
      console.error("Не удалось удалить навык:", err);
    }
  };

  const handleSkillAdded = () => {
    queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    queryClient.invalidateQueries({ queryKey: ["projects"] });
    queryClient.invalidateQueries({ queryKey: ["usedSkills"] });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Back navigation */}
      <Link
        to="/projects"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />К списку проектов
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Project Description (Main panel) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-border/60 bg-card/70 backdrop-blur-md p-6 sm:p-8 shadow-sm">
            {/* Header info */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-5 mb-5">
              <div className="flex items-center gap-2">
                <Badge variant={isClosed ? "secondary" : "default"}>
                  {isClosed ? "Завершен" : "Открыт"}
                </Badge>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  Создан {formattedDate}
                </span>
              </div>

              {project.github_url && (
                <a
                  href={project.github_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline transition-all"
                >
                  <Github className="w-4 h-4" />
                  GitHub репозиторий
                </a>
              )}
            </div>

            {/* Title & Description */}
            <h1 className="text-3xl font-extrabold text-foreground mb-4 tracking-tight leading-tight">
              {project.name}
            </h1>

            <div className="text-muted-foreground text-sm sm:text-base leading-relaxed whitespace-pre-line">
              {project.description || "Описание проекта не заполнено."}
            </div>

            {/* Joining button (Not for owner) */}
            {isAuthenticated && !isOwner && (
              <div className="mt-8 pt-6 border-t border-border/50">
                <Button
                  onClick={() => participateMutation.mutate()}
                  disabled={
                    participateMutation.isPending ||
                    (isClosed && !isParticipant)
                  }
                  variant={isParticipant ? "destructive" : "default"}
                  className="font-semibold w-full sm:w-auto"
                >
                  {participateMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isParticipant ? (
                    <>
                      <Lock className="w-4 h-4 mr-1.5" />
                      Покинуть команду
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-1.5" />
                      Присоединиться к проекту
                    </>
                  )}
                </Button>
                {isClosed && !isParticipant && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Этот проект завершен, присоединиться нельзя
                  </p>
                )}
              </div>
            )}
          </Card>

          {/* Project Required Skills */}
          <Card className="border border-border/60 bg-card/70 backdrop-blur-md p-6 shadow-sm">
            <CardHeader className="p-0 pb-4 mb-4 border-b border-border/40">
              <CardTitle className="text-lg font-bold">
                Необходимые навыки
              </CardTitle>
              <CardDescription className="text-xs">
                {isOwner
                  ? "Управляйте требованиями: добавляйте новые навыки или удаляйте ненужные"
                  : "Навыки, необходимые для участия в этом проекте"}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-0 space-y-4">
              {/* Tags Cloud */}
              <div className="flex flex-wrap gap-2">
                {project.skills && project.skills.length > 0 ? (
                  project.skills.map((skill) => (
                    <SkillBadge
                      key={skill.id}
                      name={skill.name}
                      onRemove={
                        isOwner ? () => handleRemoveSkill(skill.id) : undefined
                      }
                    />
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground italic">
                    Навыки еще не указаны
                  </span>
                )}
              </div>

              {/* Add Skill form (Owner only) */}
              {isOwner && (
                <div className="pt-2">
                  <SkillsInput
                    projectId={projectId}
                    existingSkillNames={project?.skills?.map((s) => s.name) ?? []}
                    onSkillAdded={handleSkillAdded}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info & Controls */}
        <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24 self-start">
          {/* Owner details */}
          <Card className="border border-border/60 bg-card p-6 shadow-sm">
            <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider mb-4">
              Автор проекта
            </h3>

            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border-2 border-primary/20">
                <AvatarImage
                  src={project?.owner?.avatar}
                  alt={project?.owner?.name}
                />
                <AvatarFallback className="bg-primary text-primary-foreground font-bold text-sm">
                  {`${project?.owner?.name?.[0] || ""}${project?.owner?.surname?.[0] || ""}`.toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="overflow-hidden">
                <Link
                  to={`/users/${project?.owner?.id || ""}`}
                  className="font-bold text-foreground hover:text-primary block truncate transition-colors"
                >
                  {project?.owner?.name || ""} {project?.owner?.surname || ""}
                </Link>
                <span className="text-xs text-muted-foreground">Создатель</span>
              </div>
            </div>
          </Card>

          {/* Participants list */}
          <Card className="border p-6 shadow-xs">
            <div className="flex items-center justify-between gap-4 border-b pb-3 mb-4">
              <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">
                Участники команды
              </h3>
              <span className="text-xs font-bold text-muted-foreground px-1.5 py-0.5 bg-muted border rounded-none">
                {project?.participants?.length ?? 0}
              </span>
            </div>

            {(project?.participants?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                Пока нет участников команды
              </p>
            ) : (
              <div className="space-y-3">
                {project?.participants?.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Avatar className="h-8 w-8 border">
                        <AvatarImage
                          src={participant.avatar}
                          alt={participant.name}
                        />
                        <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-[10px]">
                          {`${participant.name[0] || ""}${participant.surname[0] || ""}`.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <Link
                        to={`/users/${participant.id}`}
                        className="text-sm font-semibold hover:text-primary block truncate transition-colors"
                      >
                        {participant.name} {participant.surname}
                      </Link>
                    </div>

                    {/* Owner indicator */}
                    {participant.id === project?.owner?.id && (
                      <Badge
                        variant="outline"
                        className="text-[9px] py-0 px-1.5"
                      >
                        Автор
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Owner Control Actions Panel */}
          {isOwner && (
            <Card className="border p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider border-b pb-3 mb-2">
                Управление проектом
              </h3>

              <div className="flex flex-col gap-2">
                {/* Complete Project button (Only if Open) */}
                {!isClosed && (
                  <Button
                    onClick={() => completeMutation.mutate()}
                    disabled={completeMutation.isPending}
                    className="w-full font-semibold"
                  >
                    {completeMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-1.5" />
                    )}
                    Завершить проект
                  </Button>
                )}

                {/* Edit Project button */}
                <Button
                  onClick={() => setIsEditOpen(true)}
                  variant="outline"
                  className="w-full font-semibold"
                >
                  <FileEdit className="w-4 h-4 mr-1.5" />
                  Редактировать
                </Button>

                {/* Delete Project button */}
                <Button
                  onClick={() => setIsDeleteOpen(true)}
                  variant="destructive"
                  className="w-full font-semibold shadow-md shadow-destructive/10"
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  Удалить проект
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Project Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Редактировать проект"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {errorMsg && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertTitle>Ошибка</AlertTitle>
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          )}

          {/* Project Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">Название проекта *</Label>
            <Input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData((p) => ({ ...p, name: e.target.value }));
                setFormErrors((p) => ({ ...p, name: undefined }));
              }}
              disabled={updateMutation.isPending}
            />
            {formErrors.name && (
              <p className="text-xs font-semibold text-destructive">
                {formErrors.name}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Описание проекта</Label>
            <Textarea
              id="description"
              name="description"
              className="min-h-[120px] resize-y"
              value={formData.description}
              onChange={(e) =>
                setFormData((p) => ({ ...p, description: e.target.value }))
              }
              disabled={updateMutation.isPending}
            />
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
                className="pl-10"
                value={formData.github_url}
                onChange={(e) => {
                  setFormData((p) => ({ ...p, github_url: e.target.value }));
                  setFormErrors((p) => ({ ...p, github_url: undefined }));
                }}
                disabled={updateMutation.isPending}
              />
            </div>
            {formErrors.github_url && (
              <p className="text-xs font-semibold text-destructive">
                {formErrors.github_url}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-border/50 pt-4 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditOpen(false)}
              disabled={updateMutation.isPending}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              className="font-semibold"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  Сохранение...
                </>
              ) : (
                "Сохранить"
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Удалить проект?"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Вы собираетесь безвозвратно удалить проект{" "}
            <strong className="text-foreground">"{project.name}"</strong>. Это
            действие нельзя будет отменить. Все связи с участниками и навыками
            будут потеряны.
          </p>

          <div className="flex justify-end gap-2 border-t border-border/50 pt-4 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              disabled={deleteMutation.isPending}
            >
              Отмена
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="font-semibold"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  Удаление...
                </>
              ) : (
                "Да, удалить"
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
