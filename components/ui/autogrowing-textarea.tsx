"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ChangeEvent, useMemo, useRef } from "react";
import { Noop, RefCallBack } from "react-hook-form";

export default function AutoGrowingTextarea({ className, field, disabled }: {
    className?: string,
    field: {
        onChange: (...event: any[]) => void;
        onBlur: Noop;
        value: string;
        name: "description";
        ref: RefCallBack;
        disabled?: boolean;
    }
    disabled?: boolean;
}) {
    const maxLength = 5001;
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const defaultRows = 1;
    const maxRows = undefined;

    const characterCount = useMemo(() => {
        return field.value?.length || 0;
    }, [field.value])

    const handleInput = (e: ChangeEvent<HTMLTextAreaElement>) => {
        if (e.target.value.length >= maxLength) return
        const textarea = e.target;
        textarea.style.height = "auto";

        const style = window.getComputedStyle(textarea);
        const borderHeight = parseInt(style.borderTopWidth) + parseInt(style.borderBottomWidth);
        const paddingHeight = parseInt(style.paddingTop) + parseInt(style.paddingBottom);

        const lineHeight = parseInt(style.lineHeight);
        const maxHeight = maxRows ? lineHeight * maxRows + borderHeight + paddingHeight : Infinity;

        const newHeight = Math.min(textarea.scrollHeight + borderHeight, maxHeight);

        textarea.style.height = `${newHeight}px`;

        field.onChange(e);
    };

    return (
        <div className="relative">
            <Textarea
                id="textarea-19"
                {...field}
                // placeholder="Program description"
                ref={textareaRef}
                onChange={handleInput}
                disabled={disabled}
                rows={defaultRows}
                className={cn("min-h-[none] resize-none", className)}
            />
            <div
                id="character-count"
                className="pointer-events-none top-2 absolute right-2 flex items-center justify-center pe-3 text-xs tabular-nums text-muted-foreground peer-disabled:opacity-50"
                aria-live="polite"
                role="status"
            >
                {characterCount}/{maxLength - 1}
            </div>
        </div>
    );
}