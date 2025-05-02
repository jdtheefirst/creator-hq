"use client";

import { useState, useRef, KeyboardEvent } from "react";
import {
  useController,
  UseControllerProps,
  FieldValues,
} from "react-hook-form";
import { Label } from "@/components/ui/label";

interface TagsInputProps<T extends FieldValues> extends UseControllerProps<T> {
  label?: string;
  maxTags?: number;
  maxLength?: number;
}

export function TagsInput<T extends FieldValues>({
  label,
  maxTags = 10,
  maxLength = 20,
  ...props
}: TagsInputProps<T>) {
  const {
    field: { value = [] as string[], onChange },
    fieldState: { error },
  } = useController({
    ...props,
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState(props.defaultValue || "");

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && input.trim()) {
      e.preventDefault();
      const newTag = input.trim().slice(0, maxLength);
      if (value.length < maxTags && !value.includes(newTag)) {
        onChange([...value, newTag]);
      }
      setInput("");
    }

    if (e.key === "Backspace" && input === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-1 w-full">
      {label && (
        <Label htmlFor={props.name} className="flex items-center gap-2">
          {label}
          <span className="text-muted-foreground text-xs flex items-center gap-1">
            <kbd className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
              Enter
            </kbd>
            <span>or</span>
            <kbd className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
              ,
            </kbd>
          </span>
        </Label>
      )}

      <div
        className="flex flex-wrap gap-2 border px-3 py-2 rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag: string, i: number) => (
          <span
            key={i}
            className="bg-accent text-accent-foreground text-sm px-2 py-1 rounded-full flex items-center gap-1"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(i)}
              className="text-muted-foreground hover:text-foreground focus:outline-none"
            >
              ×
            </button>
          </span>
        ))}
        {value.length < maxTags && (
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add tag..."
            className="flex-1 min-w-[100px] bg-transparent outline-none text-sm border-none focus:ring-0 focus:outline-none"
          />
        )}
      </div>
      {error && (
        <p className="text-sm text-destructive mt-1">{error.message}</p>
      )}
      <p className="text-sm text-muted-foreground mt-1">
        Max {maxTags} tags, {maxLength} chars each
      </p>
    </div>
  );
}
