import type { Scenario } from "@/domain";

interface SavedScenario {
  name: string;
  scenario: Scenario;
}

interface Props {
  savedScenarios: SavedScenario[];
  onLoad: (scenario: Scenario, name: string) => void;
  onDelete: (index: number, name: string) => void;
}

export function SavedScenariosDropdown({ savedScenarios, onLoad, onDelete }: Props) {
  if (savedScenarios.length === 0) return null;

  return (
    <div className="flex-1 min-w-[200px]">
      <details className="group">
        <summary className="cursor-pointer text-sm text-[var(--color-primary)] hover:underline">
          Saved scenarios ({savedScenarios.length})
        </summary>
        <div
          className="mt-2 space-y-2 max-h-[200px] overflow-y-auto border rounded-lg p-3"
          style={{ borderColor: "var(--color-border)" }}
        >
          {savedScenarios.map((saved, idx) => (
            <div key={idx} className="flex items-center justify-between gap-2 text-sm">
              <button
                type="button"
                className="flex-1 text-left hover:underline text-[var(--color-primary)]"
                onClick={() => onLoad(saved.scenario, saved.name)}
              >
                {saved.name}
              </button>
              <button
                type="button"
                className="text-[var(--color-danger)] hover:underline"
                onClick={() => {
                  if (confirm(`Remove "${saved.name}"?`)) {
                    onDelete(idx, saved.name);
                  }
                }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
