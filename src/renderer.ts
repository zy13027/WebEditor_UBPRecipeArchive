import type { PatternBox, PatternState } from "./types";
import logoUrl from "./assets/SIEMENS_Logo.png";

const SVG_NS = "http://www.w3.org/2000/svg";

export class EditorRenderer {
    private readonly root: HTMLElement;
    private readonly statusEl: HTMLElement;
    private readonly detailsEl: HTMLElement;
    private readonly workspaceMetaEl: HTMLElement;
    private readonly svg: SVGSVGElement;
    private readonly palletGroup: SVGGElement;
    private readonly boxGroup: SVGGElement;

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

        <div class="editor-shell">
          <main class="editor-grid">
            <section class="card workspace-card">
              <div class="workspace-toolbar">
                <button type="button" id="loadBtn" class="op-btn">Load</button>
                <button type="button" id="saveBtn" class="op-btn primary">Save</button>
                <button type="button" id="addBoxBtn" class="op-btn">Add Box</button>
                <button type="button" id="rotateBoxBtn" class="op-btn secondary">Rotate Box</button>
                <button type="button" id="selectModeBtn" class="op-btn select-mode">Select</button>
                <button type="button" id="btnAlignH" class="op-btn secondary">Align Herizontally</button>
                <button type="button" id="btnAlignV" class="op-btn secondary">Align Vertically</button>
                <button type="button" id="deleteBoxBtn" class="op-btn danger">Delete Box</button>
                
              </div>

              <div class="card-title">Workspace</div>
              <div id="workspaceMeta" class="workspace-meta"></div>

              <div class="workspace-stage">
                <div id="svgHost" class="svg-host"></div>
              </div>
            </section>

            <aside class="card inspector-card">
              <div class="card-title">Selected Box</div>
              <div id="details" class="details"></div>
            </aside>
          </main>
        </div>
      </div>
    `;

        this.statusEl = this.root.querySelector("#statusText") as HTMLElement;
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
        this.renderStatus(state);
        this.renderSelectionModeBtn(state);
        this.renderWorkspaceMeta(state);
        this.renderPallet(state);
        this.renderBoxes(state);
        this.renderDetails(state);
    }

    private renderSelectionModeBtn(state: PatternState): void {
        const btn = this.root.querySelector<HTMLButtonElement>("#selectModeBtn");
        if (!btn) return;
        btn.classList.toggle("active", state.selectionMode);
        btn.textContent = state.selectionMode
            ? `Select (${state.selectedIds.length})`
            : "Select";
    }

    private getConnectionText(state: PatternState): string {
        switch (state.connectionStatus) {
            case "connected":
                return "Connected";
            case "connecting":
                return "Connecting...";
            case "error":
                return "Connection error";
            default:
                return "Unknown";
        }
    }

    private getOperationText(state: PatternState): string {
        if (state.operationMessage) {
            return state.operationMessage;
        }

        switch (state.operationStatus) {
            case "loading":
                return "Loading...";
            case "load-success":
                return "Load successful";
            case "load-error":
                return "Load failed";
            case "saving":
                return "Saving...";
            case "save-success":
                return "Save successful";
            case "save-error":
                return "Save failed";
            default:
                return "";
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
          ${state.dirty ? "Unsaved" : "Saved"}
        </div>
      </div>
    `;
    }

    private renderWorkspaceMeta(state: PatternState): void {
        this.workspaceMetaEl.innerHTML = `
      <div class="meta-row"><strong>${state.patternName || "Unnamed pattern"}</strong></div>
      <div class="meta-row">${state.palletLength} × ${state.palletWidth} mm</div>
    `;
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
        <div class="detail-empty">No box selected</div>
      `;
            return;
        }

        this.detailsEl.innerHTML = `
      <div class="detail-grid">
        <div class="detail-row"><span>ID</span><strong>${selectedBox.id}</strong></div>
        <div class="detail-row"><span>X</span><strong>${selectedBox.x}</strong></div>
        <div class="detail-row"><span>Y</span><strong>${selectedBox.y}</strong></div>
        <div class="detail-row"><span>Width</span><strong>${selectedBox.w}</strong></div>
        <div class="detail-row"><span>Length</span><strong>${selectedBox.l}</strong></div>
        <div class="detail-row"><span>Rotation</span><strong>${selectedBox.rot}°</strong></div>
      </div>
    `;
    }
}
