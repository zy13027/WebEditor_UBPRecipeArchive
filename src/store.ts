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

    language: 'zh-CN',
    selectionMode: false,
    dirty: false,
    syncState: 'idle',
    statusText: 'Idle',
    lastError: null,

    connected: false,
    saving: false,
    message: 'Idle',
    connectionStatus: 'connecting',
    operationStatus: 'idle',
    operationMessage: '',

    recipeId: 0,
    patternIndex: 1,
    selectedLayer: 1,
    mirrorX: false,
    mirrorY: false,
    layerOffsetX_mm: 0,
    layerOffsetY_mm: 0,
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
            // Both 'connected' (authenticated) and 'anonymous' (AC disabled)
            // mean the PLC is reachable and operations can proceed.
            connected: status === 'connected' || status === 'anonymous',
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

    setLanguage(lang: 'en' | 'zh-CN'): void {
        if (this.state.language === lang) return;
        this.state = { ...this.state, language: lang };
        this.emit();
    }

    toggleSelectionMode(): void {
        const entering = !this.state.selectionMode;
        this.state = {
            ...this.state,
            selectionMode: entering,
            // clear selection when exiting
            selectedIds: entering ? this.state.selectedIds : [],
            selectedBoxId: entering ? this.state.selectedBoxId : null
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
            seq: 0,
            id: nextId,
            x: 60,
            y: 60,
            l: boxLength,
            w: boxWidth,
            rot: 0
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

                const nextR = b.rot === 0 ? 90 : 0;

                return {
                    ...b,
                    rot: nextR,
                    l: b.w,
                    w: b.l
                };
            }),
            dirty: true,
            message: "Selected box(es) rotated"
        };
        this.emit();
    }

    alignBoxesHorizontally(): void {
        const anchorId = this.state.selectedBoxId;
        const selectedIds = this.state.selectedIds.length
            ? new Set(this.state.selectedIds)
            : anchorId !== null
                ? new Set([anchorId])
                : new Set<number>();
        if (!selectedIds.size) return;

        const anchor = anchorId !== null
            ? this.state.boxes.find((b) => b.id === anchorId && selectedIds.has(b.id))
            : this.state.boxes.find((b) => selectedIds.has(b.id));
        if (!anchor) return;

        const boxes = this.state.boxes.map((box) => {
            if (!selectedIds.has(box.id) || box.y === anchor.y) {
                return box;
            }

            return {
                ...box,
                y: anchor.y,
            };
        });

        const changed = boxes.some((box, index) => box !== this.state.boxes[index]);
        if (!changed) return;

        this.state = {
            ...this.state,
            boxes,
            dirty: true,
            syncState: 'dirty',
            statusText: 'Selected boxes aligned horizontally (local)',
            message: 'Selected boxes aligned horizontally'
        };
        this.emit();
    }

    alignBoxesVertically(): void {
        const anchorId = this.state.selectedBoxId;
        const selectedIds = this.state.selectedIds.length
            ? new Set(this.state.selectedIds)
            : anchorId !== null
                ? new Set([anchorId])
                : new Set<number>();
        if (!selectedIds.size) return;

        const anchor = anchorId !== null
            ? this.state.boxes.find((b) => b.id === anchorId && selectedIds.has(b.id))
            : this.state.boxes.find((b) => selectedIds.has(b.id));
        if (!anchor) return;

        const boxes = this.state.boxes.map((box) => {
            if (!selectedIds.has(box.id) || box.x === anchor.x) {
                return box;
            }

            return {
                ...box,
                x: anchor.x,
            };
        });

        const changed = boxes.some((box, index) => box !== this.state.boxes[index]);
        if (!changed) return;

        this.state = {
            ...this.state,
            boxes,
            dirty: true,
            syncState: 'dirty',
            statusText: 'Selected boxes aligned vertically (local)',
            message: 'Selected boxes aligned vertically'
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
                        y: b.y + dy,
                        x_mm: b.x + dx,
                        y_mm: b.y + dy
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
                selected.has(b.id) ? { ...b, x: minX, x_mm: minX } : b
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
                selected.has(b.id) ? { ...b, y: minY, y_mm: minY } : b
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

    setLoading(): void {
        this.patch({
            saving: false,
            operationStatus: 'loading',
            operationMessage: '', // renderer translates via t('msg.loading')
        });
    }

    loadSnapshot(snapshot: PatternState): void {
        this.state = {
            ...snapshot,
            // Preserve runtime state — the snapshot carries pattern data only.
            // connectionStatus and language are managed by the startup/polling flow
            // and must not be overwritten when pattern data is (re-)loaded.
            connectionStatus: this.state.connectionStatus,
            connected: this.state.connected,
            language: this.state.language,
            selectionMode: false,
            saving: false,
            dirty: false,
            operationStatus: 'load-success',
            operationMessage: '',
        };
        this.emit();
    }

    setApplying(): void {
        this.patch({
            saving: true,
            operationStatus: 'saving',
            operationMessage: '', // renderer translates via t('msg.saving')
        });
    }

    setApplied(): void {
        this.patch({
            saving: false,
            operationStatus: 'save-success',
            operationMessage: '', // renderer translates via t('msg.saveSuccess')
        });
    }

    setSaved(): void {
        this.patch({
            saving: false,
            dirty: false,
            operationStatus: 'save-success',
            operationMessage: '', // renderer translates via t('msg.saveSuccess')
        });
    }

    setError(message: string): void {
        this.patch({
            saving: false,
            operationStatus: 'save-error',
            operationMessage: message, // explicit error text, not translated (contains detail)
        });
    }





}
