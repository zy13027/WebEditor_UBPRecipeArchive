export type Rotation = 0 | 90;

export interface PatternBox {
    id: number;
    x: number;
    y: number;
    w: number;
    h: number;
    r: Rotation;
}

export interface PatternState {
    patternName: string;
    palletWidth: number;
    palletHeight: number;
    boxLength: number;
    boxWidth: number;
    boxHeight: number;
    boxes: PatternBox[];
    selectedIds: number[];
    dirty: boolean;
    connected: boolean;
    saving: boolean;
    message: string;   
    palletLength: number;  
    patternCount: number;
    layers: number;
    selectedBoxId: number | null;
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


