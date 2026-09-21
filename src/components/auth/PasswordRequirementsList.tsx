"use client";

import { checkPasswordRequirements } from "@/lib/authValidation";

interface PasswordRequirementsListProps {
  password: string;
}

export function PasswordRequirementsList({ password }: PasswordRequirementsListProps) {
  const requirements = checkPasswordRequirements(password);

  return (
    <ul className="flex flex-col gap-1 px-1">
      {requirements.map((requirement) => (
        <li
          key={requirement.id}
          className={`flex items-center gap-2 font-mono text-xs transition-colors ${
            requirement.met ? "text-text" : "text-text-dim"
          }`}
        >
          <span
            className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border text-[9px] leading-none transition-colors ${
              requirement.met ? "border-white/40 bg-white/10" : "border-white/15"
            }`}
          >
            {requirement.met ? "✓" : ""}
          </span>
          {requirement.label}
        </li>
      ))}
    </ul>
  );
}
