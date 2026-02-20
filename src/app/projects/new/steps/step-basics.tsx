"use client";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type StepBasicsProps = {
  name: string;
  setName: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  executionType: string;
  setExecutionType: (v: string) => void;
  startDate: string;
  setStartDate: (v: string) => void;
  endDate: string;
  setEndDate: (v: string) => void;
  categories: readonly { value: string; label: string }[];
  executionTypes: readonly { value: string; label: string }[];
};

export function StepBasics({
  name,
  setName,
  category,
  setCategory,
  executionType,
  setExecutionType,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  categories,
  executionTypes,
}: StepBasicsProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="font-inconsolata text-sm mb-2 block">Name</label>
        <Input
          placeholder="Project name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div>
        <label className="font-inconsolata text-sm mb-2 block">Category</label>
        <Select
          options={categories.map((c) => ({ value: c.value, label: c.label }))}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
      </div>
      <div>
        <label className="font-inconsolata text-sm mb-2 block">Execution type</label>
        <Select
          options={executionTypes.map((t) => ({ value: t.value, label: t.label }))}
          value={executionType}
          onChange={(e) => setExecutionType(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="font-inconsolata text-sm mb-2 block">Start date</label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div>
          <label className="font-inconsolata text-sm mb-2 block">End date</label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
