export type Lang = 'en' | 'zh-CN';

type Translations = Record<string, string>;

const en: Translations = {
    'title': 'Pallet Pattern Editor',
    'subtitle': 'PLC Web Server Editor',
    'workspace': 'Workspace',
    'selectedBox': 'Selected Box',

    // toolbar buttons
    'btn.add': 'Add',
    'btn.rotate': 'Rotate',
    'btn.alignX': 'Align X',
    'btn.alignY': 'Align Y',
    'btn.delete': 'Delete',
    'btn.load': 'Load',
    'btn.save': 'Save',
    'btn.addBox': 'Add Box',
    'btn.rotateBox': 'Rotate Box',
    'btn.select': 'Select',
    'btn.alignH': 'Align Horizontally',
    'btn.alignV': 'Align Vertically',
    'btn.deleteBox': 'Delete Box',

    // tooltips
    'tip.add': 'Add box',
    'tip.rotate': 'Rotate selected',
    'tip.alignLeft': 'Align left',
    'tip.alignTop': 'Align top',
    'tip.delete': 'Delete selected',
    'tip.load': 'Load from PLC',
    'tip.save': 'Save to PLC',

    // connection / operation status
    'status.connected': 'Connected',
    'status.anonymous': 'Connected (No Auth)',
    'status.offline': 'Offline',
    'status.connecting': 'Connecting...',
    'status.connectionError': 'Connection error',
    'status.unknown': 'Unknown',
    'status.unsaved': 'Edited',
    'status.saved': 'Saved',

    // operation messages — staging editor workflow
    'msg.ready': 'Ready',
    'msg.connecting': 'Connecting...',
    'msg.saving': 'Saving to editor...',
    'msg.saved': 'Saved to editor',
    'msg.loading': 'Loading from library...',
    'msg.loaded': 'Loaded from library',
    'msg.loadSuccess': 'Loaded from library',
    'msg.saveSuccess': 'Saved to editor',
    'msg.loginFailed': 'Login failed. Check PLC Web API and credentials.',
    'msg.connectionError': 'Connection error',
    'msg.loadFailed': 'Load failed',
    'msg.saveFailed': 'Save failed',
    'msg.validationFailed': 'Validation failed',

    // editing context strip
    'context.recipe': 'Recipe',
    'context.name': 'Name',
    'context.layer': 'Layer',
    'context.pattern': 'Pattern',
    'context.pallet': 'Pallet',
    'context.stagingNote': 'Editing staged recipe',

    // inspector panel
    'inspector.noBox': 'No box selected',
    'inspector.id': 'ID',
    'inspector.x': 'X',
    'inspector.y': 'Y',
    'inspector.width': 'Width',
    'inspector.length': 'Length',
    'inspector.rotation': 'Rotation',

    // misc labels
    'label.workspace': 'Workspace',
    'label.selectedBox': 'Selected Box',
    'label.unnamed': 'Unnamed pattern',

    'lang.label': '中文',
};

const zhCN: Translations = {
    'title': '托盘码垛编辑器',
    'subtitle': 'PLC Web服务器编辑器',
    'workspace': '工作区',
    'selectedBox': '选中的箱子',

    // toolbar buttons
    'btn.add': '添加',
    'btn.rotate': '旋转',
    'btn.alignX': '对齐X',
    'btn.alignY': '对齐Y',
    'btn.delete': '删除',
    'btn.load': '加载',
    'btn.save': '保存',
    'btn.addBox': '添加箱子',
    'btn.rotateBox': '旋转箱子',
    'btn.select': '多选',
    'btn.alignH': '水平对齐',
    'btn.alignV': '垂直对齐',
    'btn.deleteBox': '删除箱子',

    // tooltips
    'tip.add': '添加箱子',
    'tip.rotate': '旋转选中',
    'tip.alignLeft': '左对齐',
    'tip.alignTop': '顶部对齐',
    'tip.delete': '删除选中',
    'tip.load': '从PLC加载',
    'tip.save': '保存到PLC',

    // connection / operation status
    'status.connected': '已连接',
    'status.anonymous': '已连接 (免认证)',
    'status.offline': '离线',
    'status.connecting': '连接中...',
    'status.connectionError': '连接错误',
    'status.unknown': '未知',
    'status.unsaved': '已编辑',
    'status.saved': '已保存',

    // operation messages — staging editor workflow
    'msg.ready': '就绪',
    'msg.connecting': '连接中...',
    'msg.saving': '正在保存到编辑器...',
    'msg.saved': '已保存到编辑器',
    'msg.loading': '正在从库加载...',
    'msg.loaded': '已从库加载',
    'msg.loadSuccess': '已从库加载',
    'msg.saveSuccess': '已保存到编辑器',
    'msg.loginFailed': '登录失败，请检查PLC Web API及凭据。',
    'msg.connectionError': '连接错误',
    'msg.loadFailed': '加载失败',
    'msg.saveFailed': '保存失败',
    'msg.validationFailed': '验证失败',

    // editing context strip
    'context.recipe': '配方',
    'context.name': '名称',
    'context.layer': '层',
    'context.pattern': '图案',
    'context.pallet': '托盘',
    'context.stagingNote': '编辑暂存配方',

    // inspector panel
    'inspector.noBox': '未选中箱子',
    'inspector.id': '编号',
    'inspector.x': 'X',
    'inspector.y': 'Y',
    'inspector.width': '宽度',
    'inspector.length': '长度',
    'inspector.rotation': '旋转角',

    // misc labels
    'label.workspace': '工作区',
    'label.selectedBox': '选中的箱子',
    'label.unnamed': '未命名图案',

    'lang.label': 'EN',
};

const dictionaries: Record<Lang, Translations> = { 'en': en, 'zh-CN': zhCN };

let currentLang: Lang = 'en';
const listeners: Array<(lang: Lang) => void> = [];

export function getLang(): Lang {
    return currentLang;
}

export function setLang(lang: Lang): void {
    if (lang === currentLang) return;
    currentLang = lang;
    document.documentElement.lang = lang;
    for (const fn of listeners) fn(lang);
}

export function toggleLang(): void {
    setLang(currentLang === 'en' ? 'zh-CN' : 'en');
}

export function t(key: string): string {
    return dictionaries[currentLang][key] ?? key;
}

export function onLangChange(fn: (lang: Lang) => void): () => void {
    listeners.push(fn);
    return () => {
        const idx = listeners.indexOf(fn);
        if (idx >= 0) listeners.splice(idx, 1);
    };
}

/**
 * Maps WinCC Unified @CurrentLanguage codes to web-editor Lang.
 * 2052 = Simplified Chinese, 1033 = English.
 */
export function mapPlcLangCode(code: number): Lang {
    if (code === 2052) return 'zh-CN';
    if (code === 1033) return 'en';
    return 'en';
}
