import { readTag, readMany, writeTag } from './plcprogram.services';

export interface WebBox {
    id: number;
    x_mm: number;
    y_mm: number;
    seq: number;
    rot: number;
    flags: number;
}

export interface PalletEditorModel {
    recipeId: number;
    name: string;
    palletLength_mm: number;
    palletWidth_mm: number;
    boxLength_mm: number;
    boxWidth_mm: number;
    boxHeight_mm: number;
    patternCount: number;
    totalLayers: number;
    valid: boolean;

    boxCount: number;
    selectedPattern: number;
    selectedBox: number;
    mirrorX: boolean;
    mirrorY: boolean;
    layerOffsetX_mm: number;
    layerOffsetY_mm: number;

    boxes: WebBox[];
}

const ROOT = '"DB_WebPalletEditor"';

export const PLC_PATHS = {
    recipeId: `${ROOT}.header.recipeId`,
    name: `${ROOT}.header.name`,
    palletLength_mm: `${ROOT}.header.palletLength_mm`,
    palletWidth_mm: `${ROOT}.header.palletWidth_mm`,
    boxLength_mm: `${ROOT}.header.boxLength_mm`,
    boxWidth_mm: `${ROOT}.header.boxWidth_mm`,
    boxHeight_mm: `${ROOT}.header.boxHeight_mm`,
    patternCount: `${ROOT}.header.patternCount`,
    totalLayers: `${ROOT}.header.totalLayers`,
    valid: `${ROOT}.header.valid`,

    boxCount: `${ROOT}.boxCount`,
    selectedPattern: `${ROOT}.selectedPattern`,
    selectedBox: `${ROOT}.selectedBox`,
    mirrorX: `${ROOT}.mirrorX`,
    mirrorY: `${ROOT}.mirrorY`,
    layerOffsetX_mm: `${ROOT}.layerOffsetX_mm`,
    layerOffsetY_mm: `${ROOT}.layerOffsetY_mm`,

    cmdLoad: `${ROOT}.command.loadReq`,
    cmdSave: `${ROOT}.command.saveReq`,
    cmdClear: `${ROOT}.command.clearReq`,
    cmdAck: `${ROOT}.command.ack`,
    busy: `${ROOT}.command.busy`,
    done: `${ROOT}.command.done`,
    error: `${ROOT}.command.error`,
    statusCode: `${ROOT}.command.statusCode`,

    lastError: `${ROOT}.status.lastError`,
    activatedRecipeId: `${ROOT}.status.activatedRecipeId`,
    loadedBoxCount: `${ROOT}.status.loadedBoxCount`,
};

export function boxPath(
    index: number,
    field: 'id' | 'x_mm' | 'y_mm' | 'seq' | 'rot' | 'flags'
): string {
    return `${ROOT}.boxes[${index}].${field}`;
}

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function readEditorHeader(): Promise<Partial<PalletEditorModel>> {
    const values = await readMany([
        PLC_PATHS.recipeId,
        PLC_PATHS.name,
        PLC_PATHS.palletLength_mm,
        PLC_PATHS.palletWidth_mm,
        PLC_PATHS.boxLength_mm,
        PLC_PATHS.boxWidth_mm,
        PLC_PATHS.boxHeight_mm,
        PLC_PATHS.patternCount,
        PLC_PATHS.totalLayers,
        PLC_PATHS.valid,
        PLC_PATHS.boxCount,
        PLC_PATHS.selectedPattern,
        PLC_PATHS.selectedBox,
        PLC_PATHS.mirrorX,
        PLC_PATHS.mirrorY,
        PLC_PATHS.layerOffsetX_mm,
        PLC_PATHS.layerOffsetY_mm,
    ]);

    return {
        recipeId: Number(values[0] ?? 0),
        name: String(values[1] ?? ''),
        palletLength_mm: Number(values[2] ?? 0),
        palletWidth_mm: Number(values[3] ?? 0),
        boxLength_mm: Number(values[4] ?? 0),
        boxWidth_mm: Number(values[5] ?? 0),
        boxHeight_mm: Number(values[6] ?? 0),
        patternCount: Number(values[7] ?? 0),
        totalLayers: Number(values[8] ?? 0),
        valid: Boolean(values[9]),
        boxCount: Number(values[10] ?? 0),
        selectedPattern: Number(values[11] ?? 0),
        selectedBox: Number(values[12] ?? 0),
        mirrorX: Boolean(values[13]),
        mirrorY: Boolean(values[14]),
        layerOffsetX_mm: Number(values[15] ?? 0),
        layerOffsetY_mm: Number(values[16] ?? 0),
    };
}

