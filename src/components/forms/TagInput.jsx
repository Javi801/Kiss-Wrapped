import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Input } from "@/components/ui/input";
import { TEXT } from "@/lib/constants";
import { usePalette } from "@/lib/theme";

export default function TagInput({
  value,
  onChange,
  tags,
  onAddTag,
  placeholder,
  maxLength,
  style,
  addTagLabel,
}) {
  const PALETTE = usePalette();
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState(null);
  const containerRef = useRef(null);

  const trimmed = value.trim();
  const filtered = tags.filter(
    (tag) => !trimmed || tag.toLowerCase().includes(trimmed.toLowerCase()),
  );
  const showAddOption =
    trimmed && !tags.some((t) => t.toLowerCase() === trimmed.toLowerCase());
  const showDropdown = open && rect && (filtered.length > 0 || showAddOption);

  function measure() {
    if (containerRef.current) {
      setRect(containerRef.current.getBoundingClientRect());
    }
  }

  function handleFocus() {
    measure();
    setOpen(true);
  }

  function handleChange(e) {
    onChange(e.target.value);
    measure();
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;

    function closeIfOutside(e) {
      if (!containerRef.current?.contains(e.target)) setOpen(false);
    }

    function reposition() {
      if (!containerRef.current) return;
      const newRect = containerRef.current.getBoundingClientRect();
      if (newRect.bottom < 0 || newRect.top > window.innerHeight) {
        setOpen(false);
      } else {
        setRect(newRect);
      }
    }

    document.addEventListener("mousedown", closeIfOutside);
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      document.removeEventListener("mousedown", closeIfOutside);
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open]);

  function selectTag(tag) {
    onChange(tag);
    setOpen(false);
  }

  function handleAddTag() {
    if (!trimmed) return;
    onAddTag?.(trimmed);
    onChange(trimmed);
    setOpen(false);
  }

  return (
    <div ref={containerRef}>
      <Input
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
        placeholder={placeholder}
        maxLength={maxLength}
        className="rounded-2xl"
        style={style}
      />

      {showDropdown && createPortal(
        <div
          style={{
            position: "fixed",
            top: rect.bottom + 4,
            left: rect.left,
            width: rect.width,
            zIndex: 9999,
            borderRadius: "0.75rem",
            border: `1px solid ${PALETTE.inputBorder}`,
            backgroundColor: PALETTE.card,
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            overflow: "hidden",
          }}
        >
          {filtered.map((tag, i) => {
            const selected = value === tag;
            return (
              <button
                key={tag}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); selectTag(tag); }}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "0.5rem 0.75rem",
                  ...TEXT.body,
                  color: selected ? PALETTE.accent : PALETTE.text,
                  backgroundColor: selected ? PALETTE.accentMuted : "transparent",
                  fontWeight: selected ? "600" : "400",
                  cursor: "pointer",
                  borderTop: i > 0 ? `1px solid ${PALETTE.inputBorder}` : "none",
                }}
              >
                {tag}
              </button>
            );
          })}
          {showAddOption && (
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); handleAddTag(); }}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "0.5rem 0.75rem",
                ...TEXT.body,
                color: PALETTE.accent,
                fontWeight: "500",
                cursor: "pointer",
                borderTop: filtered.length > 0 ? `1px solid ${PALETTE.inputBorder}` : "none",
              }}
            >
              {`+ ${addTagLabel} "${trimmed}"`}
            </button>
          )}
        </div>,
        document.body,
      )}
    </div>
  );
}
