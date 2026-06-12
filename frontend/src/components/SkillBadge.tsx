import { X } from "lucide-react";
import { Badge } from "./ui/badge";

interface SkillBadgeProps {
  name: string;
  onRemove?: () => void;
  onClick?: () => void;
  className?: string;
  active?: boolean;
}

export function SkillBadge({ name, onRemove, onClick, className = "", active = false }: SkillBadgeProps) {
  return (
    <Badge
      variant={active ? "default" : "secondary"}
      className={`cursor-pointer gap-1 select-none py-1 px-3 text-xs font-semibold ${
        onClick ? "active:scale-95 transition-transform" : ""
      } ${className}`}
      onClick={onClick}
    >
      <span>{name}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title={`Удалить навык ${name}`}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </Badge>
  );
}
