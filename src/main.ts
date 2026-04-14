import "./style.css";

import {
    silentLoginAtStartup,
    startPeriodicLogin
} from "./services/auth.services";
import {
    readBoxes,
    readEditorHeader,
    triggerSave,
    readEditorSnapshot,
    applyEditorSnapshot,
    readHmiLanguageCode,
} from "./services/pallet-editor.services";
import { setLang, mapPlcLangCode } from "./i18n";

import { EditorStore } from "./store";
import { EditorRenderer } from "./renderer";
import { EditorInteractions } from "./interactions";
import { fromPlcPattern, toPlcPattern } from "./plc-mapper";

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
        recipeId: state.recipeId,
        name: state.patternName,
        palletLength_mm: state.palletLength,
        palletWidth_mm: state.palletWidth,
        palletHeight_mm: state.palletHeight,
        boxLength_mm: state.boxLength,
        boxWidth_mm: state.boxWidth,
        boxHeight_mm: state.boxHeight,
        patternCount: state.patternCount,
        totalLayers: state.layers,
        valid: true,

        boxCount: state.boxes.length,
        selectedPattern: state.patternIndex,
        selectedLayer: state.selectedLayer,
        selectedBox: state.selectedBoxId ?? 0,
        mirrorX: state.mirrorX,
        mirrorY: state.mirrorY,
        layerOffsetX_mm: state.layerOffsetX_mm,
        layerOffsetY_mm: state.layerOffsetY_mm,

        boxes: state.boxes.map((b, index) => ({
            id: Number(b.id),
            x_mm: Math.round(b.x),
            y_mm: Math.round(b.y),
            seq: b.seq || index + 1,
            rot: Number(b.rot ?? 0),
            flags: b.flags ?? 0
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
    const selectModeBtn = app.querySelector<HTMLButtonElement>("#selectModeBtn");

    async function loadEditor(store: EditorStore) {
        try {
            store.setLoading();
            const plcModel = await readEditorSnapshot();
            const state = fromPlcPattern(plcModel);
            store.loadSnapshot(state);
        } catch (error) {
            store.setError(`Load failed: ${String(error)}`);
        }
    }

    async function applyEditor(store: EditorStore) {
        try {
            store.setApplying?.();
            const plcModel = toPlcPattern(store.getState());
            await applyEditorSnapshot(plcModel);
            store.setApplied();
        } catch (error) {
            store.setError(`Apply failed: ${String(error)}`);
        }
    }

    async function saveEditor(store: EditorStore) {
        try {
            store.setApplying();
            const model = toPalletEditorModel(store.getState());
            await triggerSave(model);
            store.setSaved();
        } catch (error) {
            store.setError(`Save failed: ${String(error)}`);
        }
    }

    document.getElementById("btnAlignH")?.addEventListener("click", () => {
        store.alignBoxesHorizontally();
    });

    document.getElementById("btnAlignV")?.addEventListener("click", () => {
        store.alignBoxesVertically();
    });

    document.getElementById("btnApply")?.addEventListener("click", async () => {
        await applyEditor(store);
    });

    document.getElementById("btnSave")?.addEventListener("click", async () => {
        await saveEditor(store);
    });

    document.getElementById("btnReload")?.addEventListener("click", async () => {
        await loadEditor(store);
    });

    document.getElementById("btnRotate")?.addEventListener("click", () => {
        const id = store.getState().selectedIds[0];
        if (id != null) {
            store.rotateSelected();
        }
    });

    document.getElementById("btnDelete")?.addEventListener("click", () => {
        const id = store.getState().selectedIds[0];
        if (id != null) {
            store.deleteSelected();
        }
    });



    async function loadPattern(): Promise<void> {
        try {
            // Status message left empty — renderer translates via switch-case
            store.setOperationStatus("loading");

            const header = await readEditorHeader();
            console.log("HEADER", header);

            const palletLength = positiveOr(header.palletLength_mm, 1200);
            const palletWidth = positiveOr(header.palletWidth_mm, 1000);
            const palletHeight = positiveOr(header.palletHeight_mm, 0);

            const boxLength = positiveOr(header.boxLength_mm, 200);
            const boxWidth = positiveOr(header.boxWidth_mm, 150);
            const boxHeight = positiveOr(header.boxHeight_mm, 100);

            const boxCount = positiveOr(header.boxCount, 0);
            const webBoxes = boxCount > 0 ? await readBoxes(boxCount) : [];
            console.log("BOXES", webBoxes);

            store.patch({
                // Editing context — required for the context strip display
                recipeId:     Number(header.recipeId ?? 0),
                patternIndex: Number(header.selectedPattern ?? 1),
                selectedLayer: Number(header.selectedLayer ?? 1),

                patternName: header.name && header.name.trim() ? header.name : "Pattern",
                palletLength,
                palletWidth,
                palletHeight,

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
                        x_mm: b.x_mm,
                        y_mm: b.y_mm,
                        seq: b.seq,
                        flags: b.flags,
                        rot: rotated ? 90 : 0,
                        l: rotated ? boxWidth : boxLength,
                        w: rotated ? boxLength : boxWidth
                    };
                }),
                selectedIds: [],
                selectedBoxId: null,
                dirty: false
            });

            // Empty message — renderer shows translated key for load-success
            store.setOperationStatus("load-success");

            window.setTimeout(() => {
                store.clearOperationStatus();
            }, 2000);
        } catch (error) {
            console.error(error);
            store.setOperationStatus("load-error", getErrorMessage(error));
        }
    }

    selectModeBtn?.addEventListener("click", () => {
        store.toggleSelectionMode();
    });

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
                // Empty message — renderer shows translated key for saving/save-success
                store.setOperationStatus("saving");

                const model = toPalletEditorModel(store.getState());
                console.log("SAVE MODEL", model);

                // Saves into DB_WebPalletEditor (staging editor DB).
                // Final persistence to recipe library is handled by UCP/PLC flow.
                await triggerSave(model);

                store.patch({ dirty: false });
                store.setOperationStatus("save-success");

                window.setTimeout(() => {
                    store.clearOperationStatus();
                }, 2000);
            } catch (error) {
                console.error(error);
                store.setOperationStatus("save-error", getErrorMessage(error));
            }
        })();
    });


    /**
     * Reads the WinCC Unified language code from the PLC and updates the UI.
     * Silently ignored on error — the UI stays in its current language.
     */
    async function pollHmiLanguage(): Promise<void> {
        try {
            const code = await readHmiLanguageCode();
            const lang = mapPlcLangCode(code);
            setLang(lang);
            store.setLanguage(lang);
        } catch {
            // non-fatal: keep current language
        }
    }

    const teardown = () => {
        interactions.destroy();
        unsubscribe?.();
    };

    window.addEventListener("beforeunload", teardown, { once: true });

    try {
        store.setConnectionStatus("connecting");
        store.setOperationStatus("loading", "Connecting to PLC...");

        const authMode = await silentLoginAtStartup(DEFAULT_PLC_IP);

        if (authMode === 'authenticated') {
            // AC enabled and login succeeded — use token for all requests.
            store.setConnectionStatus("connected");
            startPeriodicLogin(DEFAULT_PLC_IP);
        } else {
            // AC disabled or login failed — proceed without a token.
            // PLC ops will use an empty token; the PLC accepts this when AC is off.
            // If AC is on and login genuinely failed, individual ops will surface
            // permission-denied errors without crashing the app.
            store.setConnectionStatus("anonymous");
        }

        // Sync language from HMI immediately, then every 5 s
        await pollHmiLanguage();
        window.setInterval(() => { void pollHmiLanguage(); }, 5000);

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
