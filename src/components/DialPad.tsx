"use client";

type DialPadProps = {
  value: string;
  onChange: (next: string) => void;
  maxLength?: number;
};

function BackspaceIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M9.5 18L4 12l5.5-6H19a1 1 0 011 1v10a1 1 0 01-1 1H9.5z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M13.5 14.5L10.5 11.5M13.5 11.5L10.5 14.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function DialPad({
  value,
  onChange,
  maxLength = 12,
}: DialPadProps) {
  function append(digit: string) {
    if (value.length >= maxLength) return;
    onChange(value + digit);
  }

  function backspace() {
    onChange(value.slice(0, -1));
  }

  const digitKeyClass =
    "flex aspect-square w-full min-w-0 items-center justify-center rounded-lg border border-neutral-300 bg-white text-[2.5rem] font-bold leading-none tracking-tight text-neutral-900 outline-none transition-[background-color,transform] select-none touch-manipulation active:scale-[0.98] active:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-card";

  const backspaceKeyClass =
    "flex aspect-square w-full min-w-0 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-100 text-neutral-400 outline-none transition-[background-color,transform] select-none touch-manipulation active:scale-[0.98] active:bg-neutral-200/80 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:pointer-events-none disabled:border-neutral-200 disabled:bg-neutral-50 disabled:text-neutral-300";

  const rows: (string | null)[][] = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    [null, "0", "back"],
  ];

  return (
    <div className="w-full bg-card" role="group" aria-label="숫자 입력 패드">
      <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
        {rows.flatMap((row, ri) =>
          row.map((cell, ci) => {
            const key = `${ri}-${ci}`;
            if (cell === null) {
              return (
                <span
                  key={key}
                  className="aspect-square w-full min-w-0"
                  aria-hidden
                />
              );
            }
            if (cell === "back") {
              return (
                <button
                  key={key}
                  type="button"
                  className={backspaceKeyClass}
                  onClick={backspace}
                  aria-label="마지막 숫자 지우기"
                  disabled={value.length === 0}
                >
                  <BackspaceIcon className="shrink-0" />
                </button>
              );
            }
            return (
              <button
                key={key}
                type="button"
                className={digitKeyClass}
                onClick={() => append(cell)}
              >
                {cell}
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
}
