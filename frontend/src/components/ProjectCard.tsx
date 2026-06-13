import { Link } from "react-router";
import type { Project } from "../lib/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { SkillBadge } from "./SkillBadge";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Calendar, Users, ArrowUpRight } from "lucide-react";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const isClosed = project.status === "closed";

  const formattedDate = new Date(project.created_at).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const getOwnerInitials = () => {
    if (!project.owner) return "";
    return `${project.owner.name[0] || ""}${project.owner.surname[0] || ""}`.toUpperCase();
  };

  return (
    <Link to={`/projects/${project.id}`} className="block h-full group">
      <Card className="flex flex-col h-full overflow-hidden border border-border bg-card hover:border-primary/50 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_var(--primary)] transition-all duration-200 cursor-pointer">
        {/* Card Header with Status & Date */}
        <CardHeader className="p-5 pb-3">
          <div className="flex items-center justify-between gap-2 mb-2">
            {/* Status Badge */}
            <Badge variant={isClosed ? "secondary" : "default"}>
              {isClosed ? "Завершен" : "Открыт"}
            </Badge>

            {/* Date */}
            <span className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
              <Calendar className="w-3.5 h-3.5" />
              {formattedDate}
            </span>
          </div>

          {/* Title */}
          <CardTitle className="text-lg font-mono font-bold line-clamp-1 group-hover:text-primary transition-colors flex items-center gap-1.5">
            <span className="text-primary font-semibold select-none">&gt;</span>
            {project.name}
          </CardTitle>
        </CardHeader>

        {/* Card Content with Description & Skills */}
        <CardContent className="p-5 pt-0 pb-4 flex-1 flex flex-col gap-4">
          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed flex-1">
            {project.description || "Описание проекта отсутствует."}
          </p>

          {/* Skills Tag Cloud */}
          {project.skills && project.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-auto">
              {project.skills.slice(0, 4).map((skill) => (
                <SkillBadge key={skill.id} name={skill.name} />
              ))}
              {project.skills.length > 4 && (
                <Badge variant="outline" className="text-[10px] py-0.5 px-2 bg-muted/50">
                  +{project.skills.length - 4}
                </Badge>
              )}
            </div>
          )}
        </CardContent>

        {/* Card Footer with Owner & Participants */}
        <CardFooter className="p-5 pt-3 border-t bg-muted/10 flex items-center justify-between gap-4">
          {/* Owner Info */}
          <div className="flex items-center gap-2 max-w-[65%]">
            <Avatar className="h-7 w-7 border">
              <AvatarImage src={project.owner.avatar} alt={project.owner.name} />
              <AvatarFallback className="text-[9px] bg-primary text-primary-foreground font-semibold">
                {getOwnerInitials()}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium text-foreground truncate" title={`${project.owner.name} ${project.owner.surname}`}>
              {project.owner.name} {project.owner.surname[0]}.
            </span>
          </div>

          {/* Action Link & Members count */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-muted-foreground" title="Участники">
              <Users className="w-4 h-4" />
              <span className="text-xs font-semibold">{project.participants.length}</span>
            </div>

            <div className="inline-flex items-center gap-0.5 text-xs font-bold text-primary group-hover:underline transition-all">
              Детали
              <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}

