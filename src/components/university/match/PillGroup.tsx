interface Option {
  id: string;
  label: string;
}

interface PillGroupProps {
  options: readonly Option[];
  selected: string[];
  onToggle: (id: string) => void;
}

/** Multi-select row of pill buttons. Used for subjects and regions. */
export function PillGroup({ options, selected, onToggle }: PillGroupProps) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {options.map((option) => {
        const isSelected = selected.includes(option.id);
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onToggle(option.id)}
            className={`rounded-full border px-[18px] py-2.5 text-[15px] font-medium transition-all duration-150 ${
              isSelected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-foreground hover:-translate-y-px hover:border-primary"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
