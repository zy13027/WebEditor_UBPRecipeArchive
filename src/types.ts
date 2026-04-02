export type Rotation = 0 | 90;

export interface PatternBox {
    id: number;
    x: number;
    y: number;
    l: number;
    w: number;
    rot: Rotation;
    seq: number;
    flags?: number;
    selected?: boolean;
}

export interface PatternState {
    recipeId: number;
    patternIndex: number;
    patternName: string;

    palletWidth: number;
    palletHeight: number;
    palletLength: number;


    boxLength: number;
    boxWidth: number;
    boxHeight: number;

    patternCount: number;
    layers: number;

    boxes: PatternBox[];
    selectedIds: number[];
    selectedBoxId: number | null;

    mirrorX: boolean;
    mirrorY: boolean;
    layerOffsetX_mm: number;
    layerOffsetY_mm: number;

    selectionMode: boolean;
    dirty: boolean;
    syncState: 'idle' | 'loading' | 'loaded' | 'dirty' | 'applying' | 'applied' | 'saving' | 'saved' | 'error';
    statusText: string;
    lastError: string | null;

    connected: boolean;
    saving: boolean;
    message: string;   


    connectionStatus: ConnectionStatus;
    operationStatus: OperationStatus;
    operationMessage: string;
}

export interface PlcPatternPayload {
    patternName: string;
    palletWidth: number;
    palletHeight: number;
    boxWidth: number;
    boxHeight: number;
    boxCount: number;
    boxes: Array<{
        id: number;
        x: number;
        y: number;
        r: Rotation;
    }>;
}


export type ConnectionStatus = 'connecting' | 'connected' | 'error';

export type OperationStatus =
    | 'idle'
    | 'loading'
    | 'load-success'
    | 'load-error'
    | 'saving'
    | 'save-success'
    | 'save-error';



export type SyncState =
    | 'idle'
    | 'loading'
    | 'loaded'
    | 'dirty'
    | 'applying'
    | 'applied'
    | 'saving'
    | 'saved'
    | 'error';

