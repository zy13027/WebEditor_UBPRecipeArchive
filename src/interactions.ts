import { EditorStore } from "./store";

const SVG_NS = "http://www.w3.org/2000/svg";

export class EditorInteractions {
    private draggingId: number | null = null;
    private activePointerId: number | null = null;
    private lastPoint: { x: number; y: number } | null = null;

    private rubberBanding = false;
    private rubberStart: { x: number; y: number } | null = null;
    private rubberRect: SVGRectElement | null = null;

    constructor(
        private readonly svg: SVGSVGElement,
        private readonly store: EditorStore
    ) {}

    bind(): void {
        this.svg.addEventListener("pointerdown", this.onPointerDown);
        this.svg.addEventListener("pointermove", this.onPointerMove);
        this.svg.addEventListener("pointerup", this.onPointerUp);
        this.svg.addEventListener("pointercancel", this.onPointerUp);
    }

    destroy(): void {
        this.svg.removeEventListener("pointerdown", this.onPointerDown);
        this.svg.removeEventListener("pointermove", this.onPointerMove);
        this.svg.removeEventListener("pointerup", this.onPointerUp);
        this.svg.removeEventListener("pointercancel", this.onPointerUp);
        this.resetDrag();
        this.resetRubber();
    }

    private onPointerDown = (event: PointerEvent): void => {
        const target = event.target as Element;
        const group = target.closest("[data-box-id]") as SVGGElement | null;
        const inSelectionMode = this.store.getState().selectionMode;

        if (!group) {
            if (inSelectionMode) {
                // In selection mode, tapping empty canvas does nothing (keeps selection)
                event.preventDefault();
                return;
            }

            // Normal mode: start rubber-band selection on empty canvas
            if (!event.shiftKey) {
                this.store.clearSelection();
            }
            this.rubberBanding = true;
            this.rubberStart = this.getSvgPoint(event);
            this.activePointerId = event.pointerId;

            this.rubberRect = document.createElementNS(SVG_NS, "rect");
            this.rubberRect.setAttribute("class", "rubber-band");
            this.svg.appendChild(this.rubberRect);

            try {
                this.svg.setPointerCapture(event.pointerId);
            } catch {
                /* no-op */
            }

            event.preventDefault();
            return;
        }

        const id = Number(group.dataset.boxId);
        if (Number.isNaN(id)) {
            this.resetDrag();
            return;
        }

        if (inSelectionMode) {
            // In selection mode: every tap toggles the box, no dragging
            this.store.toggleSelect(id);
            event.preventDefault();
            return;
        }

        if (event.shiftKey) {
            this.store.toggleSelect(id);
        } else {
            this.store.selectSingle(id);
        }

        this.draggingId = id;
        this.activePointerId = event.pointerId;
        this.lastPoint = this.getSvgPoint(event);

        try {
            this.svg.setPointerCapture(event.pointerId);
        } catch {
            /* no-op */
        }

        event.preventDefault();
    };

    private onPointerMove = (event: PointerEvent): void => {
        if (this.activePointerId !== event.pointerId) return;

        // Rubber-band resize
        if (this.rubberBanding && this.rubberStart && this.rubberRect) {
            const cur = this.getSvgPoint(event);
            const x = Math.min(this.rubberStart.x, cur.x);
            const y = Math.min(this.rubberStart.y, cur.y);
            const w = Math.abs(cur.x - this.rubberStart.x);
            const h = Math.abs(cur.y - this.rubberStart.y);
            this.rubberRect.setAttribute("x", String(x));
            this.rubberRect.setAttribute("y", String(y));
            this.rubberRect.setAttribute("width", String(w));
            this.rubberRect.setAttribute("height", String(h));
            event.preventDefault();
            return;
        }

        // Box drag
        if (this.draggingId === null || !this.lastPoint) return;

        const current = this.getSvgPoint(event);
        const dxSvg = current.x - this.lastPoint.x;
        const dySvg = current.y - this.lastPoint.y;

        const scale = Number(this.svg.dataset.scale || "1");
        const dx = dxSvg / scale;
        const dy = dySvg / scale;

        if (dx !== 0 || dy !== 0) {
            this.store.moveSelected(dx, dy);
            this.lastPoint = current;
        }

        event.preventDefault();
    };

    private onPointerUp = (event: PointerEvent): void => {
        if (this.activePointerId !== event.pointerId) return;

        try {
            if (this.svg.hasPointerCapture(event.pointerId)) {
                this.svg.releasePointerCapture(event.pointerId);
            }
        } catch {
            /* no-op */
        }

        if (this.rubberBanding && this.rubberStart) {
            const end = this.getSvgPoint(event);
            this.selectBoxesInRect(this.rubberStart, end);
            this.resetRubber();
            this.activePointerId = null;
            return;
        }

        this.resetDrag();
    };

    private selectBoxesInRect(
        start: { x: number; y: number },
        end: { x: number; y: number }
    ): void {
        const scale = Number(this.svg.dataset.scale || "1");
        const offsetX = Number(this.svg.dataset.offsetX || "0");
        const offsetY = Number(this.svg.dataset.offsetY || "0");

        const minX = Math.min(start.x, end.x);
        const maxX = Math.max(start.x, end.x);
        const minY = Math.min(start.y, end.y);
        const maxY = Math.max(start.y, end.y);

        // Ignore tiny clicks (treat as deselect, already handled)
        if (maxX - minX < 4 && maxY - minY < 4) return;

        const boxes = this.store.getState().boxes;
        const ids: number[] = [];

        for (const box of boxes) {
            const bx = offsetX + box.x * scale;
            const by = offsetY + box.y * scale;
            const bw = Math.max(box.w * scale, 8);
            const bl = Math.max(box.l * scale, 8);

            // Overlap check
            if (bx < maxX && bx + bw > minX && by < maxY && by + bl > minY) {
                ids.push(box.id);
            }
        }

        if (ids.length > 0) {
            this.store.patch({
                selectedIds: ids,
                selectedBoxId: ids[0]
            });
        }
    }

    private resetDrag(): void {
        this.draggingId = null;
        this.activePointerId = null;
        this.lastPoint = null;
    }

    private resetRubber(): void {
        this.rubberRect?.remove();
        this.rubberRect = null;
        this.rubberBanding = false;
        this.rubberStart = null;
    }

    private getSvgPoint(event: PointerEvent): { x: number; y: number } {
        const point = this.svg.createSVGPoint();
        point.x = event.clientX;
        point.y = event.clientY;

        const ctm = this.svg.getScreenCTM();
        if (!ctm) {
            return { x: 0, y: 0 };
        }

        const transformed = point.matrixTransform(ctm.inverse());
        return {
            x: transformed.x,
            y: transformed.y
        };
    }
}
