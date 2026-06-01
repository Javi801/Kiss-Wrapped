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
  isParentOpen,
}) {
  const PALETTE = usePalette();
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState(null);
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);

  const trimmed = value.trim();
  const filtered = tags.filter(
    (tag) => !trimmed || tag.toLowerCase().includes(trimmed.toLowerCase()),
  );
  const showAddOption =
    trimmed && !tags.some((t) => t.toLowerCase() === trimmed.toLowerCase());
  const effectiveOpen = isParentOpen === false ? false : open;
  const showDropdown = effectiveOpen && rect && (filtered.length > 0 || showAddOption);

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
    if (!effectiveOpen) return;

    function closeIfOutside(e) {
      if (
        !containerRef.current?.contains(e.target) &&
        !dropdownRef.current?.contains(e.target)
      ) setOpen(false);
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
  }, [effectiveOpen]);

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
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
        placeholder={placeholder}
        maxLength={maxLength}
        className="rounded-2xl"
        style={style}
      />

      {showDropdown && createPortal(
        (() => {
          const spaceBelow = window.innerHeight - rect.bottom - 4;
          const spaceAbove = rect.top - 4;
          const openUpward = spaceBelow < 160 && spaceAbove > spaceBelow;
          const maxHeight = Math.min(openUpward ? spaceAbove : spaceBelow, 240);
          return (
            <div
              ref={dropdownRef}
              style={{
                position: "fixed",
                ...(openUpward
                  ? { bottom: window.innerHeight - rect.top + 4 }
                  : { top: rect.bottom + 4 }),
                left: rect.left,
                width: rect.width,
                zIndex: 9999,
                borderRadius: "0.75rem",
                border: `1px solid ${PALETTE.inputBorder}`,
                backgroundColor: PALETTE.card,
                boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                overflow: "hidden",
                overflowY: "auto",
                maxHeight,
                pointerEvents: "auto",
              }}
            >
              {filtered.map((tag, i) => {
                const selected = value.toLowerCase() === tag.toLowerCase();
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
            </div>
          );
        })(),
        document.body,
      )}
    </div>
  );
}
