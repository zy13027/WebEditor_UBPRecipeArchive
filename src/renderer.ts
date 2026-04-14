import type { PatternBox, PatternState } from "./types";
import logoUrl from "./assets/SIEMENS_Logo.png";
import { t } from "./i18n";

const SVG_NS = "http://www.w3.org/2000/svg";

export class EditorRenderer {
    private readonly root: HTMLElement;
    private readonly statusEl: HTMLElement;
    private readonly detailsEl: HTMLElement;
    private readonly workspaceMetaEl: HTMLElement;
    private readonly contextBarEl: HTMLElement;
    private readonly svg: SVGSVGElement;
    private readonly palletGroup: SVGGElement;
    private readonly boxGroup: SVGGElement;
    private lastRenderedLang = '';

    constructor(root: HTMLElement) {
        this.root = root;
        this.root.innerHTML = `
      <div class="page">
        <header class="topbar">
          <div class="brand">
            <img src="${logoUrl}" alt="Siemens" class="logo" />
            <div class="brand-text">
              <div class="brand-title">Pallet Pattern Editor</div>
              <div class="brand-subtitle">PLC Web Server Editor</div>
            </div>
          </div>

          <div class="header-right">
            <div id="statusText"></div>
          </div>
        </header>

        <div id="contextBar" class="context-bar"></div>

        <div class="editor-shell">
          <main class="editor-grid">
            <section class="card workspace-card">
              <div class="workspace-toolbar">
                <button type="button" id="loadBtn" class="op-btn">${t('btn.load')}</button>
                <button type="button" id="saveBtn" class="op-btn primary">${t('btn.save')}</button>
                <button type="button" id="addBoxBtn" class="op-btn">${t('btn.addBox')}</button>
                <button type="button" id="rotateBoxBtn" class="op-btn secondary">${t('btn.rotateBox')}</button>
                <button type="button" id="selectModeBtn" class="op-btn select-mode">${t('btn.select')}</button>
                <button type="button" id="btnAlignH" class="op-btn secondary">${t('btn.alignH')}</button>
                <button type="button" id="btnAlignV" class="op-btn secondary">${t('btn.alignV')}</button>
                <button type="button" id="deleteBoxBtn" class="op-btn danger">${t('btn.deleteBox')}</button>
                
              </div>

              <div id="labelWorkspace" class="card-title">${t('label.workspace')}</div>
              <div id="workspaceMeta" class="workspace-meta"></div>

              <div class="workspace-stage">
                <div id="svgHost" class="svg-host"></div>
              </div>
            </section>

            <aside class="card inspector-card">
              <div id="labelSelectedBox" class="card-title">${t('label.selectedBox')}</div>
              <div id="details" class="details"></div>
            </aside>
          </main>
        </div>
      </div>
    `;

        this.statusEl = this.root.querySelector("#statusText") as HTMLElement;
        this.contextBarEl = this.root.querySelector("#contextBar") as HTMLElement;
        this.detailsEl = this.root.querySelector("#details") as HTMLElement;
        this.workspaceMetaEl = this.root.querySelector("#workspaceMeta") as HTMLElement;

        this.svg = document.createElementNS(SVG_NS, "svg");
        this.svg.setAttribute("class", "editor-svg");
        this.svg.setAttribute("viewBox", "0 0 900 700");
        this.svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

        this.palletGroup = document.createElementNS(SVG_NS, "g");
        this.boxGroup = document.createElementNS(SVG_NS, "g");

        this.svg.appendChild(this.palletGroup);
        this.svg.appendChild(this.boxGroup);

        const host = this.root.querySelector("#svgHost") as HTMLElement;
        host.appendChild(this.svg);
    }

    getSvg(): SVGSVGElement {
        return this.svg;
    }

    render(state: PatternState): void {
        this.renderLabels(state);
        this.renderStatus(state);
        this.renderContextBar(state);
        this.renderSelectionModeBtn(state);
        this.renderWorkspaceMeta(state);
        this.renderPallet(state);
        this.renderBoxes(state);
        this.renderDetails(state);
    }

