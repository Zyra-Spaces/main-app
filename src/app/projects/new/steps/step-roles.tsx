"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PREDEFINED_PROJECT_ROLES } from "@/lib/project-roles";

type Role = { role: string; count: number };

type StepRolesProps = {
  roles: Role[];
  addRole: () => void;
  removeRole: (i: number) => void;
  updateRole: (i: number, field: keyof Role, value: string | number) => void;
};

export function StepRoles({
  roles,
  addRole,
  removeRole,
  updateRole,
}: StepRolesProps) {
  return (
    <div className="space-y-4">
      <p className="font-inconsolata text-sm text-muted-foreground">
        Select a role and the number of spots needed.
      </p>
      {roles.map((r, i) => (
        <div key={i} className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="font-inconsolata text-sm mb-1 block">Role</label>
            <Select
              placeholder="Select role"
              options={PREDEFINED_PROJECT_ROLES.map((opt) => ({
                value: opt.value,
                label: opt.label,
              }))}
              value={r.role}
              onChange={(e) => updateRole(i, "role", e.target.value)}
            />
          </div>
          <div className="w-28">
            <label className="font-inconsolata text-sm mb-1 block">Spots</label>
            <Input
              type="number"
              min={1}
              max={99}
              value={r.count}
              onChange={(e) =>
                updateRole(i, "count", parseInt(e.target.value, 10) || 1)
              }
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeRole(i)}
            disabled={roles.length === 1}
          >
            ×
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={addRole}>
        Add role
      </Button>
    </div>
  );
}
