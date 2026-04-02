import type {PatternBox, PatternState, Rotation} from "./types";
import type { PalletEditorModel, WebBox } from "./services/pallet-editor.services";


export function fromPlcPattern(model: PalletEditorModel): PatternState {
    const selectedBoxId = model.selectedBox > 0 ? model.selectedBox : null;

    const boxes: PatternBox[] = model.boxes.map((b) => {
        const rotation: Rotation = b.rot === 90 ? 90 : 0;

        return {
            id: b.id,
            l: model.boxLength_mm,
            w: model.boxWidth_mm,
            x: b.x_mm,
            y: b.y_mm,
            rot: rotation,
            seq: b.seq,
            flags: b.flags,
            selected: b.id === selectedBoxId,
        };
    });

    return {
        patternName: model.name || `Pattern ${model.selectedPattern}`,

        recipeId: model.recipeId,
        patternIndex: model.selectedPattern,

        palletLength: model.palletLength_mm,
        palletWidth: model.palletWidth_mm,
        palletHeight: model.palletHeight_mm,


        boxLength: model.boxLength_mm,
        boxWidth: model.boxWidth_mm,
        boxHeight: model.boxHeight_mm,

        patternCount: model.patternCount,
        layers: model.totalLayers,

        boxes,
        selectedIds:model.selectedBox ? [model.selectedBox] : [],
        selectedBoxId,


        mirrorX: model.mirrorX,
        mirrorY: model.mirrorY,
        layerOffsetX_mm: model.layerOffsetX_mm,
        layerOffsetY_mm: model.layerOffsetY_mm,

        dirty: false,
        syncState: "loaded",
        statusText: "Loaded from PLC",
        lastError: null,
        connected: true,
        saving: false,
        message: "Loaded from PLC",
        connectionStatus: "connected",
        operationStatus: "idle",
        operationMessage: "",
    };
}

export function toPlcPattern(state: PatternState): PalletEditorModel {
    const boxes: WebBox[] = state.boxes.map((b, index) => ({
        id: b.id,
        x_mm: Math.round(b.x),
        y_mm: Math.round(b.y),
        seq: b.seq ?? (index + 1),
        rot: b.rot,
        flags: b.flags ?? 0,
    }));

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
        valid: false,

        boxCount: boxes.length,
        selectedPattern: state.patternIndex,
        selectedBox: state.selectedBoxId ?? 0,
        mirrorX: state.mirrorX ?? false,
        mirrorY: state.mirrorY ?? false,
        layerOffsetX_mm: state.layerOffsetX_mm ?? 0,
        layerOffsetY_mm: state.layerOffsetY_mm ?? 0,

        boxes,
    };
}