import type { PatternState, PlcPatternPayload } from "./types";

export function toPlcPattern(state: PatternState): PlcPatternPayload {
    return {
        patternName: state.patternName,
        palletWidth: state.palletWidth,
        palletHeight: state.palletHeight,
        boxWidth: state.boxWidth,
        boxHeight: state.boxHeight,
        boxCount: state.boxes.length,
        boxes: state.boxes.map((b) => ({
            id: b.id,
            x: Math.round(b.x),
            y: Math.round(b.y),
            r: b.r
        }))
    };
}

export function fromPlcPattern(payload: PlcPatternPayload): PatternState {
    return {
        patternName: payload.patternName,
        palletLength: payload.palletWidth,
        palletWidth: payload.palletWidth,
        palletHeight: payload.palletHeight,
        boxLength: payload.boxWidth,
        boxWidth: payload.boxWidth,
        boxHeight: payload.boxHeight,
        patternCount: payload.boxCount,
        layers: 0,
        boxes: payload.boxes.map((b) => ({
            id: b.id,
            x: b.x,
            y: b.y,
            r: b.r,
            w: b.r === 90 ? payload.boxWidth : payload.boxWidth,
            h: b.r === 90 ? payload.boxWidth : payload.boxWidth
        })),
        selectedIds: [],
        selectedBoxId: null,
        dirty: false,
        connected: true,
        saving: false,
        message: "Loaded from PLC",
        connectionStatus: "connected",
        operationStatus: "idle",
        operationMessage: ""
    };
}
