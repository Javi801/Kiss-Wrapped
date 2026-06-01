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
  const [placement, setPlacement] = useState(null);
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);

  const trimmed = value.trim();
  const filtered = tags.filter(
    (tag) => !trimmed || tag.toLowerCase().includes(trimmed.toLowerCase()),
  );
  const showAddOption =
    trimmed && onAddTag && !tags.some((t) => t.toLowerCase() === trimmed.toLowerCase());
  const effectiveOpen = isParentOpen === false ? false : open;
  const showDropdown = effectiveOpen && rect && (filtered.length > 0 || showAddOption);

  function getViewportMetrics() {
    const visualViewport = window.visualViewport;
    return {
      offsetTop: visualViewport?.offsetTop ?? 0,
      offsetLeft: visualViewport?.offsetLeft ?? 0,
      height: visualViewport?.height ?? window.innerHeight,
    };
  }

  function getPlacement(nextRect) {
    const { offsetTop, height: vph } = getViewportMetrics();
    const anchorTop = nextRect.top - offsetTop;
    const anchorBottom = nextRect.bottom - offsetTop;
    const spaceBelow = vph - anchorBottom - 4;
    const spaceAbove = anchorTop - 4;
    return spaceBelow < 160 && spaceAbove > spaceBelow ? "up" : "down";
  }

  function measure({ updatePlacement = false } = {}) {
    if (!containerRef.current) return;
    const nextRect = containerRef.current.getBoundingClientRect();
    setRect(nextRect);
    if (updatePlacement) setPlacement(getPlacement(nextRect));
  }

  function handleFocus() {
    measure({ updatePlacement: true });
    setOpen(true);
  }

  function handleChange(e) {
    onChange(e.target.value);
    measure({ updatePlacement: true });
    setOpen(true);
  }

  useEffect(() => {
    if (!effectiveOpen) return;

    function closeIfOutside(e) {
      if (
        !containerRef.current?.contains(e.target) &&
        !dropdownRef.current?.contains(e.target)
      ) {
        setPlacement(null);
        setOpen(false);
      }
    }

    function reposition() {
      if (!containerRef.current) return;
      requestAnimationFrame(() => {
        if (!containerRef.current) return;
        const newRect = containerRef.current.getBoundingClientRect();
        const vph = window.visualViewport?.height ?? window.innerHeight;
        if (newRect.bottom < 0 || newRect.top > vph) {
          setOpen(false);
        } else {
          setRect(newRect);
        }
      });
    }

    document.addEventListener("mousedown", closeIfOutside);
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    window.visualViewport?.addEventListener("resize", reposition);
    window.visualViewport?.addEventListener("scroll", reposition);
    return () => {
      document.removeEventListener("mousedown", closeIfOutside);
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
      window.visualViewport?.removeEventListener("resize", reposition);
      window.visualViewport?.removeEventListener("scroll", reposition);
    };
  }, [effectiveOpen]);

  function selectTag(tag) {
    onChange(tag);
    setPlacement(null);
    setOpen(false);
  }

  function handleAddTag() {
    if (!trimmed) return;
    onAddTag?.(trimmed);
    onChange(trimmed);
    setPlacement(null);
    setOpen(false);
  }

  return (
    <div ref={containerRef}>
      <Input
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={() => {
          setPlacement(null);
          setOpen(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setPlacement(null);
            setOpen(false);
          }
        }}
        placeholder={placeholder}
        maxLength={maxLength}
        className="rounded-2xl"
        style={style}
      />

      {showDropdown && createPortal(
        (() => {
          const { height: vph } = getViewportMetrics();
          const { offsetTop, offsetLeft } = getViewportMetrics();
          const anchorTop = rect.top - offsetTop;
          const anchorBottom = rect.bottom - offsetTop;
          const spaceBelow = vph - anchorBottom - 4;
          const spaceAbove = anchorTop - 4;
          const openUpward = placement ?? (spaceBelow < 160 && spaceAbove > spaceBelow ? "up" : "down");
          const maxHeight = Math.min(openUpward === "up" ? spaceAbove : spaceBelow, 240);
          const dropdownTop = openUpward === "up" ? anchorTop - 4 : anchorBottom + 4;
          return (
            <div
              ref={dropdownRef}
              style={{
                position: "fixed",
                top: dropdownTop,
                left: rect.left - offsetLeft,
                width: rect.width,
                zIndex: 9999,
                transform: openUpward === "up" ? "translateY(-100%)" : "none",
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
                    onPointerDown={(e) => { e.preventDefault(); selectTag(tag); }}
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
                  onPointerDown={(e) => { e.preventDefault(); handleAddTag(); }}
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
