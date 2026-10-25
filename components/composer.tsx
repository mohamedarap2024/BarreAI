"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { IconArrowUp, IconStop } from "@/components/icons";
import { cn } from "@/lib/utils";

type ComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop?: () => void;
  isGenerating?: boolean;
  model: string;
  onModelChange: (model: string) => void;
  disabled?: boolean;
};

const MODELS = [
  { id: "nvidia/nemotron-3.5-lightning:free", label: "Nemotron Lightning" },
  { id: "openrouter/free", label: "OpenRouter Free" },
  { id: "google/gemma-4-26b-a4b-it:free", label: "Gemma 4 Free" },
  { id: "poolside/laguna-xs-2.1:free", label: "Laguna XS Free" },
];

export function Composer({
  value,
  onChange,
  onSend,
  onStop,
  isGenerating = false,
  model,
  onModelChange,
  disabled = false,
}: ComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [value]);

  return (
    <div className="border-t border-border bg-background/90 px-4 py-4 backdrop-blur sm:px-6">
      <div className="mx-auto w-full max-w-3xl">
        <div className="rounded-2xl border border-border bg-panel p-2 shadow-[var(--shadow)] focus-within:ring-2 focus-within:ring-[var(--ring)]">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Message Barre AI…"
            rows={1}
            disabled={disabled}
            className="max-h-[180px] min-h-[44px] w-full resize-none bg-transparent px-3 py-2.5 text-[15px] leading-6 text-foreground outline-none placeholder:text-muted disabled:opacity-60"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (!isGenerating && value.trim()) onSend();
              }
            }}
          />
          <div className="flex items-center justify-between gap-2 px-1 pb-1">
            <select
              value={model}
              onChange={(e) => onModelChange(e.target.value)}
              className="h-9 max-w-[180px] rounded-xl border border-border bg-muted-bg px-3 text-xs text-foreground outline-none focus:ring-2 focus:ring-[var(--ring)] sm:max-w-none sm:text-sm"
              aria-label="Select model"
            >
              {MODELS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>

            {isGenerating ? (
              <Button
                variant="outline"
                size="icon"
                onClick={onStop}
                aria-label="Stop generating"
                className="shrink-0"
              >
                <IconStop className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                variant="accent"
                size="icon"
                onClick={onSend}
                disabled={disabled || !value.trim()}
                aria-label="Send message"
                className={cn("shrink-0", !value.trim() && "opacity-50")}
              >
                <IconArrowUp className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <p className="mt-2 text-center text-xs text-muted">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
