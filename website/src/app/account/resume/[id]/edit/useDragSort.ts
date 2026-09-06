"use client";

import { useState, type DragEvent } from "react";

/**
 * Minimal native HTML5 drag-to-reorder — no library. Returns per-row props to
 * spread onto the draggable element plus the current drag/hover ids so the
 * caller can style the placeholder. Reordering itself is delegated to
 * `onReorder(fromId, toId)` (see content.ts `reorderBlocks`).
 */
export function useDragSort(onReorder: (fromId: string, toId: string) => void) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  function rowProps(id: string) {
    return {
      draggable: true,
      onDragStart: (e: DragEvent) => {
        setDraggingId(id);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", id);
      },
      onDragEnter: () => setOverId(id),
      onDragOver: (e: DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      },
      onDrop: (e: DragEvent) => {
        e.preventDefault();
        const from = draggingId ?? e.dataTransfer.getData("text/plain");
        if (from && from !== id) onReorder(from, id);
        setDraggingId(null);
        setOverId(null);
      },
      onDragEnd: () => {
        setDraggingId(null);
        setOverId(null);
      },
    };
  }

  return { rowProps, draggingId, overId };
}
