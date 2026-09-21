export const PASSWORD_MIN_LENGTH = 8;

export interface PasswordRequirement {
  id: string;
  label: string;
  met: boolean;
}

// Only for *creating* a password (sign-up) — signing in just checks the
// field isn't empty, since a real existing password may predate these
// rules or differ from them.
export function checkPasswordRequirements(password: string): PasswordRequirement[] {
  return [
    {
      id: "length",
      label: `At least ${PASSWORD_MIN_LENGTH} characters`,
      met: password.length >= PASSWORD_MIN_LENGTH,
    },
    {
      id: "uppercase",
      label: "One uppercase letter",
      met: /[A-Z]/.test(password),
    },
    {
      id: "lowercase",
      label: "One lowercase letter",
      met: /[a-z]/.test(password),
    },
    {
      id: "special",
      label: "One special character",
      met: /[^A-Za-z0-9]/.test(password),
    },
  ];
}

export function isValidPassword(password: string): boolean {
  return checkPasswordRequirements(password).every((requirement) => requirement.met);
}

// For the submit-time inline error — lists exactly what's still missing,
// e.g. "Password must have one uppercase letter, one special character."
export function passwordRequirementsErrorMessage(password: string): string | null {
  const unmet = checkPasswordRequirements(password).filter((requirement) => !requirement.met);
  if (unmet.length === 0) return null;
  return `Password must have ${unmet.map((requirement) => requirement.label.toLowerCase()).join(", ")}.`;
}
