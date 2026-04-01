export type Lang = 'en' | 'zh-CN';

type Translations = Record<string, string>;

const en: Translations = {
    'title': 'Pallet Pattern Editor',
    'subtitle': 'PLC Web Server Editor',
    'workspace': 'Workspace',
    'selectedBox': 'Selected Box',

    'btn.add': 'Add',
    'btn.rotate': 'Rotate',
    'btn.alignX': 'Align X',
    'btn.alignY': 'Align Y',
    'btn.delete': 'Delete',
    'btn.load': 'Load',
    'btn.save': 'Save',

    'tip.add': 'Add box',
    'tip.rotate': 'Rotate selected',
    'tip.alignLeft': 'Align left',
    'tip.alignTop': 'Align top',
    'tip.delete': 'Delete selected',
    'tip.load': 'Load from PLC',
    'tip.save': 'Save to PLC',

    'status.connected': 'Connected',
    'status.offline': 'Offline',
    'status.unsaved': 'Unsaved',
    'status.saved': 'Saved',

    'msg.ready': 'Ready',
    'msg.connecting': 'Connecting...',
    'msg.saving': 'Saving...',
    'msg.saved': 'Saved',
    'msg.loading': 'Loading...',
    'msg.loaded': 'Loaded from PLC',
    'msg.loginFailed': 'Login failed. Check PLC Web API and credentials.',
    'msg.connectionError': 'Connection error',
    'msg.loadFailed': 'Load failed',
    'msg.saveFailed': 'Save failed',

    'lang.label': '中文',
};

const zhCN: Translations = {
    'title': '托盘码垛编辑器',
    'subtitle': 'PLC Web服务器编辑器',
    'workspace': '工作区',
    'selectedBox': '选中的箱子',

    'btn.add': '添加',
    'btn.rotate': '旋转',
    'btn.alignX': '对齐X',
    'btn.alignY': '对齐Y',
    'btn.delete': '删除',
    'btn.load': '加载',
    'btn.save': '保存',

    'tip.add': '添加箱子',
    'tip.rotate': '旋转选中',
    'tip.alignLeft': '左对齐',
    'tip.alignTop': '顶部对齐',
    'tip.delete': '删除选中',
    'tip.load': '从PLC加载',
    'tip.save': '保存到PLC',

    'status.connected': '已连接',
    'status.offline': '离线',
    'status.unsaved': '未保存',
    'status.saved': '已保存',

    'msg.ready': '就绪',
    'msg.connecting': '连接中...',
    'msg.saving': '保存中...',
    'msg.saved': '已保存',
    'msg.loading': '加载中...',
    'msg.loaded': '已从PLC加载',
    'msg.loginFailed': '登录失败，请检查PLC Web API及凭据。',
    'msg.connectionError': '连接错误',
    'msg.loadFailed': '加载失败',
    'msg.saveFailed': '保存失败',

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
