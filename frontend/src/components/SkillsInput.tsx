import React, { useState, useEffect, useRef } from "react";
import { api } from "../lib/api";
import type { Skill } from "../lib/types";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Plus, Loader2 } from "lucide-react";

interface SkillsInputProps {
  projectId: number;
  onSkillAdded: (skill: { id: number; name: string }) => void;
  existingSkillNames: string[];
}

export function SkillsInput({ projectId, onSkillAdded, existingSkillNames }: SkillsInputProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState("");
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch autocomplete suggestions
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsLoading(true);
      setError("");
      try {
        const skills = await api.autocompleteSkills(query);
        // Filter out skills already in the project
        const filtered = skills.filter(
          (skill) => !existingSkillNames.some((n) => n.toLowerCase() === skill.name.toLowerCase())
        );
        setSuggestions(filtered.slice(0, 10));
        setShowDropdown(true);
      } catch (err) {
        console.error("Ошибка при автодополнении навыков:", err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query, existingSkillNames]);

  const handleAddSkill = async (skillId?: number, name?: string) => {
    const targetName = name?.trim() || query.trim();
    if (!skillId && !targetName) return;

    // Avoid duplicate names check locally
    if (targetName && existingSkillNames.some((n) => n.toLowerCase() === targetName.toLowerCase())) {
      setError("Этот навык уже добавлен к проекту");
      return;
    }

    setIsAdding(true);
    setError("");
    try {
      const response = await api.addSkillToProject(projectId, {
        skill_id: skillId,
        name: skillId ? undefined : targetName,
      });

      onSkillAdded({
        id: response.id || response.skill_id,
        name: response.name || targetName,
      });

      setQuery("");
      setSuggestions([]);
      setShowDropdown(false);
    } catch (err: any) {
      setError(err?.message || "Не удалось добавить навык");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="relative w-full flex flex-col gap-1.5" ref={dropdownRef}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAddSkill();
        }}
        className="flex gap-2"
      >
        <div className="relative flex-1">
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.trim() && setShowDropdown(true)}
            placeholder="Введите название навыка (например, Python)..."
            className="w-full pr-8"
            disabled={isAdding}
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
        <Button
          type="submit"
          disabled={isAdding || !query.trim()}
          className="shrink-0"
        >
          {isAdding ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4 mr-1" />
          )}
          Добавить
        </Button>
      </form>

      {error && <p className="text-xs font-medium text-destructive mt-0.5">{error}</p>}

      {/* Autocomplete Suggestions Dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute top-full left-0 z-50 w-full mt-1 rounded-none border border-border bg-popover text-popover-foreground shadow-lg max-h-60 overflow-y-auto">
          <ul className="py-1">
            {suggestions.map((skill) => (
              <li
                key={skill.id}
                onClick={() => handleAddSkill(skill.id, skill.name)}
                className="relative flex cursor-pointer select-none items-center rounded-none px-3 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                {skill.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
