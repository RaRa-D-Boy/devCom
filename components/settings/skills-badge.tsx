"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SkillsBadgeProps {
  skill: string;
  onRemove: (skill: string) => void;
  variant?: "default" | "secondary";
}

export function SkillsBadge({ skill, onRemove, variant = "default" }: SkillsBadgeProps) {
  return (
    <div
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
        variant === "default"
          ? "bg-blue-100 text-blue-800 border border-blue-200"
          : "bg-gray-100 text-gray-800 border border-gray-200"
      }`}
    >
      <span>{skill}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRemove(skill)}
        className="h-4 w-4 p-0 hover:bg-transparent"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
