import type { TaskPriority } from "../types/task";
import { SearchIcon } from "./icons";

interface FilterBarProps {
    query: string;
    onQueryChange: (v: string) => void;
    priority: TaskPriority | "all";
    onPriorityChange: (v: TaskPriority | "all") => void;
}

const FILTERS: { value: TaskPriority | "all"; label: string }[] = [
    { value: "all", label: "All" },
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
];

export function FilterBar({
    query,
    onQueryChange,
    priority,
    onPriorityChange,
}: FilterBarProps) {
    return (
        <div className="filter-bar">
            <div className="filter-bar__search-wrap">
                <SearchIcon className="filter-bar__search-icon" />
                <input
                    className="filter-bar__search"
                    placeholder="Search tasks"
                    value={query}
                    onChange={(e) => onQueryChange(e.target.value)}
                />
            </div>
            <div className="filter-bar__segmented">
                {FILTERS.map((f) => (
                    <button
                        key={f.value}
                        type="button"
                        className={`filter-pill ${priority === f.value ? "filter-pill--active" : ""}`}
                        onClick={() => onPriorityChange(f.value)}
                    >
                        {f.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
