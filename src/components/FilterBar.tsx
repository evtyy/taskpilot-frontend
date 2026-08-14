import type { TaskPriority } from "../types/task";

interface FilterBarProps {
  query: string;
  onQueryChange: (v: string) => void;
  priority: TaskPriority | "all";
  onPriorityChange: (v: TaskPriority | "all") => void;
}

export function FilterBar({
  query,
  onQueryChange,
  priority,
  onPriorityChange,
}: FilterBarProps) {
  return (
    <div className="filter-bar">
      <input
        className="filter-bar__search"
        placeholder="search for a task…"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
      />
      <select
        value={priority}
        onChange={(e) => onPriorityChange(e.target.value as TaskPriority | "all")}
      >
        <option value="all">all</option>
        <option value="low">low</option>
        <option value="medium">medium</option>
        <option value="high">high</option>
      </select>
    </div>
  );
}
