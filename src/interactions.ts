import { EditorStore } from "./store";

export class EditorInteractions {
    private draggingId: number | null = null;
    private activePointerId: number | null = null;
    private lastPoint: { x: number; y: number } | null = null;

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
    }

    private onPointerDown = (event: PointerEvent): void => {
        const target = event.target as Element;
        const group = target.closest("[data-box-id]") as SVGGElement | null;

        if (!group) {
            this.store.clearSelection();
            this.resetDrag();
            return;
        }

        const id = Number(group.dataset.boxId);
        if (Number.isNaN(id)) {
            this.resetDrag();
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
        if (
            this.draggingId === null ||
            this.activePointerId !== event.pointerId ||
            !this.lastPoint
        ) {
            return;
        }

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
        if (this.activePointerId !== event.pointerId) {
            return;
        }

        try {
            if (this.svg.hasPointerCapture(event.pointerId)) {
                this.svg.releasePointerCapture(event.pointerId);
            }
        } catch {
            /* no-op */
        }

        this.resetDrag();
    };

    private resetDrag(): void {
        this.draggingId = null;
        this.activePointerId = null;
        this.lastPoint = null;
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
