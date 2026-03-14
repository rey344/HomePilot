"use client";

import { useState, useRef, useEffect, useId } from "react";

export interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  id?: string;
}

export function Tooltip({ content, children, position = "top", id: idProp }: TooltipProps) {
  const [show, setShow] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const tooltipId = idProp ?? `tooltip-${generatedId.replace(/:/g, "")}`;

  const positionClass = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  }[position];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShow(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="relative inline-block">
      <span
        tabIndex={0}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        aria-describedby={show ? tooltipId : undefined}
        className="cursor-help inline-flex"
      >
        {children}
      </span>
      {show && (
        <div
          ref={tooltipRef}
          id={tooltipId}
          className={`absolute ${positionClass} z-50 px-3 py-2 text-xs rounded-[var(--radius-input)] shadow-[var(--shadow-card)] max-w-[240px] whitespace-normal pointer-events-none border`}
          style={{ backgroundColor: "var(--color-surface-card)", color: "var(--color-text-primary)", borderColor: "var(--color-border)" }}
          role="tooltip"
        >
          {content}
          <div
            className={`absolute w-2 h-2 transform rotate-45 ${
              position === "top"
                ? "bottom-[-4px] left-1/2 -translate-x-1/2"
                : position === "bottom"
                ? "top-[-4px] left-1/2 -translate-x-1/2"
                : position === "left"
                ? "right-[-4px] top-1/2 -translate-y-1/2"
                : "left-[-4px] top-1/2 -translate-y-1/2"
            }`}
            style={{ backgroundColor: "var(--color-surface-card)" }}
          />
        </div>
      )}
    </div>
  );
}
