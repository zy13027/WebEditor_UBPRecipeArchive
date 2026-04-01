import "./style.css";

import {
    silentLoginAtStartup,
    startPeriodicLogin
} from "./services/auth.services";
import {
    readBoxes,
    readEditorHeader,
    triggerSave
} from "./services/pallet-editor.services";

import { EditorStore } from "./store";
import { EditorRenderer } from "./renderer";
import { EditorInteractions } from "./interactions";

const DEFAULT_PLC_IP = "192.168.0.10";

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}

function positiveOr(value: number | undefined, fallback: number): number {
    return typeof value === "number" && value > 0 ? value : fallback;
}

function toPalletEditorModel(state: ReturnType<EditorStore["getState"]>) {
    return {
        recipeId: 0,
        name: state.patternName,
        palletLength_mm: state.palletLength,
        palletWidth_mm: state.palletWidth,
        boxLength_mm: state.boxLength,
        boxWidth_mm: state.boxWidth,
        boxHeight_mm: state.boxHeight,
        patternCount: state.patternCount,
        totalLayers: state.layers,
        valid: true,

        boxCount: state.boxes.length,
        selectedPattern: 0,
        selectedBox: state.selectedBoxId ?? 0,
        mirrorX: false,
        mirrorY: false,
        layerOffsetX_mm: 0,
        layerOffsetY_mm: 0,

        boxes: state.boxes.map((b, index) => ({
            id: Number(b.id),
            x_mm: Math.round(b.x),
            y_mm: Math.round(b.y),
            seq: index + 1,
            rot: Number(b.r ?? 0),
            flags: 0
        }))
    };
}



async function bootstrap(): Promise<void> {
    const app = document.querySelector<HTMLDivElement>("#app");
    if (!app) {
        throw new Error('Missing app root element: "#app"');
    }

    const store = new EditorStore();
    const renderer = new EditorRenderer(app);
    const interactions = new EditorInteractions(renderer.getSvg(), store);

    const unsubscribe = store.subscribe((state) => {
        renderer.render(state);
        console.log("STATE BOXES", state.boxes);
    });

    renderer.render(store.getState());
    interactions.bind();

    const loadBtn = app.querySelector<HTMLButtonElement>("#loadBtn");
    const saveBtn = app.querySelector<HTMLButtonElement>("#saveBtn");
    const addBoxBtn = app.querySelector<HTMLButtonElement>("#addBoxBtn");
    const rotateBoxBtn = app.querySelector<HTMLButtonElement>("#rotateBoxBtn");
    const deleteBoxBtn = app.querySelector<HTMLButtonElement>("#deleteBoxBtn");

    async function loadPattern(): Promise<void> {
        try {
            store.setOperationStatus("loading", "Loading pattern...");

            const header = await readEditorHeader();
            console.log("HEADER", header);

            const palletLength = positiveOr(header.palletLength_mm, 1200);
            const palletWidth = positiveOr(header.palletWidth_mm, 1000);
            const boxLength = positiveOr(header.boxLength_mm, 200);
            const boxWidth = positiveOr(header.boxWidth_mm, 150);
            const boxHeight = positiveOr(header.boxHeight_mm, 100);

            const boxCount = positiveOr(header.boxCount, 0);
            const webBoxes = boxCount > 0 ? await readBoxes(boxCount) : [];
            console.log("BOXES", webBoxes);

            store.patch({
                patternName: header.name && header.name.trim() ? header.name : "Pattern",
                palletLength,
                palletWidth,
                boxLength,
                boxWidth,
                boxHeight,
                patternCount: header.patternCount ?? 0,
                layers: header.totalLayers ?? 0,
                boxes: webBoxes.map((b) => {
                    const rotated = b.rot === 90;
                    return {
                        id: b.id,
                        x: b.x_mm,
                        y: b.y_mm,
                        r: rotated ? 90 : 0,
                        w: rotated ? boxWidth : boxLength,
                        h: rotated ? boxLength : boxWidth
                    };
                }),
                selectedIds: [],
                selectedBoxId: null,
                dirty: false
            });

            store.setOperationStatus("load-success", "Pattern loaded");

            window.setTimeout(() => {
                store.clearOperationStatus();
            }, 2000);
        } catch (error) {
            console.error(error);
            store.setOperationStatus("load-error", getErrorMessage(error));
        }
    }

    loadBtn?.addEventListener("click", () => {
        void loadPattern();
    });

    addBoxBtn?.addEventListener("click", () => {
        store.addBox();
        console.log("ADD BOX CLICKED", store.getState().boxes);
        store.setOperationStatus("idle", "");
    });

    rotateBoxBtn?.addEventListener("click", () => {
        store.rotateSelected();
        store.setOperationStatus("idle", "");
    });

    deleteBoxBtn?.addEventListener("click", () => {
        store.deleteSelected();
        store.setOperationStatus("idle", "");
    });

    saveBtn?.addEventListener("click", () => {
        void (async () => {
            try {
                store.setOperationStatus("saving", "Saving pattern...");

                const model = toPalletEditorModel(store.getState());
                console.log("SAVE MODEL", model);

                await triggerSave(model);

                store.patch({ dirty: false });
                store.setOperationStatus("save-success", "Pattern saved");

                window.setTimeout(() => {
                    store.clearOperationStatus();
                }, 2000);
            } catch (error) {
                console.error(error);
                store.setOperationStatus("save-error", getErrorMessage(error));
            }
        })();
    });


    const teardown = () => {
        interactions.destroy();
        unsubscribe?.();
    };

    window.addEventListener("beforeunload", teardown, { once: true });

    try {
        store.setConnectionStatus("connecting");
        store.setOperationStatus("loading", "Connecting to PLC...");

        const ok = await silentLoginAtStartup(DEFAULT_PLC_IP);

        if (!ok) {
            store.setConnectionStatus("error");
            store.setOperationStatus("load-error", "Silent login failed");
            return;
        }

        store.setConnectionStatus("connected");
        startPeriodicLogin(DEFAULT_PLC_IP);

        await loadPattern();
    } catch (error) {
        console.error(error);
        store.setConnectionStatus("error");
        store.setOperationStatus("load-error", getErrorMessage(error));
    }
}

bootstrap().catch((error) => {
    console.error("Bootstrap failed:", error);

    const app = document.querySelector<HTMLDivElement>("#app");
    if (app) {
        app.innerHTML = `
      <div class="page">
        <div class="editor-shell">
          <section class="card">
            <div class="card-title">Application Error</div>
            <pre class="error-box">${getErrorMessage(error)}</pre>
          </section>
        </div>
      </div>
    `;
    }
});
