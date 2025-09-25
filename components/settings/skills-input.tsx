"use client";

import { useState, KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { SkillsBadge } from "./skills-badge";

interface SkillsInputProps {
  skills: string[];
  onSkillsChange: (skills: string[]) => void;
  placeholder?: string;
  maxSkills?: number;
}

const POPULAR_SKILLS = [
  "JavaScript", "TypeScript", "React", "Vue.js", "Angular", "Node.js", "Python", "Java", "C#", "Go",
  "PHP", "Ruby", "Swift", "Kotlin", "Rust", "C++", "C", "SQL", "MongoDB", "PostgreSQL",
  "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Git", "Linux", "Windows", "macOS", "iOS",
  "Android", "Web Development", "Mobile Development", "DevOps", "Machine Learning", "AI", "Data Science",
  "UI/UX Design", "Product Management", "Agile", "Scrum", "Project Management", "Leadership", "Mentoring"
];

export function SkillsInput({ 
  skills, 
  onSkillsChange, 
  placeholder = "Add a skill...", 
  maxSkills = 20 
}: SkillsInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleAddSkill = (skill: string) => {
    const trimmedSkill = skill.trim();
    if (
      trimmedSkill && 
      !skills.includes(trimmedSkill) && 
      skills.length < maxSkills
    ) {
      onSkillsChange([...skills, trimmedSkill]);
      setInputValue("");
      setShowSuggestions(false);
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    onSkillsChange(skills.filter(skill => skill !== skillToRemove));
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddSkill(inputValue);
    }
  };

  const filteredSuggestions = POPULAR_SKILLS.filter(
    skill => 
      skill.toLowerCase().includes(inputValue.toLowerCase()) &&
      !skills.includes(skill)
  ).slice(0, 8);

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setShowSuggestions(e.target.value.length > 0);
            }}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="flex-1"
          />
          <Button
            type="button"
            onClick={() => handleAddSkill(inputValue)}
            disabled={!inputValue.trim() || skills.includes(inputValue.trim()) || skills.length >= maxSkills}
            size="sm"
            className="bg-black hover:bg-gray-800 text-white"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
            {filteredSuggestions.map((skill) => (
              <button
                key={skill}
                onClick={() => handleAddSkill(skill)}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 text-sm"
              >
                {skill}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Skills display */}
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <SkillsBadge
              key={skill}
              skill={skill}
              onRemove={handleRemoveSkill}
            />
          ))}
        </div>
      )}

      <p className="text-xs text-gray-500">
        {skills.length}/{maxSkills} skills added. Press Enter or comma to add.
      </p>
    </div>
  );
}
