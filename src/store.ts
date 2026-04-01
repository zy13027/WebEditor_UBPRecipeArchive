import type { PatternBox, PatternState } from "./types";

type Listener = (state: PatternState) => void;

const initialState: PatternState = {
    patternName: 'Pattern',
    palletLength: 0,
    palletWidth: 0,
    palletHeight: 0,
    boxLength: 0,
    boxWidth: 0,
    boxHeight: 0,
    patternCount: 0,
    layers: 0,
    boxes: [],
    selectedIds: [],
    selectedBoxId: null,
    dirty: false,
    connected: false,
    saving: false,
    message: 'Connecting...',
    connectionStatus: 'connecting',
    operationStatus: 'idle',
    operationMessage: '',
};

export class EditorStore {
    private state: PatternState = structuredClone(initialState);
    private listeners: Listener[] = [];

    private emit(): void {
        for (const listener of this.listeners) {
            listener(this.state);
        }
    }

    getState(): PatternState {
        return this.state;
    }

    subscribe(listener: Listener): () => void {
        this.listeners.push(listener);
        listener(this.state);
        return () => {
            this.listeners = this.listeners.filter((l) => l !== listener);
        };
    }

    setState(next: PatternState): void {
        this.state = next;
        this.emit();
    }

    setConnectionStatus(status: PatternState['connectionStatus']) {
        this.state = {
            ...this.state,
            connectionStatus: status,
            connected: status === 'connected',
        };
        this.emit();
    }

    setOperationStatus(
        status: PatternState["operationStatus"],
        message = ""
    ): void {
        this.state = {
            ...this.state,
            operationStatus: status,
            operationMessage: message,
            saving: status === "saving",
            message:
                message ||
                (status === "loading"
                    ? "Loading..."
                    : status === "load-success"
                        ? "Load successful"
                        : status === "load-error"
                            ? "Load failed"
                            : status === "saving"
                                ? "Saving..."
                                : status === "save-success"
                                    ? "Save successful"
                                    : status === "save-error"
                                        ? "Save failed"
                                        : this.state.message),
        };
        this.emit();
    }


    clearOperationStatus() {
        this.state = {
            ...this.state,
            operationStatus: 'idle',
            operationMessage: '',
            saving: false,
        };
        this.emit();
    }


    patch(partial: Partial<PatternState>): void {
        this.state = { ...this.state, ...partial };
        this.emit();
    }

    updateBoxes(updater: (boxes: PatternBox[]) => PatternBox[]): void {
        this.state = {
            ...this.state,
            boxes: updater(this.state.boxes),
            dirty: true
        };
        this.emit();
    }

    selectSingle(id: number | null): void {
        this.state = {
            ...this.state,
            selectedIds: id === null ? [] : [id],
            selectedBoxId: id
        };
        this.emit();
    }

    toggleSelect(id: number): void {
        const exists = this.state.selectedIds.includes(id);
        this.state = {
            ...this.state,
            selectedIds: exists
                ? this.state.selectedIds.filter((x) => x !== id)
                : [...this.state.selectedIds, id],
            selectedBoxId: exists
                ? this.state.selectedBoxId === id
                    ? null
                    : this.state.selectedBoxId
                : id
        };
        this.emit();
    }

    clearSelection(): void {
        this.state = {
            ...this.state,
            selectedIds: [],
            selectedBoxId: null
        };
        this.emit();
    }

    addBox(): void {
        const nextId = this.state.boxes.length
            ? Math.max(...this.state.boxes.map((b) => b.id)) + 1
            : 1;

        const boxLength = this.state.boxLength > 0 ? this.state.boxLength : 200;
        const boxWidth = this.state.boxWidth > 0 ? this.state.boxWidth : 150;

        const box: PatternBox = {
            id: nextId,
            x: 60,
            y: 60,
            w: boxLength,
            h: boxWidth,
            r: 0
        };

        this.state = {
            ...this.state,
            boxes: [...this.state.boxes, box],
            selectedIds: [nextId],
            selectedBoxId: nextId,
            dirty: true,
            message: `Box ${nextId} added`
        };
        this.emit();
    }



    deleteSelected(): void {
        if (!this.state.selectedIds.length) {
            this.state = {
                ...this.state,
                message: "No box selected"
            };
            this.emit();
            return;
        }

        const selected = new Set(this.state.selectedIds);

        this.state = {
            ...this.state,
            boxes: this.state.boxes.filter((b) => !selected.has(b.id)),
            selectedIds: [],
            selectedBoxId: null,
            dirty: true,
            message: "Selected box(es) deleted"
        };
        this.emit();
    }

    rotateSelected(): void {
        if (!this.state.selectedIds.length) {
            this.state = {
                ...this.state,
                message: "No box selected"
            };
            this.emit();
            return;
        }

        const selected = new Set(this.state.selectedIds);

        this.state = {
            ...this.state,
            boxes: this.state.boxes.map((b) => {
                if (!selected.has(b.id)) return b;

                const nextR = b.r === 0 ? 90 : 0;

                return {
                    ...b,
                    r: nextR,
                    w: b.h,
                    h: b.w
                };
            }),
            dirty: true,
            message: "Selected box(es) rotated"
        };
        this.emit();
    }



    moveSelected(dx: number, dy: number): void {
        const selected = new Set(this.state.selectedIds);
        this.state = {
            ...this.state,
            boxes: this.state.boxes.map((b) =>
                selected.has(b.id)
                    ? {
                        ...b,
                        x: b.x + dx,
                        y: b.y + dy
                    }
                    : b
            ),
            dirty: true
        };
        this.emit();
    }

    alignLeft(): void {
        const selectedBoxes = this.state.boxes.filter((b) =>
            this.state.selectedIds.includes(b.id)
        );
        if (!selectedBoxes.length) return;

        const minX = Math.min(...selectedBoxes.map((b) => b.x));
        const selected = new Set(this.state.selectedIds);

        this.state = {
            ...this.state,
            boxes: this.state.boxes.map((b) =>
                selected.has(b.id) ? { ...b, x: minX } : b
            ),
            dirty: true
        };
        this.emit();
    }

    alignTop(): void {
        const selectedBoxes = this.state.boxes.filter((b) =>
            this.state.selectedIds.includes(b.id)
        );
        if (!selectedBoxes.length) return;

        const minY = Math.min(...selectedBoxes.map((b) => b.y));
        const selected = new Set(this.state.selectedIds);

        this.state = {
            ...this.state,
            boxes: this.state.boxes.map((b) =>
                selected.has(b.id) ? { ...b, y: minY } : b
            ),
            dirty: true
        };
        this.emit();
    }

    setMessage(message: string): void {
        this.state = { ...this.state, message };
        this.emit();
    }

    markSaved(message = "Saved"): void {
        this.state = {
            ...this.state,
            dirty: false,
            saving: false,
            message
        };
        this.emit();
    }

    setSaving(saving: boolean, message = "Saving..."): void {
        this.state = {
            ...this.state,
            saving,
            message
        };
        this.emit();
    }
}
