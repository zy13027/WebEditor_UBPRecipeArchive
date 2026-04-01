import {
    createIcons,
    Plus,
    RotateCw,
    Trash2,
    Save,
    Download,
    AlignStartVertical,
    AlignStartHorizontal
} from "lucide";
import { EditorStore } from "./store";
import { t } from "./i18n";

const lucideIcons = { Plus, RotateCw, Trash2, Save, Download, AlignStartVertical, AlignStartHorizontal };

function toolbarHTML(): string {
    return `
      <button class="tool-btn" data-action="add" title="${t('tip.add')}">
        <i data-lucide="plus"></i><span>${t('btn.add')}</span>
      </button>

      <button class="tool-btn" data-action="rotate" title="${t('tip.rotate')}">
        <i data-lucide="rotate-cw"></i><span>${t('btn.rotate')}</span>
      </button>

      <button class="tool-btn" data-action="align-left" title="${t('tip.alignLeft')}">
        <i data-lucide="align-start-horizontal"></i><span>${t('btn.alignX')}</span>
      </button>

      <button class="tool-btn" data-action="align-top" title="${t('tip.alignTop')}">
        <i data-lucide="align-start-vertical"></i><span>${t('btn.alignY')}</span>
      </button>

      <button class="tool-btn danger" data-action="delete" title="${t('tip.delete')}">
        <i data-lucide="trash-2"></i><span>${t('btn.delete')}</span>
      </button>

      <button class="tool-btn primary" data-action="load" title="${t('tip.load')}">
        <i data-lucide="download"></i><span>${t('btn.load')}</span>
      </button>

      <button class="tool-btn primary" data-action="save" title="${t('tip.save')}">
        <i data-lucide="save"></i><span>${t('btn.save')}</span>
      </button>
    `;
}

export class Toolbar {
    readonly element: HTMLElement;

    constructor(
        private readonly store: EditorStore,
        private readonly onLoad: () => Promise<void>,
        private readonly onSave: () => Promise<void>
    ) {
        this.element = document.createElement("div");
        this.element.className = "toolbar";

        this.element.innerHTML = toolbarHTML();

        this.element.addEventListener("click", async (event) => {
            const button = (event.target as HTMLElement).closest("[data-action]") as HTMLButtonElement | null;
            if (!button) return;

            const action = button.dataset.action;

            switch (action) {
                case "add":
                    this.store.addBox();
                    break;
                case "rotate":
                    this.store.rotateSelected();
                    break;
                case "align-left":
                    this.store.alignLeft();
                    break;
                case "align-top":
                    this.store.alignTop();
                    break;
                case "delete":
                    this.store.deleteSelected();
                    break;
                case "load":
                    await this.onLoad();
                    break;
                case "save":
                    await this.onSave();
                    break;
            }
        });

        createIcons({ icons: lucideIcons });
    }

    update(): void {
        this.element.innerHTML = toolbarHTML();
        createIcons({ icons: lucideIcons });
    }
}