    /** Updates static toolbar/panel labels. Skipped when language has not changed. */
    private renderLabels(state: PatternState): void {
        if (state.language === this.lastRenderedLang) return;
        this.lastRenderedLang = state.language;

        const q = (id: string) => this.root.querySelector<HTMLElement>(`#${id}`);
        const setText = (id: string, key: string) => {
            const el = q(id);
            if (el) el.textContent = t(key);
        };

        setText('loadBtn', 'btn.load');
        setText('saveBtn', 'btn.save');
        setText('addBoxBtn', 'btn.addBox');
        setText('rotateBoxBtn', 'btn.rotateBox');
        setText('btnAlignH', 'btn.alignH');
        setText('btnAlignV', 'btn.alignV');
        setText('deleteBoxBtn', 'btn.deleteBox');
        setText('labelWorkspace', 'label.workspace');
        setText('labelSelectedBox', 'label.selectedBox');
    }

    private renderContextBar(state: PatternState): void {
        const recipe  = state.recipeId      > 0 ? String(state.recipeId)      : '—';
        const layer   = state.selectedLayer > 0 ? String(state.selectedLayer) : '—';
        const pattern = state.patternIndex  > 0 ? String(state.patternIndex)  : '—';
        const name    = state.patternName   || t('label.unnamed');

        this.contextBarEl.innerHTML = `
      <div class="context-bar-inner">
        <div class="context-bar-fields">
          <span class="context-field">
            <span class="context-field-label">${t('context.recipe')}</span>
            <span class="context-field-value">${recipe}</span>
          </span>
          <span class="context-bar-sep">·</span>
          <span class="context-field">
            <span class="context-field-label">${t('context.name')}</span>
            <span class="context-field-value">${name}</span>
          </span>
          <span class="context-bar-sep">·</span>
          <span class="context-field">
            <span class="context-field-label">${t('context.layer')}</span>
            <span class="context-field-value">${layer}</span>
          </span>
          <span class="context-bar-sep">·</span>
          <span class="context-field">
            <span class="context-field-label">${t('context.pattern')}</span>
            <span class="context-field-value">${pattern}</span>
          </span>
          <span class="context-bar-sep">·</span>
          <span class="context-field">
            <span class="context-field-label">${t('context.pallet')}</span>
            <span class="context-field-value">${state.palletLength} × ${state.palletWidth} mm</span>
          </span>
        </div>
        <div class="context-staging-note">${t('context.stagingNote')}</div>
      </div>
    `;
    }

    private renderSelectionModeBtn(state: PatternState): void {
        const btn = this.root.querySelector<HTMLButtonElement>("#selectModeBtn");
        if (!btn) return;
        btn.classList.toggle("active", state.selectionMode);
        btn.textContent = state.selectionMode
            ? `${t('btn.select')} (${state.selectedIds.length})`
            : t('btn.select');
    }

    private getConnectionText(state: PatternState): string {
        switch (state.connectionStatus) {
            case "connected":  return t('status.connected');
            case "anonymous":  return t('status.anonymous');
            case "connecting": return t('status.connecting');
            case "error":      return t('status.connectionError');
            default:           return t('status.unknown');
        }
    }

    private getOperationText(state: PatternState): string {
        // operationMessage carries error detail or explicit override text.
        // For normal load/save statuses, fall through to translated keys so
        // the message stays correct when the UI language changes.
        if (state.operationMessage) {
            return state.operationMessage;
        }

        switch (state.operationStatus) {
            case "loading":      return t('msg.loading');      // "Loading from library..."
            case "load-success": return t('msg.loadSuccess');  // "Loaded from library"
            case "load-error":   return t('msg.loadFailed');
            case "saving":       return t('msg.saving');       // "Saving to editor..."
            case "save-success": return t('msg.saveSuccess');  // "Saved to editor"
            case "save-error":   return t('msg.saveFailed');
            case "validation-error": return t('msg.validationFailed');
            default:             return "";
        }
    }

    private renderStatus(state: PatternState): void {
        const operationText = this.getOperationText(state);

        this.statusEl.innerHTML = `
      <div class="top-status-group">
        <div class="status-badge connection ${state.connectionStatus}">
          ${this.getConnectionText(state)}
        </div>
        ${
            state.operationStatus !== "idle"
                ? `
              <div class="status-badge operation ${state.operationStatus}">
                ${operationText}
              </div>
            `
                : ""
        }
        <div class="status-badge dirty ${state.dirty ? "unsaved" : "saved"}">
          ${state.dirty ? t('status.unsaved') : t('status.saved')}
        </div>
      </div>
    `;
    }

    private renderWorkspaceMeta(_state: PatternState): void {
        // Context details are shown in the context bar above the editor.
        // This element is kept for spacing; content is intentionally empty.
        this.workspaceMetaEl.innerHTML = '';
    }