export async function readBoxes(boxCount: number): Promise<WebBox[]> {
    const paths: string[] = [];

    for (let i = 1; i <= boxCount; i++) {
        paths.push(boxPath(i, 'id'));
        paths.push(boxPath(i, 'x_mm'));
        paths.push(boxPath(i, 'y_mm'));
        paths.push(boxPath(i, 'seq'));
        paths.push(boxPath(i, 'rot'));
        paths.push(boxPath(i, 'flags'));
    }

    const values = await readMany(paths);
    const boxes: WebBox[] = [];

    for (let i = 0; i < values.length; i += 6) {
        boxes.push({
            id: Number(values[i] ?? 0),
            x_mm: Number(values[i + 1] ?? 0),
            y_mm: Number(values[i + 2] ?? 0),
            seq: Number(values[i + 3] ?? 0),
            rot: Number(values[i + 4] ?? 0),
            flags: Number(values[i + 5] ?? 0),
        });
    }

    return boxes;
}

export async function writeEditor(model: PalletEditorModel): Promise<void> {
    await writeTag(PLC_PATHS.recipeId, model.recipeId);
    await writeTag(PLC_PATHS.name, model.name);
    await writeTag(PLC_PATHS.palletLength_mm, model.palletLength_mm);
    await writeTag(PLC_PATHS.palletWidth_mm, model.palletWidth_mm);
    await writeTag(PLC_PATHS.boxLength_mm, model.boxLength_mm);
    await writeTag(PLC_PATHS.boxWidth_mm, model.boxWidth_mm);
    await writeTag(PLC_PATHS.boxHeight_mm, model.boxHeight_mm);
    await writeTag(PLC_PATHS.patternCount, model.patternCount);
    await writeTag(PLC_PATHS.totalLayers, model.totalLayers);
    await writeTag(PLC_PATHS.valid, model.valid);

    await writeTag(PLC_PATHS.boxCount, model.boxCount);
    await writeTag(PLC_PATHS.selectedPattern, model.selectedPattern);
    await writeTag(PLC_PATHS.selectedBox, model.selectedBox);
    await writeTag(PLC_PATHS.mirrorX, model.mirrorX);
    await writeTag(PLC_PATHS.mirrorY, model.mirrorY);
    await writeTag(PLC_PATHS.layerOffsetX_mm, model.layerOffsetX_mm);
    await writeTag(PLC_PATHS.layerOffsetY_mm, model.layerOffsetY_mm);

    for (let i = 0; i < model.boxes.length; i++) {
        const plcIndex = i + 1;
        const box = model.boxes[i];

        await writeTag(boxPath(plcIndex, 'id'), box.id);
        await writeTag(boxPath(plcIndex, 'x_mm'), box.x_mm);
        await writeTag(boxPath(plcIndex, 'y_mm'), box.y_mm);
        await writeTag(boxPath(plcIndex, 'seq'), box.seq);
        await writeTag(boxPath(plcIndex, 'rot'), box.rot);
        await writeTag(boxPath(plcIndex, 'flags'), box.flags);
    }
}

export async function waitForCommand(timeoutMs = 5000): Promise<void> {
    const start = Date.now();

    while (Date.now() - start < timeoutMs) {
        const [busy, done, error] = await Promise.all([
            readTag<boolean>(PLC_PATHS.busy),
            readTag<boolean>(PLC_PATHS.done),
            readTag<boolean>(PLC_PATHS.error),
        ]);

        if (error) {
            const msg = await readTag<string>(PLC_PATHS.lastError);
            await writeTag(PLC_PATHS.cmdAck, true);
            await delay(100);
            await writeTag(PLC_PATHS.cmdAck, false);
            throw new Error(msg || 'PLC command failed');
        }

        if (!busy && done) {
            await writeTag(PLC_PATHS.cmdAck, true);
            await delay(100);
            await writeTag(PLC_PATHS.cmdAck, false);
            return;
        }

        await delay(200);
    }

    throw new Error('PLC command timeout');
}

export async function triggerLoad(recipeId: number): Promise<void> {
    await writeTag(PLC_PATHS.recipeId, recipeId);
    await writeTag(PLC_PATHS.cmdLoad, true);

    try {
        await waitForCommand();
    } finally {
        await writeTag(PLC_PATHS.cmdLoad, false);
    }
}


export async function triggerSave(model: PalletEditorModel): Promise<void> {
    await writeEditor(model);
    await writeTag(PLC_PATHS.cmdSave, true);

    try {
        await waitForCommand();
    } finally {
        await writeTag(PLC_PATHS.cmdSave, false);
    }
}


export async function triggerClear(): Promise<void> {
    await writeTag(PLC_PATHS.cmdClear, true);

    try {
        await waitForCommand();
    } finally {
        await writeTag(PLC_PATHS.cmdClear, false);
    }
}