    private getViewportTransform(state: PatternState) {
        const palletLength = Math.max(state.palletLength, 1);
        const palletWidth = Math.max(state.palletWidth, 1);

        const padding = 60;
        const viewWidth = 900;
        const viewHeight = 700;

        const scale = Math.min(
            (viewWidth - padding * 2) / palletLength,
            (viewHeight - padding * 2) / palletWidth
        );

        const renderedWidth = palletLength * scale;
        const renderedHeight = palletWidth * scale;

        const offsetX = (viewWidth - renderedWidth) / 2;
        const offsetY = (viewHeight - renderedHeight) / 2;

        return { scale, offsetX, offsetY, renderedWidth, renderedHeight };
    }

    private renderPallet(state: PatternState): void {
        this.palletGroup.innerHTML = "";

        const { scale, offsetX, offsetY, renderedWidth, renderedHeight } =
            this.getViewportTransform(state);

        const palletRect = document.createElementNS(SVG_NS, "rect");
        palletRect.setAttribute("x", String(offsetX));
        palletRect.setAttribute("y", String(offsetY));
        palletRect.setAttribute("width", String(renderedWidth));
        palletRect.setAttribute("height", String(renderedHeight));
        palletRect.setAttribute("class", "pallet");

        this.palletGroup.appendChild(palletRect);

        const label = document.createElementNS(SVG_NS, "text");
        label.setAttribute("x", String(offsetX));
        label.setAttribute("y", String(offsetY - 12));
        label.setAttribute("class", "svg-label");
        label.textContent = `${state.patternName || "Unnamed pattern"} · ${state.palletLength} × ${state.palletWidth} mm`;

        this.palletGroup.appendChild(label);

        this.svg.dataset.scale = String(scale);
        this.svg.dataset.offsetX = String(offsetX);
        this.svg.dataset.offsetY = String(offsetY);
    }

    private renderBoxes(state: PatternState): void {
        this.boxGroup.innerHTML = "";

        const { scale, offsetX, offsetY } = this.getViewportTransform(state);

        for (const box of state.boxes) {
            this.renderBox(box, state, scale, offsetX, offsetY);
        }
    }

    private renderBox(
        box: PatternBox,
        state: PatternState,
        scale: number,
        offsetX: number,
        offsetY: number
    ): void {
        const width = Math.max(box.w * scale, 8);
        const length = Math.max(box.l * scale, 8);

        const x = offsetX + box.x * scale;
        const y = offsetY + box.y * scale;

        const isSelected =
            state.selectedIds?.includes(box.id) || state.selectedBoxId === box.id;

        const group = document.createElementNS(SVG_NS, "g");
        group.setAttribute("data-box-id", String(box.id));
        group.setAttribute("class", "box-group");

        const rect = document.createElementNS(SVG_NS, "rect");
        rect.setAttribute("x", String(x));
        rect.setAttribute("y", String(y));
        rect.setAttribute("width", String(width));
        rect.setAttribute("height", String(length));
        rect.setAttribute("rx", "4");
        rect.setAttribute("ry", "4");
        rect.setAttribute("class", `box${isSelected ? " selected" : ""}`);

        const text = document.createElementNS(SVG_NS, "text");
        text.setAttribute("x", String(x + width / 2));
        text.setAttribute("y", String(y + length / 2));
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("dominant-baseline", "middle");
        text.setAttribute("class", "box-label");
        text.textContent = String(box.id);

        group.appendChild(rect);
        group.appendChild(text);
        this.boxGroup.appendChild(group);
    }


    private renderDetails(state: PatternState): void {
        const selectedBox = state.boxes.find((b) => b.id === state.selectedBoxId);

        if (!selectedBox) {
            this.detailsEl.innerHTML = `
        <div class="detail-empty">${t('inspector.noBox')}</div>
      `;
            return;
        }

        this.detailsEl.innerHTML = `
      <div class="detail-grid">
        <div class="detail-row"><span>${t('inspector.id')}</span><strong>${selectedBox.id}</strong></div>
        <div class="detail-row"><span>${t('inspector.x')}</span><strong>${selectedBox.x}</strong></div>
        <div class="detail-row"><span>${t('inspector.y')}</span><strong>${selectedBox.y}</strong></div>
        <div class="detail-row"><span>${t('inspector.width')}</span><strong>${selectedBox.w}</strong></div>
        <div class="detail-row"><span>${t('inspector.length')}</span><strong>${selectedBox.l}</strong></div>
        <div class="detail-row"><span>${t('inspector.rotation')}</span><strong>${selectedBox.rot}°</strong></div>
      </div>
    `;
    }
}
