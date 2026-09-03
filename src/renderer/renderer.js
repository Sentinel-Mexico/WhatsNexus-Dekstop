const path = require('path');
const { shell, ipcRenderer } = require('electron');

// Idiomas soportados (Los 25 más hablados del mundo en orden proporcional)
const supportedLanguages = [
  'en', 'zh', 'hi', 'es', 'fr',
  'ar', 'bn', 'pt', 'ru', 'ur',
  'id', 'de', 'ja', 'mr', 'te',
  'tr', 'ta', 'yue', 'vi', 'fil',
  'ko', 'fa', 'ha', 'sw', 'it'
];

// Nombres nativos de cada idioma
const nativeNames = {
  en: "English",
  zh: "中文 (普通话)",
  hi: "हिन्दी",
  es: "Español",
  fr: "Français",
  ar: "العربية",
  bn: "বাংলা",
  pt: "Português",
  ru: "Русский",
  ur: "اردو",
  id: "Bahasa Indonesia",
  de: "Deutsch",
  ja: "日本語",
  mr: "मराठी",
  te: "తెలుగు",
  tr: "Türkçe",
  ta: "தமிழ்",
  yue: "粵語 (廣東話)",
  vi: "Tiếng Việt",
  fil: "Filipino",
  ko: "한국어",
  fa: "فارسی",
  ha: "Hausa",
  sw: "Kiswahili",
  it: "Italiano"
};

function getOSLanguage() {
  const lang = navigator.language.split('-')[0];
  return supportedLanguages.includes(lang) ? lang : 'en';
}

// El estado de nuestras cuentas
let accounts = JSON.parse(localStorage.getItem('whatsNexusAccounts')) || [];
let activeAccountId = null;
const HIBERNATION_TIMEOUT = 20 * 60 * 1000; // 20 minutos (en milisegundos)

// Settings
let settings = JSON.parse(localStorage.getItem('whatsNexusSettings')) || {
  theme: 'theme-dark',
  language: getOSLanguage(),
  privacy: 'broad'
};

if (!settings.notifications) {
  const legacyPrivacy = settings.privacy || 'broad';
  settings.notifications = {
    preset: legacyPrivacy,
    desktopNotifications: true,
    contactPhoto: legacyPrivacy !== 'strict',
    contactName: legacyPrivacy !== 'strict',
    messagePreview: legacyPrivacy === 'broad',
    notificationSound: legacyPrivacy !== 'strict',
    supportReminders: true
  };
}

if (!settings.permissions) {
  settings.permissions = {
    microphone: true,
    camera: false,
    location: false,
    screenShare: true,
    screenShareAudio: false
  };
}

// Diccionario de Traducciones
const i18n = {
  "en": {
    "tooltip_back": "Back to chats",
    "settings_subtitle": "Global preferences & account management",
    "desc_accounts": "Manage your WhatsApp accounts, rename them, or toggle Do Not Disturb.",
    "desc_appearance": "Customize visual theme and interface language.",
    "desc_notifications": "Control content privacy for system notifications.",
    "hint_theme": "Choose your preferred color scheme",
    "hint_language": "Select interface language",
    "tooltip_add_account": "Add Account",
    "tooltip_report_bug": "Report Bug",
    "tooltip_settings": "Settings",
    "welcome": "Welcome to WhatsNexus",
    "welcome_desc": "Select an account or add a new one.",
    "settings_title": "Settings",
    "tab_accounts": "Accounts",
    "tab_appearance": "Appearance",
    "tab_notifications": "Notifications",
    "tab_permissions": "Permissions",
    "heading_accounts": "Account Management",
    "label_theme": "Theme",
    "theme_auto": "Auto (System)",
    "theme_light": "Light",
    "theme_dark": "Dark",
    "label_language": "Language",
    "label_privacy": "Privacy Profile",
    "privacy_broad": "Broad",
    "privacy_broad_desc": "Photo, name, message preview, and sound.",
    "privacy_medium": "Medium",
    "privacy_medium_desc": "Photo, name, 'Hidden message', and sound.",
    "privacy_strict": "Strict",
    "privacy_strict_desc": "App icon, 'Hidden contact', 'Hidden message', no sound.",
    "tooltip_dnd": "Do Not Disturb",
    "tooltip_delete": "Delete Account",
    "default_account_name": "Account",
    "hibernation_title": "Account in Hibernation",
    "hibernation_desc": "This session has been paused to free up RAM.",
    "wake_button": "Wake Up",
    "btn_edit": "Edit",
    "btn_delete": "Delete",
    "account_status_title": "Account status",
    "account_status_desc": "Deactivated accounts remain saved, but are not loaded nor receive notifications.",
    "status_active": "Active",
    "status_inactive": "Deactivated",
    "dnd_title": "Do not disturb",
    "dnd_desc": "Mute notifications for this account.",
    "untitled_account": "Untitled Account",
    "card_theme_title": "Themes & Visual Style",
    "label_palette": "Color Palette",
    "palette_whatsapp": "WhatsApp (Emerald)",
    "palette_messenger": "Messenger (Meta Blue)",
    "palette_telegram": "Telegram (Cyan Blue)",
    "palette_signal": "Signal (Royal Blue)",
    "palette_forest": "Forest (Olive & Earth)",
    "card_language_title": "Interface Language",
    "card_tray_title": "System Tray (Status Icon)",
    "hint_tray": "Configure tray presence and style on system taskbar.",
    "label_tray_style": "Tray Icon Style",
    "tray_style_auto": "Default / Brand",
    "tray_style_light": "Light (Monochrome white)",
    "tray_style_dark": "Dark (Monochrome black)",
    "label_tray_badge": "Unread Message Counter",
    "hint_tray_badge": "Show numerical badge on tray icon",
    "heading_notifications_privacy": "Notifications",
    "desc_notifications_privacy": "Choose what information can appear in notifications.",
    "label_privacy_preset": "Privacy",
    "preset_broad": "Broad",
    "preset_medium": "Medium",
    "preset_strict": "Strict",
    "preset_custom": "Custom",
    "notif_desktop_title": "Desktop notifications",
    "notif_desktop_desc": "Display WhatsApp notifications using desktop notification system.",
    "notif_photo_title": "Contact photo",
    "notif_photo_desc": "Display sender photo when available.",
    "notif_name_title": "Contact name",
    "notif_name_desc": "Display sender or group name.",
    "notif_preview_title": "Message preview",
    "notif_preview_desc": "Display received message content.",
    "notif_sound_title": "Notification sound",
    "notif_sound_desc": "Allow desktop to play an alert sound for new messages.",
    "perm_heading": "Permissions",
    "perm_desc": "Define which permissions can be automatically granted to WhatsApp Web.",
    "perm_notice": "Disabled permissions will still be requested when needed.",
    "perm_btn_allow_all": "Allow all",
    "perm_btn_remove_all": "Remove all",
    "perm_group_device": "Device access",
    "perm_mic_title": "microphone",
    "perm_mic_desc": "Automatically allow access to your microphone.",
    "perm_camera_title": "camera",
    "perm_camera_desc": "Automatically allow access to your camera.",
    "perm_location_title": "Location",
    "perm_location_desc": "Automatically allow access to your location.",
    "perm_group_share": "Sharing",
    "perm_screen_title": "Screen sharing",
    "perm_screen_desc": "Automatically allow sharing screen content.",
    "perm_screen_audio_title": "Screen with audio",
    "perm_screen_audio_desc": "Automatically allow screen sharing with audio.",
    "lang_en": "English",
    "lang_zh": "Chinese (Mandarin)",
    "lang_hi": "Hindi",
    "lang_es": "Spanish",
    "lang_fr": "French",
    "lang_ar": "Arabic",
    "lang_bn": "Bengali",
    "lang_pt": "Portuguese",
    "lang_ru": "Russian",
    "lang_ur": "Urdu",
    "lang_id": "Indonesian",
    "lang_de": "German",
    "lang_ja": "Japanese",
    "lang_mr": "Marathi",
    "lang_te": "Telugu",
    "lang_tr": "Turkish",
    "lang_ta": "Tamil",
    "lang_yue": "Cantonese",
    "lang_vi": "Vietnamese",
    "lang_fil": "Filipino",
    "lang_ko": "Korean",
    "lang_fa": "Persian",
    "lang_ha": "Hausa",
    "lang_sw": "Swahili",
    "lang_it": "Italian"
  },
  "zh": {
    "tooltip_back": "返回聊天",
    "settings_subtitle": "全局首选项与多账户管理",
    "desc_accounts": "管理您的 WhatsApp 账户，重命名或开启请勿打扰模式。",
    "desc_appearance": "自定义视觉主题和界面语言。",
    "desc_notifications": "控制系统通知的内容隐私。",
    "hint_theme": "选择您偏好的配色方案",
    "hint_language": "选择界面语言",
    "tooltip_add_account": "添加账户",
    "tooltip_report_bug": "报告问题",
    "tooltip_settings": "设置",
    "welcome": "欢迎使用 WhatsNexus",
    "welcome_desc": "在侧边栏选择一个账户或添加新账户以开始使用。",
    "settings_title": "设置",
    "tab_accounts": "账户",
    "tab_appearance": "外观",
    "tab_notifications": "通知",
    "tab_permissions": "权限",
    "heading_accounts": "账户管理",
    "label_theme": "主题",
    "theme_auto": "自动（跟随系统）",
    "theme_light": "浅色",
    "theme_dark": "深色",
    "label_language": "语言",
    "label_privacy": "隐私预设",
    "privacy_broad": "详细",
    "privacy_broad_desc": "显示头像、姓名、消息预览并播放提示音。",
    "privacy_medium": "适中",
    "privacy_medium_desc": "显示头像、姓名、隐藏消息并播放提示音。",
    "privacy_strict": "严格",
    "privacy_strict_desc": "显示应用图标、隐藏联系人和消息，无声音。",
    "tooltip_dnd": "请勿打扰",
    "tooltip_delete": "删除账户",
    "default_account_name": "账户",
    "hibernation_title": "账户处于休眠状态",
    "hibernation_desc": "已暂停此会话以释放系统内存。",
    "wake_button": "唤醒",
    "btn_edit": "编辑",
    "btn_delete": "删除",
    "account_status_title": "账户状态",
    "account_status_desc": "停用的账户保持保存，但不加载也不接收通知。",
    "status_active": "已启用",
    "status_inactive": "已停用",
    "dnd_title": "请勿打扰",
    "dnd_desc": "为此账户静音通知。",
    "untitled_account": "未命名账户",
    "card_theme_title": "主题与视觉风格",
    "label_palette": "调色板",
    "palette_whatsapp": "WhatsApp（祖母绿）",
    "palette_messenger": "Messenger（Meta 蓝）",
    "palette_telegram": "Telegram（青蓝色）",
    "palette_signal": "Signal（皇家蓝）",
    "palette_forest": "森林（橄榄与大地）",
    "card_language_title": "界面语言",
    "card_tray_title": "系统托盘（状态图标）",
    "hint_tray": "配置系统托盘图标的存在与风格。",
    "label_tray_style": "托盘图标风格",
    "tray_style_auto": "默认 / 品牌颜色",
    "tray_style_light": "浅色（单色白）",
    "tray_style_dark": "深色（单色黑）",
    "label_tray_badge": "未读消息计数器",
    "hint_tray_badge": "在托盘图标上显示未读数字标记",
    "heading_notifications_privacy": "通知设置",
    "desc_notifications_privacy": "选择可以在桌面通知中显示的信息。",
    "label_privacy_preset": "隐私模板",
    "preset_broad": "宽泛",
    "preset_medium": "中等",
    "preset_strict": "严格",
    "preset_custom": "自定义",
    "notif_desktop_title": "桌面通知",
    "notif_desktop_desc": "使用桌面通知系统显示 WhatsApp 提示。",
    "notif_photo_title": "联系人头像",
    "notif_photo_desc": "可用时显示发件人头像。",
    "notif_name_title": "联系人名称",
    "notif_name_desc": "显示发件人或群组名称。",
    "notif_preview_title": "消息预览",
    "notif_preview_desc": "显示收到的消息内容预览。",
    "notif_sound_title": "通知提示音",
    "notif_sound_desc": "允许系统为新消息播放声音。",
    "perm_heading": "权限管理",
    "perm_desc": "定义可以自动授予 WhatsApp Web 的权限。",
    "perm_notice": "禁用的权限在需要时仍会弹出询问提示。",
    "perm_btn_allow_all": "允许全部",
    "perm_btn_remove_all": "全部禁用",
    "perm_group_device": "设备访问",
    "perm_mic_title": "麦克风",
    "perm_mic_desc": "自动允许访问您的麦克风。",
    "perm_camera_title": "摄像头",
    "perm_camera_desc": "自动允许访问您的摄像头。",
    "perm_location_title": "地理位置",
    "perm_location_desc": "自动允许访问您的地理位置。",
    "perm_group_share": "屏幕共享",
    "perm_screen_title": "屏幕共享",
    "perm_screen_desc": "自动允许共享屏幕内容。",
    "perm_screen_audio_title": "屏幕带音频",
    "perm_screen_audio_desc": "自动允许共享带系统音频的屏幕。",
    "lang_en": "English",
    "lang_zh": "中文 (普通话)",
    "lang_hi": "हिन्दी",
    "lang_es": "Español",
    "lang_fr": "Français",
    "lang_ar": "العربية",
    "lang_bn": "বাংলা",
    "lang_pt": "Português",
    "lang_ru": "Русский",
    "lang_ur": "اردو",
    "lang_id": "Bahasa Indonesia",
    "lang_de": "Deutsch",
    "lang_ja": "日本語",
    "lang_mr": "मराठी",
    "lang_te": "తెలుగు",
    "lang_tr": "Türkçe",
    "lang_ta": "தமிழ்",
    "lang_yue": "粵語 (廣東話)",
    "lang_vi": "Tiếng Việt",
    "lang_fil": "Filipino",
    "lang_ko": "한국어",
    "lang_fa": "فارسی",
    "lang_ha": "Hausa",
    "lang_sw": "Kiswahili",
    "lang_it": "Italiano"
  },
  "hi": {
    "tooltip_back": "चैट पर वापस जाएं",
    "settings_subtitle": "वैश्विक प्राथमिकताएं और खाता प्रबंधन",
    "desc_accounts": "अपने व्हाट्सएप खातों को प्रबंधित करें, नाम बदलें या डू नॉट डिस्टर्ब सक्षम करें।",
    "desc_appearance": "दृश्य थीम और भाषा अनुकूलित करें।",
    "desc_notifications": "सिस्टम सूचनाओं के लिए सामग्री गोपनीयता नियंत्रित करें।",
    "hint_theme": "अपनी पसंदीदा रंग योजना चुनें",
    "hint_language": "इंटरफ़ेस भाषा चुनें",
    "tooltip_add_account": "खाता जोड़ें",
    "tooltip_report_bug": "बग रिपोर्ट करें",
    "tooltip_settings": "सेटिंग्स",
    "welcome": "WhatsNexus में आपका स्वागत है",
    "welcome_desc": "शुरू करने के लिए साइडबार में एक खाता चुनें या नया जोड़ें।",
    "settings_title": "सेटिंग्स",
    "tab_accounts": "खाते",
    "tab_appearance": "उपस्थिति",
    "tab_notifications": "सूचनाएं",
    "tab_permissions": "अनुमतियाँ",
    "heading_accounts": "खाता प्रबंधन",
    "label_theme": "थीम",
    "theme_auto": "स्वतः (सिस्टम)",
    "theme_light": "लाइट",
    "theme_dark": "डार्क",
    "label_language": "भाषा",
    "label_privacy": "गोपनीयता प्रोफ़ाइल",
    "privacy_broad": "व्यापक",
    "privacy_broad_desc": "फ़ोटो, नाम, संदेश पूर्वावलोकन और ध्वनि।",
    "privacy_medium": "मध्यम",
    "privacy_medium_desc": "फ़ोटो, नाम, 'छिपा हुआ संदेश', और ध्वनि।",
    "privacy_strict": "सख्त",
    "privacy_strict_desc": "ऐप आइकन, कोई नाम नहीं, कोई संदेश नहीं, मूक।",
    "tooltip_dnd": "डू नॉट डिस्टर्ब",
    "tooltip_delete": "खाता हटाएं",
    "default_account_name": "खाता",
    "hibernation_title": "खाता हाइबरनेशन में है",
    "hibernation_desc": "रैम मुक्त करने के लिए यह सत्र रोक दिया गया है।",
    "wake_button": "जागें",
    "btn_edit": "संपादित करें",
    "btn_delete": "हटाएं",
    "account_status_title": "खाता स्थिति",
    "account_status_desc": "निष्क्रिय खाते सहेजे रहते हैं, लेकिन लोड नहीं होते।",
    "status_active": "सक्रिय",
    "status_inactive": "निष्क्रिय",
    "dnd_title": "डू नॉट डिस्टर्ब",
    "dnd_desc": "इस खाते के लिए सूचनाएं मूक करें।",
    "untitled_account": "शीर्षकहीन खाता",
    "card_theme_title": "थीम और दृश्य शैली",
    "label_palette": "रंग पैलेट",
    "palette_whatsapp": "WhatsApp (पन्ना हरा)",
    "palette_messenger": "Messenger (मेटा नीला)",
    "palette_telegram": "Telegram (सियान नीला)",
    "palette_signal": "Signal (रॉयल नीला)",
    "palette_forest": "वन (जैतून और पृथ्वी)",
    "card_language_title": "इंटरफ़ेस भाषा",
    "card_tray_title": "सिस्टम ट्रे (स्थिति आइकन)",
    "hint_tray": "टास्कबार पर ट्रे आइकन उपस्थिति कॉन्फ़िगर करें।",
    "label_tray_style": "ट्रे आइकन शैली",
    "tray_style_auto": "डिफ़ॉल्ट / ब्रांड",
    "tray_style_light": "हल्का (सफेद मोनोक्रोम)",
    "tray_style_dark": "गहरा (काला मोनोक्रोम)",
    "label_tray_badge": "अपठित संदेश काउंटर",
    "hint_tray_badge": "ट्रे आइकन पर संख्यात्मक बैज दिखाएं",
    "heading_notifications_privacy": "सूचनाएं",
    "desc_notifications_privacy": "चुनें कि सूचनाओं में क्या जानकारी दिखाई दे सकती है।",
    "label_privacy_preset": "गोपनीयता",
    "preset_broad": "व्यापक",
    "preset_medium": "मध्यम",
    "preset_strict": "सख्त",
    "preset_custom": "कस्टम",
    "notif_desktop_title": "डेस्कटॉप सूचनाएं",
    "notif_desktop_desc": "डेस्कटॉप सिस्टम का उपयोग करके व्हाट्सएप सूचनाएं प्रदर्शित करें।",
    "notif_photo_title": "संपर्क फ़ोटो",
    "notif_photo_desc": "उपलब्ध होने पर प्रेषक की फ़ोटो दिखाएं।",
    "notif_name_title": "संपर्क नाम",
    "notif_name_desc": "प्रेषक या समूह का नाम प्रदर्शित करें।",
    "notif_preview_title": "संदेश पूर्वावलोकन",
    "notif_preview_desc": "प्राप्त संदेश की सामग्री दिखाएं।",
    "notif_sound_title": "सूचना ध्वनि",
    "notif_sound_desc": "नए संदेशों के लिए अलर्ट ध्वनि बजाने की अनुमति दें।",
    "perm_heading": "अनुमतियाँ",
    "perm_desc": "परिभाषित करें कि WhatsApp Web को कौन सी अनुमतियाँ स्वतः दी जा सकती हैं।",
    "perm_notice": "अक्षम की गई अनुमतियों का अनुरोध आवश्यकता पड़ने पर किया जाएगा।",
    "perm_btn_allow_all": "सभी की अनुमति दें",
    "perm_btn_remove_all": "सभी हटाएं",
    "perm_group_device": "डिवाइस एक्सेस",
    "perm_mic_title": "माइक्रोफ़ोन",
    "perm_mic_desc": "अपने माइक्रोफ़ोन तक पहुंच की स्वचालित अनुमति दें।",
    "perm_camera_title": "कैमरा",
    "perm_camera_desc": "अपने कैमरे तक पहुंच की स्वचालित अनुमति दें।",
    "perm_location_title": "स्थान",
    "perm_location_desc": "अपने स्थान तक स्वचालित पहुंच की अनुमति दें।",
    "perm_group_share": "साझा करना",
    "perm_screen_title": "स्क्रीन साझाकरण",
    "perm_screen_desc": "स्क्रीन सामग्री साझा करने की स्वचालित अनुमति दें।",
    "perm_screen_audio_title": "ऑडियो के साथ स्क्रीन",
    "perm_screen_audio_desc": "ऑडियो के साथ स्क्रीन साझा करने की स्वचालित अनुमति दें।",
    "lang_en": "English",
    "lang_zh": "中文 (普通话)",
    "lang_hi": "हिन्दी",
    "lang_es": "Español",
    "lang_fr": "Français",
    "lang_ar": "العربية",
    "lang_bn": "বাংলা",
    "lang_pt": "Português",
    "lang_ru": "Русский",
    "lang_ur": "اردو",
    "lang_id": "Bahasa Indonesia",
    "lang_de": "Deutsch",
    "lang_ja": "日本語",
    "lang_mr": "मराठी",
    "lang_te": "తెలుగు",
    "lang_tr": "Türkçe",
    "lang_ta": "தமிழ்",
    "lang_yue": "粵語 (廣東話)",
    "lang_vi": "Tiếng Việt",
    "lang_fil": "Filipino",
    "lang_ko": "한국어",
    "lang_fa": "فارسی",
    "lang_ha": "Hausa",
    "lang_sw": "Kiswahili",
    "lang_it": "Italiano"
  },
  "es": {
    "tooltip_back": "Volver a los chats",
    "settings_subtitle": "Preferencias globales y gestión de cuentas",
    "desc_accounts": "Administra tus perfiles de WhatsApp, cambia sus nombres o activa el modo No Molestar.",
    "desc_appearance": "Personaliza los temas visuales, el idioma y la integración con la bandeja del sistema.",
    "desc_notifications": "Controla la privacidad del contenido en las notificaciones del sistema.",
    "hint_theme": "Elige tu combinación de colores preferida",
    "hint_language": "Selecciona el idioma de la interfaz",
    "tooltip_add_account": "Añadir Cuenta",
    "tooltip_report_bug": "Reportar Error",
    "tooltip_settings": "Configuración",
    "welcome": "Bienvenido a WhatsNexus",
    "welcome_desc": "Selecciona una cuenta en la barra lateral o añade una nueva para comenzar.",
    "settings_title": "Configuración",
    "tab_accounts": "Cuentas",
    "tab_appearance": "Apariencia",
    "tab_notifications": "Notificaciones",
    "tab_permissions": "Permisos",
    "heading_accounts": "Gestión de Cuentas",
    "label_theme": "Tema",
    "theme_auto": "Automático (Sistema)",
    "theme_light": "Claro",
    "theme_dark": "Oscuro",
    "label_language": "Idioma",
    "label_privacy": "Perfil de Privacidad",
    "privacy_broad": "Amplio",
    "privacy_broad_desc": "Foto, nombre, vista previa del mensaje y sonido.",
    "privacy_medium": "Medio",
    "privacy_medium_desc": "Foto, nombre, 'Mensaje oculto' y sonido.",
    "privacy_strict": "Estricto",
    "privacy_strict_desc": "Icono de la app, 'Contacto oculto', 'Mensaje oculto', sin sonido.",
    "tooltip_dnd": "No Molestar",
    "tooltip_delete": "Eliminar Cuenta",
    "default_account_name": "Cuenta",
    "hibernation_title": "Cuenta en Hibernación",
    "hibernation_desc": "Esta sesión ha sido pausada para liberar memoria RAM.",
    "wake_button": "Despertar",
    "btn_edit": "Editar",
    "btn_delete": "Eliminar",
    "account_status_title": "Estado de la cuenta",
    "account_status_desc": "Las cuentas desactivadas se mantienen guardadas, pero no se cargan ni reciben notificaciones.",
    "status_active": "Activa",
    "status_inactive": "Desactivada",
    "dnd_title": "No molestar",
    "dnd_desc": "Silenciar notificaciones para esta cuenta.",
    "untitled_account": "Cuenta sin nombre",
    "card_theme_title": "Temas y Estilo Visual",
    "label_palette": "Paleta de Colores",
    "palette_whatsapp": "WhatsApp (Esmeralda)",
    "palette_messenger": "Messenger (Azul Meta)",
    "palette_telegram": "Telegram (Azul Cian)",
    "palette_signal": "Signal (Azul Real)",
    "palette_forest": "Bosque (Oliva y Tierra)",
    "card_language_title": "Idioma de la Interfaz",
    "card_tray_title": "Bandeja del Sistema (Icono de Estado)",
    "hint_tray": "Configura la presencia y estilo del icono en la barra de tareas o panel de notificaciones.",
    "label_tray_style": "Estilo del Icono en Bandeja",
    "tray_style_auto": "Predeterminado / Marca",
    "tray_style_light": "Claro (Monocromático blanco)",
    "tray_style_dark": "Oscuro (Monocromático negro)",
    "label_tray_badge": "Contador de mensajes no leídos",
    "hint_tray_badge": "Mostrar badge numérico en el icono",
    "heading_notifications_privacy": "Notificaciones",
    "desc_notifications_privacy": "Elige qué información se puede mostrar en las notificaciones.",
    "label_privacy_preset": "Privacidad",
    "preset_broad": "Amplio",
    "preset_medium": "Medio",
    "preset_strict": "Estricto",
    "preset_custom": "Personalizado",
    "notif_desktop_title": "Notificaciones de escritorio",
    "notif_desktop_desc": "Muestra notificaciones de WhatsApp usando el sistema de notificaciones del escritorio.",
    "notif_photo_title": "Foto de contacto",
    "notif_photo_desc": "Muestra la foto del remitente cuando esté disponible.",
    "notif_name_title": "Nombre de contacto",
    "notif_name_desc": "Muestra el nombre del remitente o del grupo.",
    "notif_preview_title": "Vista previa del mensaje",
    "notif_preview_desc": "Muestra el contenido del mensaje recibido.",
    "notif_sound_title": "Sonido de notificación",
    "notif_sound_desc": "Permite que el escritorio reproduzca un sonido de alerta para los mensajes nuevos.",
    "perm_heading": "Permisos",
    "perm_desc": "Defina qué permisos se pueden otorgar automáticamente a WhatsApp Web.",
    "perm_notice": "Se seguirán solicitando permisos deshabilitados cuando sea necesario.",
    "perm_btn_allow_all": "Permitir todo",
    "perm_btn_remove_all": "Quitar todo",
    "perm_group_device": "Acceso al dispositivo",
    "perm_mic_title": "micrófono",
    "perm_mic_desc": "Permita automáticamente el acceso a su micrófono.",
    "perm_camera_title": "cámara",
    "perm_camera_desc": "Permita automáticamente el acceso a su cámara.",
    "perm_location_title": "Ubicación",
    "perm_location_desc": "Permitir automáticamente el acceso a su ubicación.",
    "perm_group_share": "Compartir",
    "perm_screen_title": "Compartir pantalla",
    "perm_screen_desc": "Permitir automáticamente compartir contenidos de la pantalla.",
    "perm_screen_audio_title": "Pantalla con audio",
    "perm_screen_audio_desc": "Permitir automáticamente compartir pantalla con audio.",
    "lang_en": "English",
    "lang_zh": "中文 (普通话)",
    "lang_hi": "हिन्दी",
    "lang_es": "Español",
    "lang_fr": "Français",
    "lang_ar": "العربية",
    "lang_bn": "বাংলা",
    "lang_pt": "Português",
    "lang_ru": "Русский",
    "lang_ur": "اردو",
    "lang_id": "Bahasa Indonesia",
    "lang_de": "Deutsch",
    "lang_ja": "日本語",
    "lang_mr": "मराठी",
    "lang_te": "తెలుగు",
    "lang_tr": "Türkçe",
    "lang_ta": "தமிழ்",
    "lang_yue": "粵語 (廣東話)",
    "lang_vi": "Tiếng Việt",
    "lang_fil": "Filipino",
    "lang_ko": "한국어",
    "lang_fa": "فارسی",
    "lang_ha": "Hausa",
    "lang_sw": "Kiswahili",
    "lang_it": "Italiano"
  },
  "fr": {
    "tooltip_back": "Retour aux discussions",
    "settings_subtitle": "Préférences globales et gestion des comptes",
    "desc_accounts": "Gérez vos comptes WhatsApp, renommez-les ou activez le mode Ne pas déranger.",
    "desc_appearance": "Personnalisez le thème visuel et la langue de l'interface.",
    "desc_notifications": "Contrôlez la confidentialité du contenu pour les notifications du système.",
    "hint_theme": "Choisissez votre palette de couleurs préférée",
    "hint_language": "Sélectionnez la langue de l'interface",
    "tooltip_add_account": "Ajouter un compte",
    "tooltip_report_bug": "Signaler un bug",
    "tooltip_settings": "Paramètres",
    "welcome": "Bienvenue sur WhatsNexus",
    "welcome_desc": "Sélectionnez un compte ou ajoutez-en un nouveau.",
    "settings_title": "Paramètres",
    "tab_accounts": "Comptes",
    "tab_appearance": "Apparence",
    "tab_notifications": "Notifications",
    "tab_permissions": "Autorisations",
    "heading_accounts": "Gestion des comptes",
    "label_theme": "Thème",
    "theme_auto": "Auto (Système)",
    "theme_light": "Clair",
    "theme_dark": "Sombre",
    "label_language": "Langue",
    "label_privacy": "Profil de confidentialité",
    "privacy_broad": "Large",
    "privacy_broad_desc": "Photo, nom, aperçu du message et son.",
    "privacy_medium": "Moyen",
    "privacy_medium_desc": "Photo, nom, 'Message masqué' et son.",
    "privacy_strict": "Strict",
    "privacy_strict_desc": "Icône de l'application, sans photo, masqué, muet.",
    "tooltip_dnd": "Ne pas déranger",
    "tooltip_delete": "Supprimer le compte",
    "default_account_name": "Compte",
    "hibernation_title": "Compte en Hibernation",
    "hibernation_desc": "Cette session a été mise en pause pour libérer de la RAM.",
    "wake_button": "Réveiller",
    "btn_edit": "Modifier",
    "btn_delete": "Supprimer",
    "account_status_title": "Statut du compte",
    "account_status_desc": "Les comptes désactivés restent enregistrés sans charger de session.",
    "status_active": "Activé",
    "status_inactive": "Désactivé",
    "dnd_title": "Ne pas déranger",
    "dnd_desc": "Désactiver les notifications de ce compte.",
    "untitled_account": "Compte sans nom",
    "card_theme_title": "Thèmes et style visuel",
    "label_palette": "Palette de couleurs",
    "palette_whatsapp": "WhatsApp (Émeraude)",
    "palette_messenger": "Messenger (Bleu Meta)",
    "palette_telegram": "Telegram (Bleu Cyan)",
    "palette_signal": "Signal (Bleu Royal)",
    "palette_forest": "Forêt (Olive & Terre)",
    "card_language_title": "Langue de l'interface",
    "card_tray_title": "Barre d'état système (Tray)",
    "hint_tray": "Configurer l'icône dans la zone de notification.",
    "label_tray_style": "Style d'icône de la barre",
    "tray_style_auto": "Par défaut / Marque",
    "tray_style_light": "Clair (Blanc monochrome)",
    "tray_style_dark": "Sombre (Noir monochrome)",
    "label_tray_badge": "Compteur de messages non lus",
    "hint_tray_badge": "Afficher le badge numérique sur l'icône",
    "heading_notifications_privacy": "Notifications",
    "desc_notifications_privacy": "Choisissez les informations pouvant apparaître dans les notifications.",
    "label_privacy_preset": "Confidentialité",
    "preset_broad": "Large",
    "preset_medium": "Moyen",
    "preset_strict": "Strict",
    "preset_custom": "Personnalisé",
    "notif_desktop_title": "Notifications de bureau",
    "notif_desktop_desc": "Affichez les notifications WhatsApp via le système de bureau.",
    "notif_photo_title": "Photo de contact",
    "notif_photo_desc": "Afficher la photo de l'expéditeur si disponible.",
    "notif_name_title": "Nom de contact",
    "notif_name_desc": "Afficher l'expéditeur ou le nom du groupe.",
    "notif_preview_title": "Aperçu du message",
    "notif_preview_desc": "Afficher le contenu du message reçu.",
    "notif_sound_title": "Son de notification",
    "notif_sound_desc": "Permettre au système de jouer un son pour les nouveaux messages.",
    "perm_heading": "Autorisations",
    "perm_desc": "Définissez les autorisations qui peuvent être accordées automatiquement à WhatsApp Web.",
    "perm_notice": "Les autorisations désactivées continueront d'être demandées si nécessaire.",
    "perm_btn_allow_all": "Tout autoriser",
    "perm_btn_remove_all": "Tout supprimer",
    "perm_group_device": "Accès à l'appareil",
    "perm_mic_title": "microphone",
    "perm_mic_desc": "Autoriser automatiquement l'accès à votre microphone.",
    "perm_camera_title": "caméra",
    "perm_camera_desc": "Autoriser automatiquement l'accès à votre caméra.",
    "perm_location_title": "Localisation",
    "perm_location_desc": "Autoriser automatiquement l'accès à votre localisation.",
    "perm_group_share": "Partage",
    "perm_screen_title": "Partager l'écran",
    "perm_screen_desc": "Autoriser automatiquement le partage du contenu de l'écran.",
    "perm_screen_audio_title": "Écran avec audio",
    "perm_screen_audio_desc": "Autoriser automatiquement le partage d'écran avec audio.",
    "lang_en": "English",
    "lang_zh": "中文 (普通话)",
    "lang_hi": "हिन्दी",
    "lang_es": "Español",
    "lang_fr": "Français",
    "lang_ar": "العربية",
    "lang_bn": "বাংলা",
    "lang_pt": "Português",
    "lang_ru": "Русский",
    "lang_ur": "اردو",
    "lang_id": "Bahasa Indonesia",
    "lang_de": "Deutsch",
    "lang_ja": "日本語",
    "lang_mr": "मराठी",
    "lang_te": "తెలుగు",
    "lang_tr": "Türkçe",
    "lang_ta": "தமிழ்",
    "lang_yue": "粵語 (廣東話)",
    "lang_vi": "Tiếng Việt",
    "lang_fil": "Filipino",
    "lang_ko": "한국어",
    "lang_fa": "فارسی",
    "lang_ha": "Hausa",
    "lang_sw": "Kiswahili",
    "lang_it": "Italiano"
  },
  "ar": {
    "tooltip_back": "العودة إلى المحادثات",
    "settings_subtitle": "التفضيلات العامة وإدارة الحسابات",
    "desc_accounts": "إدارة حساباتك وتعديل الأسماء أو تفعيل وضع عدم الإزعاج.",
    "desc_appearance": "تخصيص المظهر ولغة الواجهة.",
    "desc_notifications": "التحكم في خصوصية محتوى إشعارات النظام.",
    "hint_theme": "اختر نظام الألوان المفضل لديك",
    "hint_language": "اختر لغة الواجهة",
    "tooltip_add_account": "إضافة حساب",
    "tooltip_report_bug": "الإبلاغ عن خطأ",
    "tooltip_settings": "الإعدادات",
    "welcome": "مرحبًا بك في WhatsNexus",
    "welcome_desc": "حدد حسابًا من الشريط الجانبي أو أضف حسابًا جديدًا للبدء.",
    "settings_title": "الإعدادات",
    "tab_accounts": "الحسابات",
    "tab_appearance": "المظهر",
    "tab_notifications": "الإشعارات",
    "tab_permissions": "الأذونات",
    "heading_accounts": "إدارة الحسابات",
    "label_theme": "المظهر",
    "theme_auto": "تلقائي (النظام)",
    "theme_light": "فاتح",
    "theme_dark": "داكن",
    "label_language": "اللغة",
    "label_privacy": "ملف الخصوصية",
    "privacy_broad": "واسع",
    "privacy_broad_desc": "الصورة والاسم ومعاينة الرسالة والصوت.",
    "privacy_medium": "متوسط",
    "privacy_medium_desc": "الصورة والاسم و'رسالة مخفية' والصوت.",
    "privacy_strict": "صارم",
    "privacy_strict_desc": "أيقونة التطبيق وبدون اسم أو رسالة أو صوت.",
    "tooltip_dnd": "عدم الإزعاج",
    "tooltip_delete": "حذف الحساب",
    "default_account_name": "حساب",
    "hibernation_title": "الحساب في وضع السكون",
    "hibernation_desc": "تم إيقاف هذه الجلسة مؤقتًا لتوفير الذاكرة.",
    "wake_button": "استيقاظ",
    "btn_edit": "تعديل",
    "btn_delete": "حذف",
    "account_status_title": "حالة الحساب",
    "account_status_desc": "تظل الحسابات المعطلة محفوظة لكنها لا تُحمّل.",
    "status_active": "نشط",
    "status_inactive": "معطل",
    "dnd_title": "عدم الإزعاج",
    "dnd_desc": "كتم الإشعارات لهذا الحساب.",
    "untitled_account": "حساب بدون اسم",
    "card_theme_title": "المظهر والنمط المرئي",
    "label_palette": "لوحة الألوان",
    "palette_whatsapp": "WhatsApp (زمردي)",
    "palette_messenger": "Messenger (أزرق ميتا)",
    "palette_telegram": "Telegram (أزرق سماوي)",
    "palette_signal": "Signal (أزرق ملكي)",
    "palette_forest": "غابة (زيتوني وترابي)",
    "card_language_title": "لغة الواجهة",
    "card_tray_title": "صينية النظام (أيقونة الحالة)",
    "hint_tray": "تكوين وجود ونمط الرمز في شريط المهام.",
    "label_tray_style": "نمط أيقونة الدرج",
    "tray_style_auto": "افتراضي / العلامة التجارية",
    "tray_style_light": "فاتح (أبيض أحادي)",
    "tray_style_dark": "داكن (أسود أحادي)",
    "label_tray_badge": "عداد الرسائل غير المقروءة",
    "hint_tray_badge": "إظهار شارة رقمية على الأيقونة",
    "heading_notifications_privacy": "الإشعارات",
    "desc_notifications_privacy": "اختر المعلومات التي تظهر في الإشعارات.",
    "label_privacy_preset": "الخصوصية",
    "preset_broad": "واسع",
    "preset_medium": "متوسط",
    "preset_strict": "صارم",
    "preset_custom": "مخصص",
    "notif_desktop_title": "إشعارات سطح المكتب",
    "notif_desktop_desc": "عرض إشعارات WhatsApp باستخدام نظام سطح المكتب.",
    "notif_photo_title": "صورة جهة الاتصال",
    "notif_photo_desc": "إظهار صورة المرسل عند توفرها.",
    "notif_name_title": "اسم جهة الاتصال",
    "notif_name_desc": "عرض اسم المرسل أو المجموعة.",
    "notif_preview_title": "معاينة الرسالة",
    "notif_preview_desc": "عرض محتوى الرسالة المستلمة.",
    "notif_sound_title": "صوت الإشعار",
    "notif_sound_desc": "السماح بتشغيل نغمة تنبيه للرسائل الجديدة.",
    "perm_heading": "الأذونات",
    "perm_desc": "حدد الأذونات التي يمكن منحها تلقائيًا لـ WhatsApp Web.",
    "perm_notice": "سيستمر طلب الأذونات المعطلة عند الحاجة.",
    "perm_btn_allow_all": "السماح للكل",
    "perm_btn_remove_all": "إزالة الكل",
    "perm_group_device": "الوصول إلى الجهاز",
    "perm_mic_title": "الميكروفون",
    "perm_mic_desc": "السماح تلقائيًا بالوصول إلى الميكروفون الخاص بك.",
    "perm_camera_title": "الكاميرا",
    "perm_camera_desc": "السماح تلقائيًا بالوصول إلى الكاميرا الخاصة بك.",
    "perm_location_title": "الموقع",
    "perm_location_desc": "السماح تلقائيًا بالوصول إلى موقعك الجغرافي.",
    "perm_group_share": "المشاركة",
    "perm_screen_title": "مشاركة الشاشة",
    "perm_screen_desc": "السماح تلقائيًا بمشاركة محتوى الشاشة.",
    "perm_screen_audio_title": "شاشة مع صوت",
    "perm_screen_audio_desc": "السماح تلقائيًا بمشاركة الشاشة مع الصوت.",
    "lang_en": "English",
    "lang_zh": "中文 (普通话)",
    "lang_hi": "हिन्दी",
    "lang_es": "Español",
    "lang_fr": "Français",
    "lang_ar": "العربية",
    "lang_bn": "বাংলা",
    "lang_pt": "Português",
    "lang_ru": "Русский",
    "lang_ur": "اردو",
    "lang_id": "Bahasa Indonesia",
    "lang_de": "Deutsch",
    "lang_ja": "日本語",
    "lang_mr": "मराठी",
    "lang_te": "తెలుగు",
    "lang_tr": "Türkçe",
    "lang_ta": "தமிழ்",
    "lang_yue": "粵語 (廣東話)",
    "lang_vi": "Tiếng Việt",
    "lang_fil": "Filipino",
    "lang_ko": "한국어",
    "lang_fa": "فارسی",
    "lang_ha": "Hausa",
    "lang_sw": "Kiswahili",
    "lang_it": "Italiano"
  },
  "bn": {
    "tooltip_back": "চ্যাটে ফিরে যান",
    "settings_subtitle": "গ্লোবাল পছন্দ এবং অ্যাকাউন্ট ব্যবস্থাপনা",
    "desc_accounts": "হোয়াটসঅ্যাপ অ্যাকাউন্টগুলি পরিচালনা করুন বা ডু নট ডিস্টার্ব চালু করুন।",
    "desc_appearance": "থিম এবং ইন্টারফেস ভাষা কাস্টমাইজ করুন।",
    "desc_notifications": "সিস্টেম বিজ্ঞপ্তির গোপনীয়তা নিয়ন্ত্রণ করুন।",
    "hint_theme": "আপনার পছন্দের রঙ চয়ন করুন",
    "hint_language": "ইন্টারফেস ভাষা নির্বাচন করুন",
    "tooltip_add_account": "অ্যাকাউন্ট যোগ করুন",
    "tooltip_report_bug": "বাগ রিপোর্ট করুন",
    "tooltip_settings": "সেটিংস",
    "welcome": "WhatsNexus-এ স্বাগতম",
    "welcome_desc": "শুরু করতে একটি অ্যাকাউন্ট নির্বাচন করুন বা একটি নতুন যোগ করুন।",
    "settings_title": "সেটিংস",
    "tab_accounts": "অ্যাকাউন্ট",
    "tab_appearance": "উপস্থিতি",
    "tab_notifications": "বিজ্ঞপ্তি",
    "tab_permissions": "অনুমতিসমূহ",
    "heading_accounts": "অ্যাকাউন্ট ব্যবস্থাপনা",
    "label_theme": "থিম",
    "theme_auto": "স্বয়ংক্রিয় (সিস্টেম)",
    "theme_light": "হালকা",
    "theme_dark": "গাঢ়",
    "label_language": "ভাষা",
    "label_privacy": "গোপনীয়তা প্রোফাইল",
    "privacy_broad": "বিস্তৃত",
    "privacy_broad_desc": "ছবি, নাম, বার্তার পূর্বরূপ এবং শব্দ।",
    "privacy_medium": "মাঝারি",
    "privacy_medium_desc": "ছবি, নাম, 'লুকানো বার্তা' এবং শব্দ।",
    "privacy_strict": "কঠোর",
    "privacy_strict_desc": "অ্যাপের আইকন, কোনো নাম নেই, নিঃশব্দ।",
    "tooltip_dnd": "ডু নট ডিস্টার্ব",
    "tooltip_delete": "অ্যাকাউন্ট মুছুন",
    "default_account_name": "অ্যাকাউন্ট",
    "hibernation_title": "অ্যাকাউন্ট হাইবারনেশনে আছে",
    "hibernation_desc": "র‍্যাম খালি করতে এই সেশনটি থামানো হয়েছে।",
    "wake_button": "জাগান",
    "btn_edit": "সম্পাদনা",
    "btn_delete": "মুছুন",
    "account_status_title": "অ্যাকাউন্টের স্থিতি",
    "account_status_desc": "নিষ্ক্রিয় অ্যাকাউন্টগুলি সংরক্ষিত থাকে তবে লোড হয় না।",
    "status_active": "সক্রিয়",
    "status_inactive": "নিষ্ক্রিয়",
    "dnd_title": "ডু নট ডিস্টার্ব",
    "dnd_desc": "এই অ্যাকাউন্টের জন্য বিজ্ঞপ্তি নিঃশব্দ করুন।",
    "untitled_account": "শিরোনামহীন অ্যাকাউন্ট",
    "card_theme_title": "থিম এবং ভিজ্যুয়াল শৈলী",
    "label_palette": "রঙের প্যালেট",
    "palette_whatsapp": "WhatsApp (পান্না)",
    "palette_messenger": "Messenger (মেটা নীল)",
    "palette_telegram": "Telegram (সায়ান নীল)",
    "palette_signal": "Signal (রয়্যাল নীল)",
    "palette_forest": "বন (জলপাই ও পৃথিবী)",
    "card_language_title": "ইন্টারফেস ভাষা",
    "card_tray_title": "সিস্টেম ট্রে (স্ট্যাটাস আইকন)",
    "hint_tray": "টাস্কবারে ট্রে আইকন উপস্থিতি কনফিগার করুন।",
    "label_tray_style": "ট্রে আইকন শৈলী",
    "tray_style_auto": "ডিফল্ট / ব্র্যান্ড",
    "tray_style_light": "হালকা (সাদা মনোক্রোম)",
    "tray_style_dark": "গাঢ় (কালো মনোক্রোম)",
    "label_tray_badge": "অপঠিত বার্তা কাউন্টার",
    "hint_tray_badge": "আইকনে সংখ্যাসূচক ব্যাজ দেখান",
    "heading_notifications_privacy": "বিজ্ঞপ্তি",
    "desc_notifications_privacy": "বিজ্ঞপ্তিতে কোন তথ্য প্রদর্শিত হতে পারে তা চয়ন করুন।",
    "label_privacy_preset": "গোপনীয়তা",
    "preset_broad": "বিস্তৃত",
    "preset_medium": "মাঝারি",
    "preset_strict": "কঠোর",
    "preset_custom": "কাস্টম",
    "notif_desktop_title": "ডেস্কটপ বিজ্ঞপ্তি",
    "notif_desktop_desc": "ডেস্কটপ সিস্টেম ব্যবহার করে হোয়াটসঅ্যাপ বিজ্ঞপ্তি প্রদর্শন করুন।",
    "notif_photo_title": "যোগাযোগের ছবি",
    "notif_photo_desc": "উপলব্ধ থাকলে প্রেরকের ছবি দেখান।",
    "notif_name_title": "যোগাযোগের নাম",
    "notif_name_desc": "প্রেরক বা গ্রুপের নাম প্রদর্শন করুন।",
    "notif_preview_title": "বার্তার পূর্বরূপ",
    "notif_preview_desc": "গৃহীত বার্তার সামগ্রী প্রদর্শন করুন।",
    "notif_sound_title": "বিজ্ঞপ্তির শব্দ",
    "notif_sound_desc": "নতুন বার্তার জন্য সতর্কতার শব্দ বাজানোর অনুমতি দিন।",
    "perm_heading": "অনুমতিসমূহ",
    "perm_desc": "হোয়াটসঅ্যাপ ওয়েবকে স্বয়ংক্রিয়ভাবে কোন অনুমতিগুলি দেওয়া যাবে তা নির্ধারণ করুন।",
    "perm_notice": "প্রয়োজনে নিষ্ক্রিয় অনুমতিগুলির জন্য এখনও অনুরোধ করা হবে।",
    "perm_btn_allow_all": "সব অনুমতি দিন",
    "perm_btn_remove_all": "সব সরান",
    "perm_group_device": "ডিভাইস অ্যাক্সেস",
    "perm_mic_title": "মাইক্রোফোন",
    "perm_mic_desc": "স্বয়ংক্রিয়ভাবে আপনার মাইক্রোফোনে অ্যাক্সেসের অনুমতি দিন।",
    "perm_camera_title": "ক্যামেরা",
    "perm_camera_desc": "স্বয়ংক্রিয়ভাবে আপনার ক্যামেরায় অ্যাক্সেসের অনুমতি দিন।",
    "perm_location_title": "অবস্থান",
    "perm_location_desc": "স্বয়ংক্রিয়ভাবে আপনার অবস্থান অ্যাক্সেসের অনুমতি দিন।",
    "perm_group_share": "শেয়ারিং",
    "perm_screen_title": "স্ক্রিন শেয়ারিং",
    "perm_screen_desc": "স্ক্রিন সামগ্রী শেয়ার করার স্বয়ংক্রিয় অনুমতি দিন।",
    "perm_screen_audio_title": "অডিও সহ স্ক্রিন",
    "perm_screen_audio_desc": "অডিও সহ স্ক্রিন শেয়ার করার স্বয়ংক্রিয় অনুমতি দিন।",
    "lang_en": "English",
    "lang_zh": "中文 (普通话)",
    "lang_hi": "हिन्दी",
    "lang_es": "Español",
    "lang_fr": "Français",
    "lang_ar": "العربية",
    "lang_bn": "বাংলা",
    "lang_pt": "Português",
    "lang_ru": "Русский",
    "lang_ur": "اردو",
    "lang_id": "Bahasa Indonesia",
    "lang_de": "Deutsch",
    "lang_ja": "日本語",
    "lang_mr": "मराठी",
    "lang_te": "తెలుగు",
    "lang_tr": "Türkçe",
    "lang_ta": "தமிழ்",
    "lang_yue": "粵語 (廣東話)",
    "lang_vi": "Tiếng Việt",
    "lang_fil": "Filipino",
    "lang_ko": "한국어",
    "lang_fa": "فارسی",
    "lang_ha": "Hausa",
    "lang_sw": "Kiswahili",
    "lang_it": "Italiano"
  },
  "pt": {
    "tooltip_back": "Voltar para as conversas",
    "settings_subtitle": "Preferências globais e gestão de contas",
    "desc_accounts": "Gerencie suas contas do WhatsApp, altere nomes ou ative o Não Perturbe.",
    "desc_appearance": "Personalize os temas visuais e o idioma da interface.",
    "desc_notifications": "Controle a privacidade de conteúdo nas notificações do sistema.",
    "hint_theme": "Escolha seu esquema de cores preferido",
    "hint_language": "Selecione o idioma da interface",
    "tooltip_add_account": "Adicionar Conta",
    "tooltip_report_bug": "Reportar Erro",
    "tooltip_settings": "Configurações",
    "welcome": "Bem-vindo ao WhatsNexus",
    "welcome_desc": "Selecione uma conta na barra lateral ou adicione uma nova para começar.",
    "settings_title": "Configurações",
    "tab_accounts": "Contas",
    "tab_appearance": "Aparência",
    "tab_notifications": "Notificações",
    "tab_permissions": "Permissões",
    "heading_accounts": "Gestão de Contas",
    "label_theme": "Tema",
    "theme_auto": "Automático (Sistema)",
    "theme_light": "Claro",
    "theme_dark": "Escuro",
    "label_language": "Idioma",
    "label_privacy": "Perfil de Privacidade",
    "privacy_broad": "Amplo",
    "privacy_broad_desc": "Foto, nome, pré-visualização de mensagem e som.",
    "privacy_medium": "Médio",
    "privacy_medium_desc": "Foto, nome, 'Mensagem oculta' e som.",
    "privacy_strict": "Estrito",
    "privacy_strict_desc": "Ícone do app, sem foto, mensagem oculta, sem som.",
    "tooltip_dnd": "Não Perturbe",
    "tooltip_delete": "Excluir Conta",
    "default_account_name": "Conta",
    "hibernation_title": "Conta em Hibernação",
    "hibernation_desc": "Esta sessão foi pausada para liberar memória RAM.",
    "wake_button": "Acordar",
    "btn_edit": "Editar",
    "btn_delete": "Excluir",
    "account_status_title": "Status da conta",
    "account_status_desc": "Contas desativadas permanecem salvas, mas não são carregadas nem recebem notificações.",
    "status_active": "Ativa",
    "status_inactive": "Desativada",
    "dnd_title": "Não perturbe",
    "dnd_desc": "Silenciar notificações para esta conta.",
    "untitled_account": "Conta sem nome",
    "card_theme_title": "Temas e Estilo Visual",
    "label_palette": "Paleta de Cores",
    "palette_whatsapp": "WhatsApp (Esmeralda)",
    "palette_messenger": "Messenger (Azul Meta)",
    "palette_telegram": "Telegram (Azul Ciano)",
    "palette_signal": "Signal (Azul Real)",
    "palette_forest": "Floresta (Oliva e Terra)",
    "card_language_title": "Idioma da Interface",
    "card_tray_title": "Bandeja do Sistema (Ícone de Status)",
    "hint_tray": "Configure o ícone na barra de tarefas do sistema.",
    "label_tray_style": "Estilo do Ícone da Bandeja",
    "tray_style_auto": "Padrão / Marca",
    "tray_style_light": "Claro (Branco monocromático)",
    "tray_style_dark": "Escuro (Preto monocromático)",
    "label_tray_badge": "Contador de mensagens não lidas",
    "hint_tray_badge": "Exibir indicador numérico no ícone",
    "heading_notifications_privacy": "Notificações",
    "desc_notifications_privacy": "Escolha quais informações podem aparecer nas notificações.",
    "label_privacy_preset": "Privacidade",
    "preset_broad": "Amplo",
    "preset_medium": "Médio",
    "preset_strict": "Estrito",
    "preset_custom": "Personalizado",
    "notif_desktop_title": "Notificações na área de trabalho",
    "notif_desktop_desc": "Exiba notificações do WhatsApp usando o sistema desktop.",
    "notif_photo_title": "Foto do contato",
    "notif_photo_desc": "Exibir foto do remetente quando disponível.",
    "notif_name_title": "Nome do contato",
    "notif_name_desc": "Exibir remetente ou nome do grupo.",
    "notif_preview_title": "Pré-visualização da mensagem",
    "notif_preview_desc": "Exibir o conteúdo da mensagem recebida.",
    "notif_sound_title": "Som de notificação",
    "notif_sound_desc": "Permitir que o sistema reproduza som de alerta para novas mensagens.",
    "perm_heading": "Permissões",
    "perm_desc": "Defina quais permissões podem ser concedidas automaticamente ao WhatsApp Web.",
    "perm_notice": "Permissões desativadas ainda serão solicitadas quando necessário.",
    "perm_btn_allow_all": "Permitir tudo",
    "perm_btn_remove_all": "Remover tudo",
    "perm_group_device": "Acesso ao dispositivo",
    "perm_mic_title": "microfone",
    "perm_mic_desc": "Permitir automaticamente o acesso ao seu microfone.",
    "perm_camera_title": "câmera",
    "perm_camera_desc": "Permitir automaticamente o acesso à sua câmera.",
    "perm_location_title": "Localização",
    "perm_location_desc": "Permitir automaticamente o acesso à sua localização.",
    "perm_group_share": "Compartilhar",
    "perm_screen_title": "Compartilhar tela",
    "perm_screen_desc": "Permitir automaticamente o compartilhamento de conteúdo da tela.",
    "perm_screen_audio_title": "Tela com áudio",
    "perm_screen_audio_desc": "Permitir automaticamente compartilhar tela com áudio.",
    "lang_en": "English",
    "lang_zh": "中文 (普通话)",
    "lang_hi": "हिन्दी",
    "lang_es": "Español",
    "lang_fr": "Français",
    "lang_ar": "العربية",
    "lang_bn": "বাংলা",
    "lang_pt": "Português",
    "lang_ru": "Русский",
    "lang_ur": "اردو",
    "lang_id": "Bahasa Indonesia",
    "lang_de": "Deutsch",
    "lang_ja": "日本語",
    "lang_mr": "मराठी",
    "lang_te": "తెలుగు",
    "lang_tr": "Türkçe",
    "lang_ta": "தமிழ்",
    "lang_yue": "粵語 (廣東話)",
    "lang_vi": "Tiếng Việt",
    "lang_fil": "Filipino",
    "lang_ko": "한국어",
    "lang_fa": "فارسی",
    "lang_ha": "Hausa",
    "lang_sw": "Kiswahili",
    "lang_it": "Italiano"
  },
  "ru": {
    "tooltip_back": "Назад к чатам",
    "settings_subtitle": "Глобальные настройки и управление учетными записями",
    "desc_accounts": "Управляйте учетными записями WhatsApp или включите 'Не беспокоить'.",
    "desc_appearance": "Настройте тему оформления и язык интерфейса.",
    "desc_notifications": "Управляйте конфиденциальностью уведомлений системы.",
    "hint_theme": "Выберите цветовую схему",
    "hint_language": "Выберите язык интерфейса",
    "tooltip_add_account": "Добавить аккаунт",
    "tooltip_report_bug": "Сообщить об ошибке",
    "tooltip_settings": "Настройки",
    "welcome": "Добро пожаловать в WhatsNexus",
    "welcome_desc": "Выберите аккаунт на боковой панели или добавьте новый.",
    "settings_title": "Настройки",
    "tab_accounts": "Аккаунты",
    "tab_appearance": "Внешний вид",
    "tab_notifications": "Уведомления",
    "tab_permissions": "Разрешения",
    "heading_accounts": "Управление аккаунтами",
    "label_theme": "Тема",
    "theme_auto": "Авто (Системная)",
    "theme_light": "Светлая",
    "theme_dark": "Темная",
    "label_language": "Язык",
    "label_privacy": "Профиль приватности",
    "privacy_broad": "Широкий",
    "privacy_broad_desc": "Фото, имя, предпросмотр сообщения и звук.",
    "privacy_medium": "Средний",
    "privacy_medium_desc": "Фото, имя, 'Скрытое сообщение' и звук.",
    "privacy_strict": "Строгий",
    "privacy_strict_desc": "Иконка приложения, без имени и фото, без звука.",
    "tooltip_dnd": "Не беспокоить",
    "tooltip_delete": "Удалить аккаунт",
    "default_account_name": "Аккаунт",
    "hibernation_title": "Аккаунт в гибернации",
    "hibernation_desc": "Сессия приостановлена для экономии оперативной памяти.",
    "wake_button": "Разбудить",
    "btn_edit": "Редактировать",
    "btn_delete": "Удалить",
    "account_status_title": "Статус аккаунта",
    "account_status_desc": "Отключенные аккаунты сохранены, но не загружаются.",
    "status_active": "Активен",
    "status_inactive": "Отключен",
    "dnd_title": "Не беспокоить",
    "dnd_desc": "Отключить уведомления для этого аккаунта.",
    "untitled_account": "Аккаунт без названия",
    "card_theme_title": "Темы и визуальный стиль",
    "label_palette": "Цветовая палитра",
    "palette_whatsapp": "WhatsApp (Изумрудный)",
    "palette_messenger": "Messenger (Синий Meta)",
    "palette_telegram": "Telegram (Голубой циановый)",
    "palette_signal": "Signal (Королевский синий)",
    "palette_forest": "Лес (Оливковый и земляной)",
    "card_language_title": "Язык интерфейса",
    "card_tray_title": "Системный трей (Значок состояния)",
    "hint_tray": "Настройте отображение значка на панели задач.",
    "label_tray_style": "Стиль значка в трее",
    "tray_style_auto": "По умолчанию / Фирменный",
    "tray_style_light": "Светлый (Белый монохром)",
    "tray_style_dark": "Темный (Черный монохром)",
    "label_tray_badge": "Счетчик непрочитанных",
    "hint_tray_badge": "Показывать числовой бейдж на значке",
    "heading_notifications_privacy": "Уведомления",
    "desc_notifications_privacy": "Выберите, какая информация может отображаться в уведомлениях.",
    "label_privacy_preset": "Приватность",
    "preset_broad": "Полный",
    "preset_medium": "Средний",
    "preset_strict": "Строгий",
    "preset_custom": "Пользовательский",
    "notif_desktop_title": "Уведомления на рабочем столе",
    "notif_desktop_desc": "Показывать уведомления WhatsApp через системную службу.",
    "notif_photo_title": "Фото контакта",
    "notif_photo_desc": "Показывать фото отправителя, если доступно.",
    "notif_name_title": "Имя контакта",
    "notif_name_desc": "Показывать имя отправителя или группы.",
    "notif_preview_title": "Предпросмотр сообщения",
    "notif_preview_desc": "Показывать содержимое полученного сообщения.",
    "notif_sound_title": "Звук уведомления",
    "notif_sound_desc": "Воспроизводить звуковой сигнал для новых сообщений.",
    "perm_heading": "Разрешения",
    "perm_desc": "Определите, какие разрешения могут быть автоматически предоставлены WhatsApp Web.",
    "perm_notice": "Отключенные разрешения будут запрашиваться по мере необходимости.",
    "perm_btn_allow_all": "Разрешить все",
    "perm_btn_remove_all": "Запретить все",
    "perm_group_device": "Доступ к устройству",
    "perm_mic_title": "микрофон",
    "perm_mic_desc": "Автоматически разрешать доступ к микрофону.",
    "perm_camera_title": "камера",
    "perm_camera_desc": "Автоматически разрешать доступ к камере.",
    "perm_location_title": "Геолокация",
    "perm_location_desc": "Автоматически разрешать доступ к вашему местоположению.",
    "perm_group_share": "Демонстрация",
    "perm_screen_title": "Демонстрация экрана",
    "perm_screen_desc": "Автоматически разрешать демонстрацию содержимого экрана.",
    "perm_screen_audio_title": "Экран со звуком",
    "perm_screen_audio_desc": "Автоматически разрешать демонстрацию экрана со звуком.",
    "lang_en": "English",
    "lang_zh": "中文 (普通话)",
    "lang_hi": "हिन्दी",
    "lang_es": "Español",
    "lang_fr": "Français",
    "lang_ar": "العربية",
    "lang_bn": "বাংলা",
    "lang_pt": "Português",
    "lang_ru": "Русский",
    "lang_ur": "اردو",
    "lang_id": "Bahasa Indonesia",
    "lang_de": "Deutsch",
    "lang_ja": "日本語",
    "lang_mr": "मराठी",
    "lang_te": "తెలుగు",
    "lang_tr": "Türkçe",
    "lang_ta": "தமிழ்",
    "lang_yue": "粵語 (廣東話)",
    "lang_vi": "Tiếng Việt",
    "lang_fil": "Filipino",
    "lang_ko": "한국어",
    "lang_fa": "فارسی",
    "lang_ha": "Hausa",
    "lang_sw": "Kiswahili",
    "lang_it": "Italiano"
  },
  "ur": {
    "tooltip_back": "چیٹس پر واپس جائیں",
    "settings_subtitle": "عالمی ترجیحات اور اکاؤنٹ کا انتظام",
    "desc_accounts": "اپنے واٹس ایپ اکاؤنٹس کا نظم کریں یا ڈو ناٹ ڈسٹرب کو فعال کریں۔",
    "desc_appearance": "بصری تھیم اور انٹرفیس کی زبان تبدیل کریں۔",
    "desc_notifications": "سسٹم اطلاعات کی رازداری کو کنٹرول کریں۔",
    "hint_theme": "اپنی پسندیدہ رنگین اسکیم منتخب کریں",
    "hint_language": "انٹرفیس کی زبان منتخب کریں",
    "tooltip_add_account": "اکاؤنٹ شامل کریں",
    "tooltip_report_bug": "بگ رپورٹ کریں",
    "tooltip_settings": "ترتیبات",
    "welcome": "WhatsNexus میں خوش آمدید",
    "welcome_desc": "شروع کرنے کے لیے سائیڈ بار میں کوئی اکاؤنٹ منتخب کریں یا نیا شامل کریں۔",
    "settings_title": "ترتیبات",
    "tab_accounts": "اکاؤنٹس",
    "tab_appearance": "ظاہری شکل",
    "tab_notifications": "اطلاعات",
    "tab_permissions": "اجازتیں",
    "heading_accounts": "اکاؤنٹ کا انتظام",
    "label_theme": "تھیم",
    "theme_auto": "خودکار (سسٹم)",
    "theme_light": "ہلکا",
    "theme_dark": "تاریک",
    "label_language": "زبان",
    "label_privacy": "رازداری کا پروفائل",
    "privacy_broad": "وسیع",
    "privacy_broad_desc": "تصویر، نام، پیغام کا پیش نظارہ اور آواز۔",
    "privacy_medium": "درمیانہ",
    "privacy_medium_desc": "تصویر، نام، 'پوشیدہ پیغام' اور آواز۔",
    "privacy_strict": "سخت",
    "privacy_strict_desc": "ایپ آئیکن، کوئی نام نہیں، کوئی آواز نہیں۔",
    "tooltip_dnd": "ڈو ناٹ ڈسٹرب",
    "tooltip_delete": "اکاؤنٹ حذف کریں",
    "default_account_name": "اکاؤنٹ",
    "hibernation_title": "اکاؤنٹ ہائبرنیشن میں ہے",
    "hibernation_desc": "ریم خالی کرنے کے لیے یہ سیشن معطل کر دیا گیا ہے۔",
    "wake_button": "جاگیں",
    "btn_edit": "ترمیم",
    "btn_delete": "حذف کریں",
    "account_status_title": "اکاؤنٹ کی حیثیت",
    "account_status_desc": "غیر فعال اکاؤنٹس محفوظ رہتے ہیں لیکن لوڈ نہیں ہوتے۔",
    "status_active": "فعال",
    "status_inactive": "غیر فعال",
    "dnd_title": "ڈو ناٹ ڈسٹرب",
    "dnd_desc": "اس اکاؤنٹ کے لیے اطلاعات خاموش کریں۔",
    "untitled_account": "بے نام اکاؤنٹ",
    "card_theme_title": "تھیمز اور بصری انداز",
    "label_palette": "رنگوں کا پیلیٹ",
    "palette_whatsapp": "WhatsApp (زمردی)",
    "palette_messenger": "Messenger (میٹا نیلا)",
    "palette_telegram": "Telegram (نیلا)",
    "palette_signal": "Signal (شاہی نیلا)",
    "palette_forest": "جنگل (زیتون اور مٹی)",
    "card_language_title": "انٹرفیس کی زبان",
    "card_tray_title": "سسٹم ٹرے (اسٹیٹس آئیکن)",
    "hint_tray": "ٹاسک بار میں ٹرے آئیکن کا انداز ترتیب دیں۔",
    "label_tray_style": "ٹرے آئیکن کا انداز",
    "tray_style_auto": "پہلے سے طے شدہ / برانڈ",
    "tray_style_light": "ہلکا (سفید)",
    "tray_style_dark": "تاریک (سیاہ)",
    "label_tray_badge": "غیر پڑھے ہوئے پیغامات کا کاؤنٹر",
    "hint_tray_badge": "آئیکن پر عددی بیج دکھائیں",
    "heading_notifications_privacy": "اطلاعات",
    "desc_notifications_privacy": "منتخب کریں کہ اطلاعات میں کون سی معلومات ظاہر ہو سکتی ہیں۔",
    "label_privacy_preset": "رازداری",
    "preset_broad": "وسیع",
    "preset_medium": "درمیانہ",
    "preset_strict": "سخت",
    "preset_custom": "اپنی مرضی کے مطابق",
    "notif_desktop_title": "ڈیسک ٹاپ اطلاعات",
    "notif_desktop_desc": "ڈیسک ٹاپ سسٹم کے ذریعے اطلاعات دکھائیں۔",
    "notif_photo_title": "رابطے کی تصویر",
    "notif_photo_desc": "دستیاب ہونے پر مرسل کی تصویر دکھائیں۔",
    "notif_name_title": "رابطے کا نام",
    "notif_name_desc": "مرسل یا گروپ کا نام دکھائیں۔",
    "notif_preview_title": "پیغام کا پیش نظارہ",
    "notif_preview_desc": "موصول ہونے والے پیغام کا مواد دکھائیں۔",
    "notif_sound_title": "اطلاع کی آواز",
    "notif_sound_desc": "نئے پیغامات کے لیے الرٹ آواز بجانے کی اجازت دیں۔",
    "perm_heading": "اجازتیں",
    "perm_desc": "متعین کریں کہ واٹس ایپ ویب کو کون سی اجازتیں خودکار طور پر دی جا سکتی ہیں۔",
    "perm_notice": "غیر فعال کردہ اجازتوں کی ضرورت پڑنے پر اب بھی درخواست کی جائے گی۔",
    "perm_btn_allow_all": "سب کی اجازت دیں",
    "perm_btn_remove_all": "سب ہٹائیں",
    "perm_group_device": "ڈیوائس تک رسائی",
    "perm_mic_title": "مائیکروفون",
    "perm_mic_desc": "اپنے مائیکروفون تک رسائی کی خودکار اجازت دیں۔",
    "perm_camera_title": "کیمرہ",
    "perm_camera_desc": "اپنے کیمرے تک رسائی کی خودکار اجازت دیں۔",
    "perm_location_title": "مقام",
    "perm_location_desc": "اپنے مقام تک رسائی کی خودکار اجازت دیں۔",
    "perm_group_share": "شیئرنگ",
    "perm_screen_title": "اسکرین شیئرنگ",
    "perm_screen_desc": "اسکرین کا مواد شیئر کرنے کی خودکار اجازت دیں۔",
    "perm_screen_audio_title": "آڈیو کے ساتھ اسکرین",
    "perm_screen_audio_desc": "آڈیو کے ساتھ اسکرین شیئر کرنے کی خودکار اجازت دیں۔",
    "lang_en": "English",
    "lang_zh": "中文 (普通话)",
    "lang_hi": "हिन्दी",
    "lang_es": "Español",
    "lang_fr": "Français",
    "lang_ar": "العربية",
    "lang_bn": "বাংলা",
    "lang_pt": "Português",
    "lang_ru": "Русский",
    "lang_ur": "اردو",
    "lang_id": "Bahasa Indonesia",
    "lang_de": "Deutsch",
    "lang_ja": "日本語",
    "lang_mr": "मराठी",
    "lang_te": "తెలుగు",
    "lang_tr": "Türkçe",
    "lang_ta": "தமிழ்",
    "lang_yue": "粵語 (廣東話)",
    "lang_vi": "Tiếng Việt",
    "lang_fil": "Filipino",
    "lang_ko": "한국어",
    "lang_fa": "فارسی",
    "lang_ha": "Hausa",
    "lang_sw": "Kiswahili",
    "lang_it": "Italiano"
  },
  "id": {
    "tooltip_back": "Kembali ke obrolan",
    "settings_subtitle": "Preferensi global dan manajemen akun",
    "desc_accounts": "Kelola akun WhatsApp Anda dan mode Jangan Ganggu.",
    "desc_appearance": "Sesuaikan tema dan bahasa antarmuka.",
    "desc_notifications": "Kontrol privasi notifikasi sistem.",
    "hint_theme": "Pilih skema warna",
    "hint_language": "Pilih bahasa antarmuka",
    "tooltip_add_account": "Tambah Akun",
    "tooltip_report_bug": "Laporkan Bug",
    "tooltip_settings": "Pengaturan",
    "welcome": "Selamat datang di WhatsNexus",
    "welcome_desc": "Pilih akun atau tambahkan yang baru.",
    "settings_title": "Pengaturan",
    "tab_accounts": "Akun",
    "tab_appearance": "Tampilan",
    "tab_notifications": "Notifikasi",
    "tab_permissions": "Izin",
    "heading_accounts": "Manajemen Akun",
    "label_theme": "Tema",
    "theme_auto": "Otomatis (Sistem)",
    "theme_light": "Terang",
    "theme_dark": "Gelap",
    "label_language": "Bahasa",
    "label_privacy": "Profil Privasi",
    "privacy_broad": "Luas",
    "privacy_broad_desc": "Foto, nama, pratinjau pesan, dan suara.",
    "privacy_medium": "Sedang",
    "privacy_medium_desc": "Foto, nama, 'Pesan tersembunyi', dan suara.",
    "privacy_strict": "Ketat",
    "privacy_strict_desc": "Ikon aplikasi, tanpa foto, pesan disembunyikan, tanpa suara.",
    "tooltip_dnd": "Jangan Ganggu",
    "tooltip_delete": "Hapus Akun",
    "default_account_name": "Akun",
    "hibernation_title": "Akun dalam Hibernasi",
    "hibernation_desc": "Sesi ini telah dijeda untuk membebaskan RAM.",
    "wake_button": "Bangunkan",
    "btn_edit": "Edit",
    "btn_delete": "Hapus",
    "account_status_title": "Status akun",
    "account_status_desc": "Akun nonaktif tetap tersimpan, tetapi tidak dimuat.",
    "status_active": "Aktif",
    "status_inactive": "Nonaktif",
    "dnd_title": "Jangan ganggu",
    "dnd_desc": "Bisukan notifikasi untuk akun ini.",
    "untitled_account": "Akun tanpa nama",
    "card_theme_title": "Tema & Gaya Visual",
    "label_palette": "Palet Warna",
    "palette_whatsapp": "WhatsApp (Zamrud)",
    "palette_messenger": "Messenger (Biru Meta)",
    "palette_telegram": "Telegram (Biru Sian)",
    "palette_signal": "Signal (Biru Royal)",
    "palette_forest": "Hutan (Zaitun & Tanah)",
    "card_language_title": "Bahasa Antarmuka",
    "card_tray_title": "Baki Sistem (Ikon Status)",
    "hint_tray": "Konfigurasikan ikon di bilah tugas sistem.",
    "label_tray_style": "Gaya Ikon Baki",
    "tray_style_auto": "Standar / Merek",
    "tray_style_light": "Terang (Putih monokrom)",
    "tray_style_dark": "Gelap (Hitam monokrom)",
    "label_tray_badge": "Penghitung pesan belum dibaca",
    "hint_tray_badge": "Tampilkan lencana numerik pada ikon",
    "heading_notifications_privacy": "Notifikasi",
    "desc_notifications_privacy": "Pilih informasi yang dapat muncul di notifikasi.",
    "label_privacy_preset": "Privasi",
    "preset_broad": "Luas",
    "preset_medium": "Sedang",
    "preset_strict": "Ketat",
    "preset_custom": "Kustom",
    "notif_desktop_title": "Notifikasi desktop",
    "notif_desktop_desc": "Tampilkan notifikasi WhatsApp menggunakan sistem desktop.",
    "notif_photo_title": "Foto kontak",
    "notif_photo_desc": "Tampilkan foto pengirim bila tersedia.",
    "notif_name_title": "Nama kontak",
    "notif_name_desc": "Tampilkan pengirim atau nama grup.",
    "notif_preview_title": "Pratinjau pesan",
    "notif_preview_desc": "Tampilkan isi pesan yang diterima.",
    "notif_sound_title": "Suara notifikasi",
    "notif_sound_desc": "Izinkan sistem memutar suara peringatan untuk pesan baru.",
    "perm_heading": "Izin",
    "perm_desc": "Tentukan izin apa yang dapat diberikan secara otomatis ke WhatsApp Web.",
    "perm_notice": "Izin yang dinonaktifkan akan tetap diminta saat diperlukan.",
    "perm_btn_allow_all": "Izinkan semua",
    "perm_btn_remove_all": "Hapus semua",
    "perm_group_device": "Akses perangkat",
    "perm_mic_title": "mikrofon",
    "perm_mic_desc": "Izinkan akses otomatis ke mikrofon Anda.",
    "perm_camera_title": "kamera",
    "perm_camera_desc": "Izinkan akses otomatis ke kamera Anda.",
    "perm_location_title": "Lokasi",
    "perm_location_desc": "Izinkan akses otomatis ke lokasi Anda.",
    "perm_group_share": "Berbagi",
    "perm_screen_title": "Berbagi layar",
    "perm_screen_desc": "Izinkan berbagi konten layar secara otomatis.",
    "perm_screen_audio_title": "Layar dengan audio",
    "perm_screen_audio_desc": "Izinkan berbagi layar dengan audio secara otomatis.",
    "lang_en": "English",
    "lang_zh": "中文 (普通话)",
    "lang_hi": "हिन्दी",
    "lang_es": "Español",
    "lang_fr": "Français",
    "lang_ar": "العربية",
    "lang_bn": "বাংলা",
    "lang_pt": "Português",
    "lang_ru": "Русский",
    "lang_ur": "اردو",
    "lang_id": "Bahasa Indonesia",
    "lang_de": "Deutsch",
    "lang_ja": "日本語",
    "lang_mr": "मराठी",
    "lang_te": "తెలుగు",
    "lang_tr": "Türkçe",
    "lang_ta": "தமிழ்",
    "lang_yue": "粵語 (廣東話)",
    "lang_vi": "Tiếng Việt",
    "lang_fil": "Filipino",
    "lang_ko": "한국어",
    "lang_fa": "فارسی",
    "lang_ha": "Hausa",
    "lang_sw": "Kiswahili",
    "lang_it": "Italiano"
  },
  "de": {
    "tooltip_back": "Zurück zu Chats",
    "settings_subtitle": "Globale Einstellungen & Kontoverwaltung",
    "desc_accounts": "Verwalten Sie Ihre WhatsApp-Konten und den Nicht-stören-Modus.",
    "desc_appearance": "Passen Sie das Erscheinungsbild und die Sprache an.",
    "desc_notifications": "Steuern Sie die Privatsphäre von Systembenachrichtigungen.",
    "hint_theme": "Wählen Sie Ihr bevorzugtes Farbschema",
    "hint_language": "Wählen Sie die Benutzeroberflächensprache",
    "tooltip_add_account": "Konto hinzufügen",
    "tooltip_report_bug": "Fehler melden",
    "tooltip_settings": "Einstellungen",
    "welcome": "Willkommen bei WhatsNexus",
    "welcome_desc": "Wählen Sie ein Konto in der Seitenleiste aus oder fügen Sie ein neues hinzu.",
    "settings_title": "Einstellungen",
    "tab_accounts": "Konten",
    "tab_appearance": "Erscheinungsbild",
    "tab_notifications": "Benachrichtigungen",
    "tab_permissions": "Berechtigungen",
    "heading_accounts": "Kontoverwaltung",
    "label_theme": "Design",
    "theme_auto": "Automatisch (System)",
    "theme_light": "Hell",
    "theme_dark": "Dunkel",
    "label_language": "Sprache",
    "label_privacy": "Datenschutzprofil",
    "privacy_broad": "Ausführlich",
    "privacy_broad_desc": "Foto, Name, Nachrichtenvorschau und Ton.",
    "privacy_medium": "Mittel",
    "privacy_medium_desc": "Foto, Name, 'Verborgene Nachricht' und Ton.",
    "privacy_strict": "Streng",
    "privacy_strict_desc": "App-Symbol, keine Details, lautlos.",
    "tooltip_dnd": "Nicht stören",
    "tooltip_delete": "Konto löschen",
    "default_account_name": "Konto",
    "hibernation_title": "Konto im Ruhezustand",
    "hibernation_desc": "Diese Sitzung wurde pausiert, um RAM freizugeben.",
    "wake_button": "Aufwecken",
    "btn_edit": "Bearbeiten",
    "btn_delete": "Löschen",
    "account_status_title": "Kontostatus",
    "account_status_desc": "Deaktivierte Konten bleiben gespeichert, empfangen aber keine Benachrichtigungen.",
    "status_active": "Aktiv",
    "status_inactive": "Deaktiviert",
    "dnd_title": "Nicht stören",
    "dnd_desc": "Benachrichtigungen für dieses Konto stummschalten.",
    "untitled_account": "Unbenanntes Konto",
    "card_theme_title": "Designs & Farbstile",
    "label_palette": "Farbpalette",
    "palette_whatsapp": "WhatsApp (Smaragd)",
    "palette_messenger": "Messenger (Meta-Blau)",
    "palette_telegram": "Telegram (Cyan-Blau)",
    "palette_signal": "Signal (Königsblau)",
    "palette_forest": "Wald (Olive & Erde)",
    "card_language_title": "Sprache der Benutzeroberfläche",
    "card_tray_title": "System-Tray (Status-Symbol)",
    "hint_tray": "Konfigurieren Sie das Symbol in der Taskleiste.",
    "label_tray_style": "Symbol-Stil im Tray",
    "tray_style_auto": "Standard / Marke",
    "tray_style_light": "Hell (Weiß)",
    "tray_style_dark": "Dunkel (Schwarz)",
    "label_tray_badge": "Zähler für ungelesene Nachrichten",
    "hint_tray_badge": "Numerischen Zähler am Symbol anzeigen",
    "heading_notifications_privacy": "Benachrichtigungen",
    "desc_notifications_privacy": "Legen Sie fest, welche Informationen angezeigt werden dürfen.",
    "label_privacy_preset": "Privatsphäre",
    "preset_broad": "Breit",
    "preset_medium": "Mittel",
    "preset_strict": "Streng",
    "preset_custom": "Benutzerdefiniert",
    "notif_desktop_title": "Desktop-Benachrichtigungen",
    "notif_desktop_desc": "WhatsApp-Benachrichtigungen über das Desktop-System anzeigen.",
    "notif_photo_title": "Kontaktfoto",
    "notif_photo_desc": "Foto des Absenders anzeigen, falls verfügbar.",
    "notif_name_title": "Kontaktname",
    "notif_name_desc": "Absender- oder Gruppennamen anzeigen.",
    "notif_preview_title": "Nachrichtenvorschau",
    "notif_preview_desc": "Inhalt der empfangenen Nachricht anzeigen.",
    "notif_sound_title": "Benachrichtigungston",
    "notif_sound_desc": "Warnton bei neuen Nachrichten abspielen.",
    "perm_heading": "Berechtigungen",
    "perm_desc": "Legen Sie fest, welche Berechtigungen WhatsApp Web automatisch erteilt werden können.",
    "perm_notice": "Deaktivierte Berechtigungen werden bei Bedarf weiterhin angefragt.",
    "perm_btn_allow_all": "Alle erlauben",
    "perm_btn_remove_all": "Alle entfernen",
    "perm_group_device": "Gerätezugriff",
    "perm_mic_title": "Mikrofon",
    "perm_mic_desc": "Automatisch Zugriff auf Ihr Mikrofon erlauben.",
    "perm_camera_title": "Kamera",
    "perm_camera_desc": "Automatisch Zugriff auf Ihre Kamera erlauben.",
    "perm_location_title": "Standort",
    "perm_location_desc": "Automatisch Zugriff auf Ihren Standort erlauben.",
    "perm_group_share": "Freigabe",
    "perm_screen_title": "Bildschirmfreigabe",
    "perm_screen_desc": "Automatisch Freigabe von Bildschirminhalten erlauben.",
    "perm_screen_audio_title": "Bildschirm mit Ton",
    "perm_screen_audio_desc": "Automatisch Bildschirmfreigabe mit Ton erlauben.",
    "lang_en": "English",
    "lang_zh": "中文 (普通话)",
    "lang_hi": "हिन्दी",
    "lang_es": "Español",
    "lang_fr": "Français",
    "lang_ar": "العربية",
    "lang_bn": "বাংলা",
    "lang_pt": "Português",
    "lang_ru": "Русский",
    "lang_ur": "اردو",
    "lang_id": "Bahasa Indonesia",
    "lang_de": "Deutsch",
    "lang_ja": "日本語",
    "lang_mr": "मराठी",
    "lang_te": "తెలుగు",
    "lang_tr": "Türkçe",
    "lang_ta": "தமிழ்",
    "lang_yue": "粵語 (廣東話)",
    "lang_vi": "Tiếng Việt",
    "lang_fil": "Filipino",
    "lang_ko": "한국어",
    "lang_fa": "فارسی",
    "lang_ha": "Hausa",
    "lang_sw": "Kiswahili",
    "lang_it": "Italiano"
  },
  "ja": {
    "tooltip_back": "チャットに戻る",
    "settings_subtitle": "全体設定とアカウント管理",
    "desc_accounts": "WhatsAppアカウントの管理、名前の変更、おやすみモードの設定。",
    "desc_appearance": "外観テーマと表示言語のカスタマイズ。",
    "desc_notifications": "システム通知のコンテンツプライバシー管理。",
    "hint_theme": "お好みのカラーテーマを選択",
    "hint_language": "インターフェース言語を選択",
    "tooltip_add_account": "アカウントを追加",
    "tooltip_report_bug": "問題を報告",
    "tooltip_settings": "設定",
    "welcome": "WhatsNexus へようこそ",
    "welcome_desc": "サイドバーでアカウントを選択するか、新しく追加して開始します。",
    "settings_title": "設定",
    "tab_accounts": "アカウント",
    "tab_appearance": "外観",
    "tab_notifications": "通知",
    "tab_permissions": "権限",
    "heading_accounts": "アカウント管理",
    "label_theme": "テーマ",
    "theme_auto": "自動（システム準拠）",
    "theme_light": "ライト",
    "theme_dark": "ダーク",
    "label_language": "言語",
    "label_privacy": "プライバシー設定",
    "privacy_broad": "詳細表示",
    "privacy_broad_desc": "写真、名前、メッセージプレビュー、サウンドを表示。",
    "privacy_medium": "標準",
    "privacy_medium_desc": "写真、名前、非表示メッセージ、サウンドを表示。",
    "privacy_strict": "厳格",
    "privacy_strict_desc": "アプリアイコンのみ、非表示、消音。",
    "tooltip_dnd": "おやすみモード",
    "tooltip_delete": "アカウントを削除",
    "default_account_name": "アカウント",
    "hibernation_title": "休止中のアカウント",
    "hibernation_desc": "メモリ節約のためこのセッションは一時停止しています。",
    "wake_button": "再開する",
    "btn_edit": "編集",
    "btn_delete": "削除",
    "account_status_title": "アカウントの状態",
    "account_status_desc": "無効化されたアカウントは保存されますが、通知は受信しません。",
    "status_active": "有効",
    "status_inactive": "無効",
    "dnd_title": "おやすみモード",
    "dnd_desc": "このアカウントの通知をミュートします。",
    "untitled_account": "名称未設定のアカウント",
    "card_theme_title": "テーマとビジュアルスタイル",
    "label_palette": "カラーパレット",
    "palette_whatsapp": "WhatsApp（エメラルド）",
    "palette_messenger": "Messenger（Metaブルー）",
    "palette_telegram": "Telegram（シアンブルー）",
    "palette_signal": "Signal（ロイヤルブルー）",
    "palette_forest": "フォレスト（オリーブ＆アース）",
    "card_language_title": "インターフェース言語",
    "card_tray_title": "システムトレイ（ステータスアイコン）",
    "hint_tray": "タスクバーのトレイアイコンの表示とスタイルを設定します。",
    "label_tray_style": "トレイアイコンスタイル",
    "tray_style_auto": "デフォルト / ブランド",
    "tray_style_light": "ライト（モノクロ白）",
    "tray_style_dark": "ダーク（モノクロ黒）",
    "label_tray_badge": "未読メッセージカウンター",
    "hint_tray_badge": "アイコンに未読バッジを表示",
    "heading_notifications_privacy": "通知設定",
    "desc_notifications_privacy": "通知に表示する情報を選択します。",
    "label_privacy_preset": "プライバシー",
    "preset_broad": "詳細",
    "preset_medium": "標準",
    "preset_strict": "厳格",
    "preset_custom": "カスタム",
    "notif_desktop_title": "デスクトップ通知",
    "notif_desktop_desc": "デスクトップ通知システムを使用してWhatsAppの通知を表示します。",
    "notif_photo_title": "連絡先の写真",
    "notif_photo_desc": "利用可能な場合、送信者の写真を表示します。",
    "notif_name_title": "連絡先の名前",
    "notif_name_desc": "送信者またはグループ名を表示します。",
    "notif_preview_title": "メッセージのプレビュー",
    "notif_preview_desc": "受信したメッセージの内容を表示します。",
    "notif_sound_title": "通知音",
    "notif_sound_desc": "新しいメッセージの通知音を鳴らします。",
    "perm_heading": "権限管理",
    "perm_desc": "WhatsApp Webに自動的に付与できる権限を設定します。",
    "perm_notice": "無効な権限は必要に応じて確認ダイアログが表示されます。",
    "perm_btn_allow_all": "すべて許可",
    "perm_btn_remove_all": "すべて削除",
    "perm_group_device": "デバイスアクセス",
    "perm_mic_title": "マイク",
    "perm_mic_desc": "マイクへのアクセスを自動的に許可します。",
    "perm_camera_title": "カメラ",
    "perm_camera_desc": "カメラへのアクセスを自動的に許可します。",
    "perm_location_title": "位置情報",
    "perm_location_desc": "位置情報へのアクセスを自動的に許可します。",
    "perm_group_share": "共有",
    "perm_screen_title": "画面共有",
    "perm_screen_desc": "画面コンテンツの共有を自動的に許可します。",
    "perm_screen_audio_title": "音声付き画面共有",
    "perm_screen_audio_desc": "音声付きの画面共有を自動的に許可します。",
    "lang_en": "English",
    "lang_zh": "中文 (普通话)",
    "lang_hi": "हिन्दी",
    "lang_es": "Español",
    "lang_fr": "Français",
    "lang_ar": "العربية",
    "lang_bn": "বাংলা",
    "lang_pt": "Português",
    "lang_ru": "Русский",
    "lang_ur": "اردو",
    "lang_id": "Bahasa Indonesia",
    "lang_de": "Deutsch",
    "lang_ja": "日本語",
    "lang_mr": "मराठी",
    "lang_te": "తెలుగు",
    "lang_tr": "Türkçe",
    "lang_ta": "தமிழ்",
    "lang_yue": "粵語 (廣東話)",
    "lang_vi": "Tiếng Việt",
    "lang_fil": "Filipino",
    "lang_ko": "한국어",
    "lang_fa": "فارسی",
    "lang_ha": "Hausa",
    "lang_sw": "Kiswahili",
    "lang_it": "Italiano"
  },
  "mr": {
    "tooltip_back": "चॅट्सवर परत जा",
    "settings_subtitle": "वैश्विक प्राधान्ये आणि खाते व्यवस्थापन",
    "desc_accounts": "तुमची WhatsApp खाती व्यवस्थापित करा आणि डू नॉट डिस्टर्ब सुरू करा.",
    "desc_appearance": "थीम आणि भाषा बदला.",
    "desc_notifications": "सूचना गोपनीयता नियंत्रित करा.",
    "hint_theme": "तुमची पसंतीची रंगसंगती निवडा",
    "hint_language": "इंटरफेस भाषा निवडा",
    "tooltip_add_account": "खाते जोडा",
    "tooltip_report_bug": "समस्या नोंदवा",
    "tooltip_settings": "सेटिंग्ज",
    "welcome": "WhatsNexus मध्ये स्वागत आहे",
    "welcome_desc": "सुरू करण्यासाठी साइडबारमधून खाते निवडा किंवा नवीन जोडा.",
    "settings_title": "सेटिंग्ज",
    "tab_accounts": "खाती",
    "tab_appearance": "देखावा",
    "tab_notifications": "सूचना",
    "tab_permissions": "परवानग्या",
    "heading_accounts": "खाते व्यवस्थापन",
    "label_theme": "थीम",
    "theme_auto": "स्वयंचलित (सिस्टम)",
    "theme_light": "फिकट",
    "theme_dark": "गडद",
    "label_language": "भाषा",
    "label_privacy": "गोपनीयता प्रोफाइल",
    "privacy_broad": "विस्तृत",
    "privacy_broad_desc": "फोटो, नाव, पूर्वावलोकन आणि आवाज.",
    "privacy_medium": "मध्यम",
    "privacy_medium_desc": "फोटो, नाव, लपवलेला संदेश आणि आवाज.",
    "privacy_strict": "कडक",
    "privacy_strict_desc": "फक्त ॲप चिन्ह, मूक.",
    "tooltip_dnd": "व्यत्यय आणू नका",
    "tooltip_delete": "खाते हटवा",
    "default_account_name": "खाते",
    "hibernation_title": "खाते हायबरनेशनमध्ये आहे",
    "hibernation_desc": "रॅम मोकळी करण्यासाठी हे सत्र थांबवले आहे.",
    "wake_button": "सुरू करा",
    "btn_edit": "संपादित करा",
    "btn_delete": "हटवा",
    "account_status_title": "खात्याची स्थिती",
    "account_status_desc": "निष्क्रिय खाती जतन राहतात परंतु लोड होत नाहीत.",
    "status_active": "सक्रिय",
    "status_inactive": "निष्क्रिय",
    "dnd_title": "व्यत्यय आणू नका",
    "dnd_desc": "या खात्याच्या सूचना मूक करा.",
    "untitled_account": "अनामित खाते",
    "card_theme_title": "थीम आणि रंग",
    "label_palette": "रंग पॅलेट",
    "palette_whatsapp": "WhatsApp (हिरवा)",
    "palette_messenger": "Messenger (निळा)",
    "palette_telegram": "Telegram (आकाशी)",
    "palette_signal": "Signal (शाही निळा)",
    "palette_forest": "जंगल (ऑलिव्ह)",
    "card_language_title": "इंटरफेस भाषा",
    "card_tray_title": "सिस्टम ट्रे चिन्ह",
    "hint_tray": "टास्कबारवरील चिन्ह कॉन्फिगर करा.",
    "label_tray_style": "ट्रे चिन्ह शैली",
    "tray_style_auto": "डीफॉल्ट / ब्रँड",
    "tray_style_light": "फिकट (पांढरा)",
    "tray_style_dark": "गडद (काळा)",
    "label_tray_badge": "न वाचलेले संदेश",
    "hint_tray_badge": "चिन्हावर बॅज दाखवा",
    "heading_notifications_privacy": "सूचना",
    "desc_notifications_privacy": "सूचनांमध्ये काय माहिती दाखवायची ते ठरवा.",
    "label_privacy_preset": "गोपनीयता",
    "preset_broad": "विस्तृत",
    "preset_medium": "मध्यम",
    "preset_strict": "कडक",
    "preset_custom": "सानुकूल",
    "notif_desktop_title": "डेस्कटॉप सूचना",
    "notif_desktop_desc": "डेस्कटॉप सूचना प्रणालीद्वारे सूचना दाखवा.",
    "notif_photo_title": "संपर्क फोटो",
    "notif_photo_desc": "उपलब्ध असल्यास प्रेषकाचा फोटो दाखवा.",
    "notif_name_title": "संपर्क नाव",
    "notif_name_desc": "प्रेषक किंवा गटाचे नाव दाखवा.",
    "notif_preview_title": "संदेश पूर्वावलोकन",
    "notif_preview_desc": "प्राप्त संदेशाचा मजकूर दाखवा.",
    "notif_sound_title": "सूचना आवाज",
    "notif_sound_desc": "नवीन संदेशांसाठी आवाज वाजवण्याची परवानगी द्या.",
    "perm_heading": "परवानग्या",
    "perm_desc": "WhatsApp Web ला कोणत्या परवानग्या स्वयंचलितपणे द्यायच्या ते ठरवा.",
    "perm_notice": "अक्षम केलेल्या परवानग्या आवश्यक असल्यास विचारल्या जातील.",
    "perm_btn_allow_all": "सर्व परवानगी द्या",
    "perm_btn_remove_all": "सर्व काढा",
    "perm_group_device": "डिव्हाइस प्रवेश",
    "perm_mic_title": "मायक्रोफोन",
    "perm_mic_desc": "मायक्रोफोनमध्ये स्वयंचलित प्रवेशास अनुमती द्या.",
    "perm_camera_title": "कॅमेरा",
    "perm_camera_desc": "कॅमेऱ्यामध्ये स्वयंचलित प्रवेशास अनुमती द्या.",
    "perm_location_title": "स्थान",
    "perm_location_desc": "स्थानामध्ये स्वयंचलित प्रवेशास अनुमती द्या.",
    "perm_group_share": "सामायिकरण",
    "perm_screen_title": "स्क्रीन सामायिकरण",
    "perm_screen_desc": "स्क्रीन सामग्री स्वयंचलितपणे सामायिक करण्यास अनुमती द्या.",
    "perm_screen_audio_title": "ऑडिओसह स्क्रीन",
    "perm_screen_audio_desc": "ऑडिओसह स्क्रीन सामायिक करण्यास अनुमती द्या.",
    "lang_en": "English",
    "lang_zh": "中文 (普通话)",
    "lang_hi": "हिन्दी",
    "lang_es": "Español",
    "lang_fr": "Français",
    "lang_ar": "العربية",
    "lang_bn": "বাংলা",
    "lang_pt": "Português",
    "lang_ru": "Русский",
    "lang_ur": "اردو",
    "lang_id": "Bahasa Indonesia",
    "lang_de": "Deutsch",
    "lang_ja": "日本語",
    "lang_mr": "मराठी",
    "lang_te": "తెలుగు",
    "lang_tr": "Türkçe",
    "lang_ta": "தமிழ்",
    "lang_yue": "粵語 (廣東話)",
    "lang_vi": "Tiếng Việt",
    "lang_fil": "Filipino",
    "lang_ko": "한국어",
    "lang_fa": "فارسی",
    "lang_ha": "Hausa",
    "lang_sw": "Kiswahili",
    "lang_it": "Italiano"
  },
  "te": {
    "tooltip_back": "చాట్‌లకు తిరిగి వెళ్లు",
    "settings_subtitle": "గ్లోబల్ ప్రాధాన్యతలు మరియు ఖాతా నిర్వహణ",
    "desc_accounts": "మీ WhatsApp ఖాతాలను నిర్వహించండి లేదా డూ నాట్ డిస్టర్బ్ మోడ్‌ను ఆన్ చేయండి.",
    "desc_appearance": "థీమ్ మరియు భాషను అనుకూలీకరించండి.",
    "desc_notifications": "నోటిఫికేషన్ల గోప్యతను నియంత్రించండి.",
    "hint_theme": "మీకు నచ్చిన రంగును ఎంచుకోండి",
    "hint_language": "ఇంటర్‌ఫేస్ భాషను ఎంచుకోండి",
    "tooltip_add_account": "ఖాతాను జోడించండి",
    "tooltip_report_bug": "బగ్‌ను నివేదించండి",
    "tooltip_settings": "సెట్టింగ్‌లు",
    "welcome": "WhatsNexus కు స్వాగతం",
    "welcome_desc": "ప్రారంభించడానికి సైడ్‌బార్‌లో ఖాతాను ఎంచుకోండి లేదా క్రొత్తదాన్ని జోడించండి.",
    "settings_title": "సెట్టింగ్‌లు",
    "tab_accounts": "ఖాతాలు",
    "tab_appearance": "రూపురేఖలు",
    "tab_notifications": "నోటిఫికేషన్‌లు",
    "tab_permissions": "అనుమతులు",
    "heading_accounts": "ఖాతా నిర్వహణ",
    "label_theme": "థీమ్",
    "theme_auto": "ఆటో (సిస్టమ్)",
    "theme_light": "లైట్",
    "theme_dark": "డార్క్",
    "label_language": "భాష",
    "label_privacy": "గోప్యతా ప్రొఫైల్",
    "privacy_broad": "విస్తృత",
    "privacy_broad_desc": "ఫోటో, పేరు, సందేశ ప్రివ్యూ మరియు ధ్వని.",
    "privacy_medium": "మధ్యస్థ",
    "privacy_medium_desc": "ఫోటో, పేరు, 'దాచిన సందేశం' మరియు ధ్వని.",
    "privacy_strict": "ఖచ్చితమైన",
    "privacy_strict_desc": "యాప్ ఐకాన్, వివరాలు లేవు, నిశ్శబ్దం.",
    "tooltip_dnd": "డూ నాట్ డిస్టర్బ్",
    "tooltip_delete": "ఖాతాను తొలగించండి",
    "default_account_name": "ఖాతా",
    "hibernation_title": "ఖాతా నిద్రాణస్థితిలో ఉంది",
    "hibernation_desc": "RAM ను ఖాళీ చేయడానికి ఈ సెషన్ పాజ్ చేయబడింది.",
    "wake_button": "మేల్కొలపండి",
    "btn_edit": "సవరించు",
    "btn_delete": "తొలగించు",
    "account_status_title": "ఖాతా స్థితి",
    "account_status_desc": "నిష్క్రియం చేయబడిన ఖాతాలు భద్రపరచబడతాయి కానీ లోడ్ కావు.",
    "status_active": "క్రియాశీలం",
    "status_inactive": "నిష్క్రియం",
    "dnd_title": "డూ నాట్ డిస్టర్బ్",
    "dnd_desc": "ఈ ఖాతా కోసం నోటిఫికేషన్‌లను మ్యూట్ చేయండి.",
    "untitled_account": "పేరులేని ఖాతా",
    "card_theme_title": "థీమ్‌లు మరియు రంగు శైలి",
    "label_palette": "రంగుల పాలెట్",
    "palette_whatsapp": "WhatsApp (పచ్చ)",
    "palette_messenger": "Messenger (మెటా నీలం)",
    "palette_telegram": "Telegram (సయాన్ నీలం)",
    "palette_signal": "Signal (రాయల్ నీలం)",
    "palette_forest": "అడవి (ఆలివ్)",
    "card_language_title": "ఇంటర్‌ఫేస్ భాష",
    "card_tray_title": "సిస్టమ్ ట్రే చిహ్నం",
    "hint_tray": "టాస్క్‌బార్‌లో ట్రే చిహ్నాన్ని కాన్ఫిగర్ చేయండి.",
    "label_tray_style": "ట్రే చిహ్నం శైలి",
    "tray_style_auto": "డిఫాల్ట్ / బ్రాండ్",
    "tray_style_light": "లైట్ (తెలుపు)",
    "tray_style_dark": "డార్క్ (నలుపు)",
    "label_tray_badge": "చదవని సందేశాల కౌంటర్",
    "hint_tray_badge": "ఐకాన్‌పై సంఖ్య బ్యాడ్జ్ చూపించు",
    "heading_notifications_privacy": "నోటిఫికేషన్‌లు",
    "desc_notifications_privacy": "నోటిఫికేషన్‌లలో ఏ సమాచారం కనిపించవచ్చో ఎంచుకోండి.",
    "label_privacy_preset": "గోప్యత",
    "preset_broad": "విస్తృత",
    "preset_medium": "మధ్యస్థ",
    "preset_strict": "ఖచ్చితమైన",
    "preset_custom": "అనుకూల",
    "notif_desktop_title": "డెస్క్‌టాప్ నోటిఫికేషన్‌లు",
    "notif_desktop_desc": "డెస్క్‌టాప్ సిస్టమ్ ద్వారా WhatsApp నోటిఫికేషన్‌లను చూపించండి.",
    "notif_photo_title": "కాంటాక్ట్ ఫోటో",
    "notif_photo_desc": "అందుబాటులో ఉన్నప్పుడు పంపినవారి ఫోటోను చూపించు.",
    "notif_name_title": "కాంటాక్ట్ పేరు",
    "notif_name_desc": "పంపినవారు లేదా సమూహం పేరు చూపించు.",
    "notif_preview_title": "సందేశ ప్రివ్యూ",
    "notif_preview_desc": "అందుకున్న సందేశం కంటెంట్‌ను చూపించు.",
    "notif_sound_title": "నోటిఫికేషన్ ధ్వని",
    "notif_sound_desc": "కొత్త సందేశాల కోసం అలర్ట్ ధ్వనిని అనుమతించండి.",
    "perm_heading": "అనుమతులు",
    "perm_desc": "WhatsApp Web కి ఏ అనుమతులను స్వయంచాలకంగా మంజూరు చేయవచ్చో నిర్వచించండి.",
    "perm_notice": "అవసరమైనప్పుడు నిలిపివేయబడిన అనుమతులు ఇప్పటికీ అభ్యర్థించబడతాయి.",
    "perm_btn_allow_all": "అన్నీ అనుమతించండి",
    "perm_btn_remove_all": "అన్నీ తీసివేయండి",
    "perm_group_device": "పరికర యాక్సెస్",
    "perm_mic_title": "మైక్రోఫోన్",
    "perm_mic_desc": "మీ మైక్రోఫోన్‌కు స్వయంచాలకంగా యాక్సెస్ అనుమతించండి.",
    "perm_camera_title": "కెమెరా",
    "perm_camera_desc": "మీ కెమెరాకు స్వయంచాలకంగా యాక్సెస్ అనుమతించండి.",
    "perm_location_title": "స్థానం",
    "perm_location_desc": "మీ స్థానానికి స్వయంచాలకంగా యాక్సెస్ అనుమతించండి.",
    "perm_group_share": "భాగస్వామ్యం",
    "perm_screen_title": "స్క్రీన్ షేరింగ్",
    "perm_screen_desc": "స్క్రీన్ కంటెంట్ షేరింగ్‌ను స్వయంచాలకంగా అనుమతించండి.",
    "perm_screen_audio_title": "ఆడియోతో స్క్రీన్",
    "perm_screen_audio_desc": "ఆడియోతో స్క్రీన్ షేరింగ్‌ను స్వయంచాలకంగా అనుమతించండి.",
    "lang_en": "English",
    "lang_zh": "中文 (普通话)",
    "lang_hi": "हिन्दी",
    "lang_es": "Español",
    "lang_fr": "Français",
    "lang_ar": "العربية",
    "lang_bn": "বাংলা",
    "lang_pt": "Português",
    "lang_ru": "Русский",
    "lang_ur": "اردو",
    "lang_id": "Bahasa Indonesia",
    "lang_de": "Deutsch",
    "lang_ja": "日本語",
    "lang_mr": "मराठी",
    "lang_te": "తెలుగు",
    "lang_tr": "Türkçe",
    "lang_ta": "தமிழ்",
    "lang_yue": "粵語 (廣東話)",
    "lang_vi": "Tiếng Việt",
    "lang_fil": "Filipino",
    "lang_ko": "한국어",
    "lang_fa": "فارسی",
    "lang_ha": "Hausa",
    "lang_sw": "Kiswahili",
    "lang_it": "Italiano"
  },
  "tr": {
    "tooltip_back": "Sohbetlere dön",
    "settings_subtitle": "Genel tercihler ve hesap yönetimi",
    "desc_accounts": "WhatsApp hesaplarınızı yönetin veya Rahatsız Etmeyin modunu açın.",
    "desc_appearance": "Görsel temayı ve arayüz dilini özelleştirin.",
    "desc_notifications": "Bildirim içerik gizliliğini kontrol edin.",
    "hint_theme": "Tercih ettiğiniz renk düzenini seçin",
    "hint_language": "Arayüz dilini seçin",
    "tooltip_add_account": "Hesap Ekle",
    "tooltip_report_bug": "Hata Bildir",
    "tooltip_settings": "Ayarlar",
    "welcome": "WhatsNexus'a Hoş Geldiniz",
    "welcome_desc": "Başlamak için kenar çubuğundan bir hesap seçin veya yeni bir tane ekleyin.",
    "settings_title": "Ayarlar",
    "tab_accounts": "Hesaplar",
    "tab_appearance": "Görünüm",
    "tab_notifications": "Bildirimler",
    "tab_permissions": "İzinler",
    "heading_accounts": "Hesap Yönetimi",
    "label_theme": "Tema",
    "theme_auto": "Otomatik (Sistem)",
    "theme_light": "Açık",
    "theme_dark": "Koyu",
    "label_language": "Dil",
    "label_privacy": "Gizlilik Profili",
    "privacy_broad": "Geniş",
    "privacy_broad_desc": "Fotoğraf, isim, mesaj önizlemesi ve ses.",
    "privacy_medium": "Orta",
    "privacy_medium_desc": "Fotoğraf, isim, 'Gizli mesaj' ve ses.",
    "privacy_strict": "Katı",
    "privacy_strict_desc": "Uygulama simgesi, gizli detaylar, sessiz.",
    "tooltip_dnd": "Rahatsız Etmeyin",
    "tooltip_delete": "Hesabı Sil",
    "default_account_name": "Hesap",
    "hibernation_title": "Hesap Hazırda Bekletmede",
    "hibernation_desc": "RAM boşaltmak için bu oturum duraklatıldı.",
    "wake_button": "Uyandır",
    "btn_edit": "Düzenle",
    "btn_delete": "Sil",
    "account_status_title": "Hesap durumu",
    "account_status_desc": "Devre dışı bırakılan hesaplar kaydedilir ancak bildirim almaz.",
    "status_active": "Aktif",
    "status_inactive": "Devre Dışı",
    "dnd_title": "Rahatsız etmeyin",
    "dnd_desc": "Bu hesap için bildirimleri sessize alın.",
    "untitled_account": "İsimsiz Hesap",
    "card_theme_title": "Temalar ve Görsel Stil",
    "label_palette": "Renk Paleti",
    "palette_whatsapp": "WhatsApp (Zümrüt)",
    "palette_messenger": "Messenger (Meta Mavi)",
    "palette_telegram": "Telegram (Camgöbeği)",
    "palette_signal": "Signal (Kraliyet Mavisi)",
    "palette_forest": "Orman (Zeytin ve Toprak)",
    "card_language_title": "Arayüz Dili",
    "card_tray_title": "Sistem Tepsisi (Durum Simgesi)",
    "hint_tray": "Görev çubuğundaki simge görünümünü yapılandırın.",
    "label_tray_style": "Tepsi Simge Stili",
    "tray_style_auto": "Varsayılan / Marka",
    "tray_style_light": "Açık (Monokrom beyaz)",
    "tray_style_dark": "Koyu (Monokrom siyah)",
    "label_tray_badge": "Okunmamış Mesaj Sayacı",
    "hint_tray_badge": "Simge üzerinde sayı rozeti göster",
    "heading_notifications_privacy": "Bildirimler",
    "desc_notifications_privacy": "Bildirimlerde hangi bilgilerin görüneceğini seçin.",
    "label_privacy_preset": "Gizlilik",
    "preset_broad": "Geniş",
    "preset_medium": "Orta",
    "preset_strict": "Katı",
    "preset_custom": "Özel",
    "notif_desktop_title": "Masaüstü bildirimleri",
    "notif_desktop_desc": "Masaüstü bildirim sistemini kullanarak WhatsApp bildirimlerini gösterin.",
    "notif_photo_title": "Kişi fotoğrafı",
    "notif_photo_desc": "Mümkün olduğunda gönderen fotoğrafını gösterin.",
    "notif_name_title": "Kişi adı",
    "notif_name_desc": "Gönderen veya grup adını gösterin.",
    "notif_preview_title": "Mesaj önizlemesi",
    "notif_preview_desc": "Alınan mesajın içeriğini gösterin.",
    "notif_sound_title": "Bildirim sesi",
    "notif_sound_desc": "Yeni mesajlar için uyarı sesi çalınmasına izin verin.",
    "perm_heading": "İzinler",
    "perm_desc": "WhatsApp Web'e hangi izinlerin otomatik olarak verileceğini belirleyin.",
    "perm_notice": "Devre dışı bırakılan izinler gerektiğinde sorulmaya devam edecektir.",
    "perm_btn_allow_all": "Tümüne izin ver",
    "perm_btn_remove_all": "Tümünü kaldır",
    "perm_group_device": "Cihaz erişimi",
    "perm_mic_title": "mikrofon",
    "perm_mic_desc": "Mikrofonunuza otomatik olarak erişim izni verin.",
    "perm_camera_title": "kamera",
    "perm_camera_desc": "Kameranıza otomatik olarak erişim izni verin.",
    "perm_location_title": "Konum",
    "perm_location_desc": "Konumunuza otomatik olarak erişim izni verin.",
    "perm_group_share": "Paylaşım",
    "perm_screen_title": "Ekran paylaşımı",
    "perm_screen_desc": "Ekran içeriğini paylaşmaya otomatik olarak izin verin.",
    "perm_screen_audio_title": "Sesli ekran",
    "perm_screen_audio_desc": "Sesli ekran paylaşımına otomatik olarak izin verin.",
    "lang_en": "English",
    "lang_zh": "中文 (普通话)",
    "lang_hi": "हिन्दी",
    "lang_es": "Español",
    "lang_fr": "Français",
    "lang_ar": "العربية",
    "lang_bn": "বাংলা",
    "lang_pt": "Português",
    "lang_ru": "Русский",
    "lang_ur": "اردو",
    "lang_id": "Bahasa Indonesia",
    "lang_de": "Deutsch",
    "lang_ja": "日本語",
    "lang_mr": "मराठी",
    "lang_te": "తెలుగు",
    "lang_tr": "Türkçe",
    "lang_ta": "தமிழ்",
    "lang_yue": "粵語 (廣東話)",
    "lang_vi": "Tiếng Việt",
    "lang_fil": "Filipino",
    "lang_ko": "한국어",
    "lang_fa": "فارسی",
    "lang_ha": "Hausa",
    "lang_sw": "Kiswahili",
    "lang_it": "Italiano"
  },
  "ta": {
    "tooltip_back": "அரட்டைகளுக்குத் திரும்பு",
    "settings_subtitle": "உலகளாவிய விருப்பத்தேர்வுகள் மற்றும் கணக்கு மேலாண்மை",
    "desc_accounts": "உங்கள் WhatsApp கணக்குகளை நிர்வகிக்கவும் அல்லது தொந்தரவு செய்யாதே பயன்முறையை இயக்கவும்.",
    "desc_appearance": "தீம் மற்றும் இடைமுக மொழியைத் தனிப்பயனாக்குங்கள்.",
    "desc_notifications": "அறிவிப்புகளின் தனியுரிமையைக் கட்டுப்படுத்துங்கள்.",
    "hint_theme": "விருப்பமான வண்ண அமைப்பைத் தேர்ந்தெடுக்கவும்",
    "hint_language": "இடைமுக மொழியைத் தேர்ந்தெடுக்கவும்",
    "tooltip_add_account": "கணக்கைச் சேர்",
    "tooltip_report_bug": "பிழையைப் புகாரளி",
    "tooltip_settings": "அமைப்புகள்",
    "welcome": "WhatsNexus க்கு வரவேற்கிறோம்",
    "welcome_desc": "தொடங்க பக்கப்பட்டியில் கணக்கைத் தேர்ந்தெடுக்கவும் அல்லது புதியதைச் சேர்க்கவும்.",
    "settings_title": "அமைப்புகள்",
    "tab_accounts": "கணக்குகள்",
    "tab_appearance": "தோற்றம்",
    "tab_notifications": "அறிவிப்புகள்",
    "tab_permissions": "அனுமதிகள்",
    "heading_accounts": "கணக்கு மேலாண்மை",
    "label_theme": "தீம்",
    "theme_auto": "தானியங்கி (கணினி)",
    "theme_light": "வெளிச்சம்",
    "theme_dark": "இருண்ட",
    "label_language": "மொழி",
    "label_privacy": "தனியுரிமை சுயவிவரம்",
    "privacy_broad": "விரிவான",
    "privacy_broad_desc": "புகைப்படம், பெயர், முன்னோட்டம் மற்றும் ஒலி.",
    "privacy_medium": "நடுத்தர",
    "privacy_medium_desc": "புகைப்படம், பெயர், மறைக்கப்பட்ட செய்தி மற்றும் ஒலி.",
    "privacy_strict": "கடுமையான",
    "privacy_strict_desc": "ஆப் ஐகான், விவரங்கள் இல்லை, அமைதி.",
    "tooltip_dnd": "தொந்தரவு செய்யாதே",
    "tooltip_delete": "கணக்கை நீக்கு",
    "default_account_name": "கணக்கு",
    "hibernation_title": "கணக்கு உறக்கத்தில் உள்ளது",
    "hibernation_desc": "ரேம் நினைவகத்தை விடுவிக்க இந்த அமர்வு இடைநிறுத்தப்பட்டுள்ளது.",
    "wake_button": "விழித்தெழு",
    "btn_edit": "திருத்து",
    "btn_delete": "நீக்கு",
    "account_status_title": "கணக்கு நிலை",
    "account_status_desc": "முடக்கப்பட்ட கணக்குகள் சேமிக்கப்படும் ஆனால் ஏற்றப்படாது.",
    "status_active": "செயலில்",
    "status_inactive": "செயலிழந்தது",
    "dnd_title": "தொந்தரவு செய்யாதே",
    "dnd_desc": "இந்தக் கணக்கிற்கான அறிவிப்புகளை முடக்கு.",
    "untitled_account": "பெயரிடப்படாத கணக்கு",
    "card_theme_title": "தீம்கள் மற்றும் வண்ணங்கள்",
    "label_palette": "வண்ணத் தட்டு",
    "palette_whatsapp": "WhatsApp (பச்சை)",
    "palette_messenger": "Messenger (நீலம்)",
    "palette_telegram": "Telegram (சயான் நீலம்)",
    "palette_signal": "Signal (ராயல் நீலம்)",
    "palette_forest": "காடு (ஆலிவ்)",
    "card_language_title": "இடைமுக மொழி",
    "card_tray_title": "கணினி தட்டு ஐகான்",
    "hint_tray": "பணிப்பட்டியில் ஐகான் காட்சியை உள்ளமைக்கவும்.",
    "label_tray_style": "தட்டு ஐகான் பாணி",
    "tray_style_auto": "இயல்புநிலை / பிராண்ட்",
    "tray_style_light": "வெளிச்சம் (வெள்ளை)",
    "tray_style_dark": "இருண்ட (கருப்பு)",
    "label_tray_badge": "படிக்காத செய்திகள்",
    "hint_tray_badge": "ஐகானில் எண் பேட்ஜைக் காட்டு",
    "heading_notifications_privacy": "அறிவிப்புகள்",
    "desc_notifications_privacy": "அறிவிப்புகளில் என்ன தகவல் தோன்றலாம் என்பதைத் தேர்வுசெய்க.",
    "label_privacy_preset": "தனியுரிமை",
    "preset_broad": "விரிவான",
    "preset_medium": "நடுத்தர",
    "preset_strict": "கடுமையான",
    "preset_custom": "தனிப்பயன்",
    "notif_desktop_title": "டெஸ்க்டாப் அறிவிப்புகள்",
    "notif_desktop_desc": "டெஸ்க்டாப் அமைப்பைப் பயன்படுத்தி WhatsApp அறிவிப்புகளைக் காட்டவும்.",
    "notif_photo_title": "தொடர்பு புகைப்படம்",
    "notif_photo_desc": "கிடைக்கும்போது அனுப்புநரின் புகைப்படத்தைக் காட்டு.",
    "notif_name_title": "தொடர்பு பெயர்",
    "notif_name_desc": "அனுப்புநர் அல்லது குழுவின் பெயரைக் காட்டு.",
    "notif_preview_title": "செய்தி முன்னோட்டம்",
    "notif_preview_desc": "பெறப்பட்ட செய்தியின் உள்ளடக்கத்தைக் காட்டு.",
    "notif_sound_title": "அறிவிப்பு ஒலி",
    "notif_sound_desc": "புதிய செய்திகளுக்கு எச்சரிக்கை ஒலியை இயக்க அனுமதிக்கவும்.",
    "perm_heading": "அனுமதிகள்",
    "perm_desc": "WhatsApp Web க்கு எந்த அனுமதிகளைத் தானாக வழங்கலாம் என்பதை வரையறுக்கவும்.",
    "perm_notice": "முடக்கப்பட்ட அனுமதிகள் தேவைப்படும்போது கேட்கப்படும்.",
    "perm_btn_allow_all": "அனைத்தையும் அனுமதி",
    "perm_btn_remove_all": "அனைத்தையும் அகற்று",
    "perm_group_device": "சாதன அணுகல்",
    "perm_mic_title": "மைக்ரோஃபோன்",
    "perm_mic_desc": "உங்கள் மைக்ரோஃபோனுக்கான அணுகலைத் தானாக அனுமதிக்கவும்.",
    "perm_camera_title": "கேமரா",
    "perm_camera_desc": "உங்கள் கேமராவுக்கான அணுகலைத் தானாக அனுமதிக்கவும்.",
    "perm_location_title": "இருப்பிடம்",
    "perm_location_desc": "உங்கள் இருப்பிடத்திற்கான அணுகலைத் தானாக அனுமதிக்கவும்.",
    "perm_group_share": "பகிர்வு",
    "perm_screen_title": "திரை பகிர்வு",
    "perm_screen_desc": "திரை உள்ளடக்கப் பகிர்வைத் தானாக அனுமதிக்கவும்.",
    "perm_screen_audio_title": "ஆடியோவுடன் திரை",
    "perm_screen_audio_desc": "ஆடியோவுடன் திரை பகிர்வைத் தானாக அனுமதிக்கவும்.",
    "lang_en": "English",
    "lang_zh": "中文 (普通话)",
    "lang_hi": "हिन्दी",
    "lang_es": "Español",
    "lang_fr": "Français",
    "lang_ar": "العربية",
    "lang_bn": "বাংলা",
    "lang_pt": "Português",
    "lang_ru": "Русский",
    "lang_ur": "اردو",
    "lang_id": "Bahasa Indonesia",
    "lang_de": "Deutsch",
    "lang_ja": "日本語",
    "lang_mr": "मराठी",
    "lang_te": "తెలుగు",
    "lang_tr": "Türkçe",
    "lang_ta": "தமிழ்",
    "lang_yue": "粵語 (廣東話)",
    "lang_vi": "Tiếng Việt",
    "lang_fil": "Filipino",
    "lang_ko": "한국어",
    "lang_fa": "فارسی",
    "lang_ha": "Hausa",
    "lang_sw": "Kiswahili",
    "lang_it": "Italiano"
  },
  "yue": {
    "tooltip_back": "返回對話",
    "settings_subtitle": "全局偏好設定同帳戶管理",
    "desc_accounts": "管理你嘅 WhatsApp 帳戶，改名或者開啟請勿打擾。",
    "desc_appearance": "自訂外觀主題同介面語言。",
    "desc_notifications": "控制系統通知嘅內容私隱。",
    "hint_theme": "選擇你鍾意嘅配色方案",
    "hint_language": "選擇介面語言",
    "tooltip_add_account": "新增帳戶",
    "tooltip_report_bug": "回報問題",
    "tooltip_settings": "設定",
    "welcome": "歡迎使用 WhatsNexus",
    "welcome_desc": "喺側邊欄揀一個帳戶或者新增帳戶開始使用。",
    "settings_title": "設定",
    "tab_accounts": "帳戶",
    "tab_appearance": "外觀",
    "tab_notifications": "通知",
    "tab_permissions": "權限",
    "heading_accounts": "帳戶管理",
    "label_theme": "主題",
    "theme_auto": "自動（跟隨系統）",
    "theme_light": "淺色",
    "theme_dark": "深色",
    "label_language": "語言",
    "label_privacy": "私隱範本",
    "privacy_broad": "詳細",
    "privacy_broad_desc": "顯示相片、名稱、訊息預覽同播放提示音。",
    "privacy_medium": "適中",
    "privacy_medium_desc": "顯示相片、名稱、隱藏訊息同播放提示音。",
    "privacy_strict": "嚴格",
    "privacy_strict_desc": "只顯示應用程式圖示，隱藏內容，靜音。",
    "tooltip_dnd": "請勿打擾",
    "tooltip_delete": "刪除帳戶",
    "default_account_name": "帳戶",
    "hibernation_title": "帳戶休眠中",
    "hibernation_desc": "已經暫停呢個工作階段嚟釋放記憶體。",
    "wake_button": "喚醒",
    "btn_edit": "編輯",
    "btn_delete": "刪除",
    "account_status_title": "帳戶狀態",
    "account_status_desc": "停用嘅帳戶會保留，但唔會載入亦唔會收到通知。",
    "status_active": "使用中",
    "status_inactive": "已停用",
    "dnd_title": "請勿打擾",
    "dnd_desc": "將呢個帳戶嘅通知設為靜音。",
    "untitled_account": "未命名帳戶",
    "card_theme_title": "主題與色彩",
    "label_palette": "調色盤",
    "palette_whatsapp": "WhatsApp（祖母綠）",
    "palette_messenger": "Messenger（Meta 藍）",
    "palette_telegram": "Telegram（青藍色）",
    "palette_signal": "Signal（皇家藍）",
    "palette_forest": "森林（橄欖與大地）",
    "card_language_title": "介面語言",
    "card_tray_title": "系統匣（狀態圖示）",
    "hint_tray": "設定系統匣圖示嘅顯示同風格。",
    "label_tray_style": "系統匣圖示風格",
    "tray_style_auto": "預設 / 品牌",
    "tray_style_light": "淺色（單色白）",
    "tray_style_dark": "深色（單色黑）",
    "label_tray_badge": "未讀訊息計數器",
    "hint_tray_badge": "喺圖示上顯示未讀數量標記",
    "heading_notifications_privacy": "通知設定",
    "desc_notifications_privacy": "選擇喺桌面通知顯示嘅資訊。",
    "label_privacy_preset": "私隱",
    "preset_broad": "寬鬆",
    "preset_medium": "中等",
    "preset_strict": "嚴格",
    "preset_custom": "自訂",
    "notif_desktop_title": "桌面通知",
    "notif_desktop_desc": "使用桌面通知系統顯示 WhatsApp 提示。",
    "notif_photo_title": "聯絡人相片",
    "notif_photo_desc": "可用時顯示寄件人相片。",
    "notif_name_title": "聯絡人名稱",
    "notif_name_desc": "顯示寄件人或群組名稱。",
    "notif_preview_title": "訊息預覽",
    "notif_preview_desc": "顯示收到嘅訊息內容。",
    "notif_sound_title": "通知音效",
    "notif_sound_desc": "允許系統播放新訊息提示音。",
    "perm_heading": "權限",
    "perm_desc": "設定自動授予 WhatsApp Web 嘅權限。",
    "perm_notice": "已停用嘅權限喺需要嗰陣仲會提出要求。",
    "perm_btn_allow_all": "全部允許",
    "perm_btn_remove_all": "全部移除",
    "perm_group_device": "裝置存取",
    "perm_mic_title": "咪高峰",
    "perm_mic_desc": "自動允許存取你嘅咪高峰。",
    "perm_camera_title": "相機",
    "perm_camera_desc": "自動允許存取你嘅相機。",
    "perm_location_title": "位置",
    "perm_location_desc": "自動允許存取你嘅位置資訊。",
    "perm_group_share": "分享",
    "perm_screen_title": "螢幕分享",
    "perm_screen_desc": "自動允許分享螢幕內容。",
    "perm_screen_audio_title": "包含音訊嘅螢幕",
    "perm_screen_audio_desc": "自動允許分享包含音訊嘅螢幕。",
    "lang_en": "English",
    "lang_zh": "中文 (普通话)",
    "lang_hi": "हिन्दी",
    "lang_es": "Español",
    "lang_fr": "Français",
    "lang_ar": "العربية",
    "lang_bn": "বাংলা",
    "lang_pt": "Português",
    "lang_ru": "Русский",
    "lang_ur": "اردو",
    "lang_id": "Bahasa Indonesia",
    "lang_de": "Deutsch",
    "lang_ja": "日本語",
    "lang_mr": "मराठी",
    "lang_te": "తెలుగు",
    "lang_tr": "Türkçe",
    "lang_ta": "தமிழ்",
    "lang_yue": "粵語 (廣東話)",
    "lang_vi": "Tiếng Việt",
    "lang_fil": "Filipino",
    "lang_ko": "한국어",
    "lang_fa": "فارسی",
    "lang_ha": "Hausa",
    "lang_sw": "Kiswahili",
    "lang_it": "Italiano"
  },
  "vi": {
    "tooltip_back": "Quay lại cuộc trò chuyện",
    "settings_subtitle": "Tùy chọn chung & quản lý tài khoản",
    "desc_accounts": "Quản lý tài khoản WhatsApp hoặc bật chế độ Không làm phiền.",
    "desc_appearance": "Tùy chỉnh giao diện và ngôn ngữ.",
    "desc_notifications": "Kiểm soát quyền riêng tư nội dung thông báo.",
    "hint_theme": "Chọn bảng màu yêu thích",
    "hint_language": "Chọn ngôn ngữ giao diện",
    "tooltip_add_account": "Thêm tài khoản",
    "tooltip_report_bug": "Báo cáo lỗi",
    "tooltip_settings": "Cài đặt",
    "welcome": "Chào mừng đến với WhatsNexus",
    "welcome_desc": "Chọn tài khoản ở thanh bên hoặc thêm tài khoản mới để bắt đầu.",
    "settings_title": "Cài đặt",
    "tab_accounts": "Tài khoản",
    "tab_appearance": "Giao diện",
    "tab_notifications": "Thông báo",
    "tab_permissions": "Quyền truy cập",
    "heading_accounts": "Quản lý tài khoản",
    "label_theme": "Chủ đề",
    "theme_auto": "Tự động (Hệ thống)",
    "theme_light": "Sáng",
    "theme_dark": "Tối",
    "label_language": "Ngôn ngữ",
    "label_privacy": "Cấu hình quyền riêng tư",
    "privacy_broad": "Rộng",
    "privacy_broad_desc": "Ảnh, tên, xem trước tin nhắn và âm thanh.",
    "privacy_medium": "Vừa",
    "privacy_medium_desc": "Ảnh, tên, 'Tin nhắn ẩn' và âm thanh.",
    "privacy_strict": "Nghiêm ngặt",
    "privacy_strict_desc": "Biểu tượng ứng dụng, ẩn chi tiết, im lặng.",
    "tooltip_dnd": "Không làm phiền",
    "tooltip_delete": "Xóa tài khoản",
    "default_account_name": "Tài khoản",
    "hibernation_title": "Tài khoản đang ngủ đông",
    "hibernation_desc": "Phiên này đã tạm dừng để giải phóng bộ nhớ RAM.",
    "wake_button": "Đánh thức",
    "btn_edit": "Chỉnh sửa",
    "btn_delete": "Xóa",
    "account_status_title": "Trạng thái tài khoản",
    "account_status_desc": "Tài khoản bị vô hiệu hóa vẫn được lưu nhưng không tải.",
    "status_active": "Đang hoạt động",
    "status_inactive": "Đã vô hiệu hóa",
    "dnd_title": "Không làm phiền",
    "dnd_desc": "Tắt thông báo cho tài khoản này.",
    "untitled_account": "Tài khoản chưa đặt tên",
    "card_theme_title": "Chủ đề & Phong cách",
    "label_palette": "Bảng màu",
    "palette_whatsapp": "WhatsApp (Ngọc lục bảo)",
    "palette_messenger": "Messenger (Xanh Meta)",
    "palette_telegram": "Telegram (Xanh lơ)",
    "palette_signal": "Signal (Xanh hoàng gia)",
    "palette_forest": "Rừng rậm (Olive & Đất)",
    "card_language_title": "Ngôn ngữ giao diện",
    "card_tray_title": "Khay hệ thống (Biểu tượng)",
    "hint_tray": "Cấu hình biểu tượng trên thanh tác vụ hệ thống.",
    "label_tray_style": "Kiểu biểu tượng khay",
    "tray_style_auto": "Mặc định / Thương hiệu",
    "tray_style_light": "Sáng (Đơn sắc trắng)",
    "tray_style_dark": "Tối (Đơn sắc đen)",
    "label_tray_badge": "Bộ đếm tin nhắn chưa đọc",
    "hint_tray_badge": "Hiển thị huy hiệu số trên biểu tượng",
    "heading_notifications_privacy": "Thông báo",
    "desc_notifications_privacy": "Chọn thông tin có thể xuất hiện trong thông báo.",
    "label_privacy_preset": "Quyền riêng tư",
    "preset_broad": "Đầy đủ",
    "preset_medium": "Trung bình",
    "preset_strict": "Nghiêm ngặt",
    "preset_custom": "Tùy chỉnh",
    "notif_desktop_title": "Thông báo trên màn hình",
    "notif_desktop_desc": "Hiển thị thông báo WhatsApp bằng hệ thống máy tính.",
    "notif_photo_title": "Ảnh liên hệ",
    "notif_photo_desc": "Hiển thị ảnh người gửi nếu có.",
    "notif_name_title": "Tên liên hệ",
    "notif_name_desc": "Hiển thị tên người gửi hoặc nhóm.",
    "notif_preview_title": "Xem trước tin nhắn",
    "notif_preview_desc": "Hiển thị nội dung tin nhắn nhận được.",
    "notif_sound_title": "Âm thanh thông báo",
    "notif_sound_desc": "Phát âm thanh cảnh báo cho tin nhắn mới.",
    "perm_heading": "Quyền truy cập",
    "perm_desc": "Xác định quyền có thể tự động cấp cho WhatsApp Web.",
    "perm_notice": "Các quyền bị tắt vẫn sẽ được yêu cầu khi cần thiết.",
    "perm_btn_allow_all": "Cho phép tất cả",
    "perm_btn_remove_all": "Xóa tất cả",
    "perm_group_device": "Truy cập thiết bị",
    "perm_mic_title": "micro",
    "perm_mic_desc": "Tự động cho phép truy cập vào micro của bạn.",
    "perm_camera_title": "máy ảnh",
    "perm_camera_desc": "Tự động cho phép truy cập vào máy ảnh của bạn.",
    "perm_location_title": "Vị trí",
    "perm_location_desc": "Tự động cho phép truy cập vào vị trí của bạn.",
    "perm_group_share": "Chia sẻ",
    "perm_screen_title": "Chia sẻ màn hình",
    "perm_screen_desc": "Tự động cho phép chia sẻ nội dung màn hình.",
    "perm_screen_audio_title": "Màn hình kèm âm thanh",
    "perm_screen_audio_desc": "Tự động cho phép chia sẻ màn hình kèm âm thanh.",
    "lang_en": "English",
    "lang_zh": "中文 (普通话)",
    "lang_hi": "हिन्दी",
    "lang_es": "Español",
    "lang_fr": "Français",
    "lang_ar": "العربية",
    "lang_bn": "বাংলা",
    "lang_pt": "Português",
    "lang_ru": "Русский",
    "lang_ur": "اردو",
    "lang_id": "Bahasa Indonesia",
    "lang_de": "Deutsch",
    "lang_ja": "日本語",
    "lang_mr": "मराठी",
    "lang_te": "తెలుగు",
    "lang_tr": "Türkçe",
    "lang_ta": "தமிழ்",
    "lang_yue": "粵語 (廣東話)",
    "lang_vi": "Tiếng Việt",
    "lang_fil": "Filipino",
    "lang_ko": "한국어",
    "lang_fa": "فارسی",
    "lang_ha": "Hausa",
    "lang_sw": "Kiswahili",
    "lang_it": "Italiano"
  },
  "fil": {
    "tooltip_back": "Bumalik sa mga chat",
    "settings_subtitle": "Mga pandaigdigang kagustuhan at pamamahala ng account",
    "desc_accounts": "Pamahalaan ang mga WhatsApp account o i-toggle ang Huwag Istorbohin.",
    "desc_appearance": "I-customize ang visual na tema at wika ng interface.",
    "desc_notifications": "Kontrolin ang privacy ng nilalaman ng notification.",
    "hint_theme": "Piliin ang iyong gustong scheme ng kulay",
    "hint_language": "Piliin ang wika ng interface",
    "tooltip_add_account": "Magdagdag ng Account",
    "tooltip_report_bug": "Mag-ulat ng Bug",
    "tooltip_settings": "Mga Setting",
    "welcome": "Maligayang pagdating sa WhatsNexus",
    "welcome_desc": "Pumili ng account sa sidebar o magdagdag ng bago upang magsimula.",
    "settings_title": "Mga Setting",
    "tab_accounts": "Mga Account",
    "tab_appearance": "Hitsura",
    "tab_notifications": "Mga Notification",
    "tab_permissions": "Mga Pahintulot",
    "heading_accounts": "Pamamahala ng Account",
    "label_theme": "Tema",
    "theme_auto": "Awtomatiko (System)",
    "theme_light": "Maliwanag",
    "theme_dark": "Madilim",
    "label_language": "Wika",
    "label_privacy": "Profile ng Privacy",
    "privacy_broad": "Malawak",
    "privacy_broad_desc": "Larawan, pangalan, preview ng mensahe, at tunog.",
    "privacy_medium": "Katamtaman",
    "privacy_medium_desc": "Larawan, pangalan, 'Nakatagong mensahe', at tunog.",
    "privacy_strict": "Mahigpit",
    "privacy_strict_desc": "Icon ng app, nakatago ang mga detalye, walang tunog.",
    "tooltip_dnd": "Huwag Istorbohin",
    "tooltip_delete": "I-delete ang Account",
    "default_account_name": "Account",
    "hibernation_title": "Nasa Hibernation ang Account",
    "hibernation_desc": "Na-pause ang session na ito upang magbakante ng RAM.",
    "wake_button": "Gisingin",
    "btn_edit": "I-edit",
    "btn_delete": "I-delete",
    "account_status_title": "Katayuan ng account",
    "account_status_desc": "Naka-save pa rin ang mga naka-deactivate na account.",
    "status_active": "Aktibo",
    "status_inactive": "Na-deactivate",
    "dnd_title": "Huwag istorbohin",
    "dnd_desc": "I-mute ang mga notification para sa account na ito.",
    "untitled_account": "Account na Walang Pangalan",
    "card_theme_title": "Mga Tema at Estilo",
    "label_palette": "Palette ng Kulay",
    "palette_whatsapp": "WhatsApp (Esmeralda)",
    "palette_messenger": "Messenger (Meta Asul)",
    "palette_telegram": "Telegram (Cyan Asul)",
    "palette_signal": "Signal (Royal Asul)",
    "palette_forest": "Gubat (Olive & Lupa)",
    "card_language_title": "Wika ng Interface",
    "card_tray_title": "System Tray (Icon ng Katayuan)",
    "hint_tray": "I-configure ang icon sa taskbar ng system.",
    "label_tray_style": "Estilo ng Icon ng Tray",
    "tray_style_auto": "Default / Brand",
    "tray_style_light": "Maliwanag (Puting monochrome)",
    "tray_style_dark": "Madilim (Itim na monochrome)",
    "label_tray_badge": "Counter ng hindi nabasang mensahe",
    "hint_tray_badge": "Ipakita ang badge ng numero sa icon",
    "heading_notifications_privacy": "Mga Notification",
    "desc_notifications_privacy": "Piliin kung anong impormasyon ang maaaring lumabas.",
    "label_privacy_preset": "Privacy",
    "preset_broad": "Malawak",
    "preset_medium": "Katamtaman",
    "preset_strict": "Mahigpit",
    "preset_custom": "Custom",
    "notif_desktop_title": "Mga notification sa desktop",
    "notif_desktop_desc": "Ipakita ang mga notification ng WhatsApp gamit ang desktop.",
    "notif_photo_title": "Larawan ng contact",
    "notif_photo_desc": "Ipakita ang larawan ng nagpadala kung available.",
    "notif_name_title": "Pangalan ng contact",
    "notif_name_desc": "Ipakita ang nagpadala o pangalan ng grupo.",
    "notif_preview_title": "Preview ng mensahe",
    "notif_preview_desc": "Ipakita ang nilalaman ng natanggap na mensahe.",
    "notif_sound_title": "Tunog ng notification",
    "notif_sound_desc": "Payagan ang tunog ng alerto para sa mga bagong mensahe.",
    "perm_heading": "Mga Pahintulot",
    "perm_desc": "Tukuyin kung aling mga pahintulot ang awtomatikong ibibigay sa WhatsApp Web.",
    "perm_notice": "Hihilingin pa rin ang mga naka-disable na pahintulot kung kinakailangan.",
    "perm_btn_allow_all": "Payagan lahat",
    "perm_btn_remove_all": "Alisin lahat",
    "perm_group_device": "Access sa device",
    "perm_mic_title": "mikropono",
    "perm_mic_desc": "Awtomatikong payagan ang access sa iyong mikropono.",
    "perm_camera_title": "kamera",
    "perm_camera_desc": "Awtomatikong payagan ang access sa iyong kamera.",
    "perm_location_title": "Lokasyon",
    "perm_location_desc": "Awtomatikong payagan ang access sa iyong lokasyon.",
    "perm_group_share": "Pagbabahagi",
    "perm_screen_title": "Pagbabahagi ng screen",
    "perm_screen_desc": "Awtomatikong payagan ang pagbabahagi ng screen.",
    "perm_screen_audio_title": "Screen na may audio",
    "perm_screen_audio_desc": "Awtomatikong payagan ang pagbabahagi ng screen na may audio.",
    "lang_en": "English",
    "lang_zh": "中文 (普通话)",
    "lang_hi": "हिन्दी",
    "lang_es": "Español",
    "lang_fr": "Français",
    "lang_ar": "العربية",
    "lang_bn": "বাংলা",
    "lang_pt": "Português",
    "lang_ru": "Русский",
    "lang_ur": "اردو",
    "lang_id": "Bahasa Indonesia",
    "lang_de": "Deutsch",
    "lang_ja": "日本語",
    "lang_mr": "मराठी",
    "lang_te": "తెలుగు",
    "lang_tr": "Türkçe",
    "lang_ta": "தமிழ்",
    "lang_yue": "粵語 (廣東話)",
    "lang_vi": "Tiếng Việt",
    "lang_fil": "Filipino",
    "lang_ko": "한국어",
    "lang_fa": "فارسی",
    "lang_ha": "Hausa",
    "lang_sw": "Kiswahili",
    "lang_it": "Italiano"
  },
  "ko": {
    "tooltip_back": "대화로 돌아가기",
    "settings_subtitle": "전체 환경설정 및 계정 관리",
    "desc_accounts": "WhatsApp 계정을 관리하고 방해 금지 모드를 설정합니다.",
    "desc_appearance": "시각적 테마와 언어를 맞춤 설정합니다.",
    "desc_notifications": "시스템 알림 콘텐츠의 개인정보를 관리합니다.",
    "hint_theme": "선호하는 색상 구성표 선택",
    "hint_language": "인터페이스 언어 선택",
    "tooltip_add_account": "계정 추가",
    "tooltip_report_bug": "버그 신고",
    "tooltip_settings": "설정",
    "welcome": "WhatsNexus에 오신 것을 환영합니다",
    "welcome_desc": "시작하려면 사이드바에서 계정을 선택하거나 새로 추가하세요.",
    "settings_title": "설정",
    "tab_accounts": "계정",
    "tab_appearance": "화면 구성",
    "tab_notifications": "알림",
    "tab_permissions": "권한",
    "heading_accounts": "계정 관리",
    "label_theme": "테마",
    "theme_auto": "자동 (시스템 설정)",
    "theme_light": "라이트",
    "theme_dark": "다크",
    "label_language": "언어",
    "label_privacy": "개인정보 프로필",
    "privacy_broad": "상세",
    "privacy_broad_desc": "사진, 이름, 메시지 미리보기 및 소리.",
    "privacy_medium": "보통",
    "privacy_medium_desc": "사진, 이름, '숨겨진 메시지' 및 소리.",
    "privacy_strict": "엄격",
    "privacy_strict_desc": "앱 아이콘만 표시, 정보 숨김, 무음.",
    "tooltip_dnd": "방해 금지",
    "tooltip_delete": "계정 삭제",
    "default_account_name": "계정",
    "hibernation_title": "절전 모드 계정",
    "hibernation_desc": "RAM 메모리를 확보하기 위해 이 세션이 일시 중지되었습니다.",
    "wake_button": "다시 시작",
    "btn_edit": "수정",
    "btn_delete": "삭제",
    "account_status_title": "계정 상태",
    "account_status_desc": "비활성화된 계정은 저장되어 유지되지만 로드되지 않습니다.",
    "status_active": "활성",
    "status_inactive": "비활성",
    "dnd_title": "방해 금지",
    "dnd_desc": "이 계정의 알림을 음소거합니다.",
    "untitled_account": "이름 없는 계정",
    "card_theme_title": "테마 및 시각 스타일",
    "label_palette": "색상 팔레트",
    "palette_whatsapp": "WhatsApp (에메랄드)",
    "palette_messenger": "Messenger (메타 블루)",
    "palette_telegram": "Telegram (시안 블루)",
    "palette_signal": "Signal (로얄 블루)",
    "palette_forest": "포레스트 (올리브 & 대지)",
    "card_language_title": "인터페이스 언어",
    "card_tray_title": "시스템 트레이 (상태 아이콘)",
    "hint_tray": "작업 표시줄 트레이 아이콘의 스타일을 구성합니다.",
    "label_tray_style": "트레이 아이콘 스타일",
    "tray_style_auto": "기본 / 브랜드 색상",
    "tray_style_light": "라이트 (단색 흰색)",
    "tray_style_dark": "다크 (단색 검정)",
    "label_tray_badge": "읽지 않은 메시지 카운터",
    "hint_tray_badge": "아이콘에 숫자 배지 표시",
    "heading_notifications_privacy": "알림",
    "desc_notifications_privacy": "알림에 표시할 정보를 선택합니다.",
    "label_privacy_preset": "개인정보",
    "preset_broad": "상세",
    "preset_medium": "보통",
    "preset_strict": "엄격",
    "preset_custom": "사용자 정의",
    "notif_desktop_title": "데스크톱 알림",
    "notif_desktop_desc": "데스크톱 알림 시스템을 사용하여 WhatsApp 알림을 표시합니다.",
    "notif_photo_title": "프로필 사진",
    "notif_photo_desc": "가능한 경우 발신자 사진을 표시합니다.",
    "notif_name_title": "연락처 이름",
    "notif_name_desc": "발신자 또는 그룹 이름을 표시합니다.",
    "notif_preview_title": "메시지 미리보기",
    "notif_preview_desc": "수신된 메시지 내용을 표시합니다.",
    "notif_sound_title": "알림 소리",
    "notif_sound_desc": "새 메시지에 대한 알림 소리를 재생하도록 허용합니다.",
    "perm_heading": "권한",
    "perm_desc": "WhatsApp Web에 자동으로 부여할 수 있는 권한을 정의합니다.",
    "perm_notice": "비활성화된 권한은 필요할 때 계속 요청됩니다.",
    "perm_btn_allow_all": "모두 허용",
    "perm_btn_remove_all": "모두 제거",
    "perm_group_device": "기기 접근",
    "perm_mic_title": "마이크",
    "perm_mic_desc": "마이크에 대한 접근을 자동으로 허용합니다.",
    "perm_camera_title": "카메라",
    "perm_camera_desc": "카메라에 대한 접근을 자동으로 허용합니다.",
    "perm_location_title": "위치",
    "perm_location_desc": "위치 정보에 대한 접근을 자동으로 허용합니다.",
    "perm_group_share": "공유",
    "perm_screen_title": "화면 공유",
    "perm_screen_desc": "화면 콘텐츠 공유를 자동으로 허용합니다.",
    "perm_screen_audio_title": "오디오 포함 화면",
    "perm_screen_audio_desc": "오디오가 포함된 화면 공유를 자동으로 허용합니다.",
    "lang_en": "English",
    "lang_zh": "中文 (普通话)",
    "lang_hi": "हिन्दी",
    "lang_es": "Español",
    "lang_fr": "Français",
    "lang_ar": "العربية",
    "lang_bn": "বাংলা",
    "lang_pt": "Português",
    "lang_ru": "Русский",
    "lang_ur": "اردو",
    "lang_id": "Bahasa Indonesia",
    "lang_de": "Deutsch",
    "lang_ja": "日本語",
    "lang_mr": "मराठी",
    "lang_te": "తెలుగు",
    "lang_tr": "Türkçe",
    "lang_ta": "தமிழ்",
    "lang_yue": "粵語 (廣東話)",
    "lang_vi": "Tiếng Việt",
    "lang_fil": "Filipino",
    "lang_ko": "한국어",
    "lang_fa": "فارسی",
    "lang_ha": "Hausa",
    "lang_sw": "Kiswahili",
    "lang_it": "Italiano"
  },
  "fa": {
    "tooltip_back": "بازگشت به گفتگوها",
    "settings_subtitle": "تنظیمات کلی و مدیریت حساب‌ها",
    "desc_accounts": "حساب‌های واتس‌اپ خود را مدیریت کنید یا حالت مزاحم نشوید را فعال کنید.",
    "desc_appearance": "پوسته ظاهری و زبان برنامه را شخصی‌سازی کنید.",
    "desc_notifications": "کنترل حریم خصوصی اعلان‌های سیستم.",
    "hint_theme": "طرح رنگ مورد علاقه خود را انتخاب کنید",
    "hint_language": "زبان رابط کاربری را انتخاب کنید",
    "tooltip_add_account": "افزودن حساب",
    "tooltip_report_bug": "گزارش مشکل",
    "tooltip_settings": "تنظیمات",
    "welcome": "به WhatsNexus خوش آمدید",
    "welcome_desc": "برای شروع، یک حساب را در نوار کناری انتخاب کنید یا یک حساب جدید اضافه نمایید.",
    "settings_title": "تنظیمات",
    "tab_accounts": "حساب‌ها",
    "tab_appearance": "ظاهر",
    "tab_notifications": "اعلان‌ها",
    "tab_permissions": "مجوزها",
    "heading_accounts": "مدیریت حساب‌ها",
    "label_theme": "پوسته",
    "theme_auto": "خودکار (سیستم)",
    "theme_light": "روشن",
    "theme_dark": "تاریک",
    "label_language": "زبان",
    "label_privacy": "نمایه حریم خصوصی",
    "privacy_broad": "کامل",
    "privacy_broad_desc": "عکس، نام، پیش‌نمایش پیام و صدا.",
    "privacy_medium": "متوسط",
    "privacy_medium_desc": "عکس، نام، 'پیام پنهان' و صدا.",
    "privacy_strict": "سخت‌گیرانه",
    "privacy_strict_desc": "فقط نماد برنامه، جزئیات پنهان، بی‌صدا.",
    "tooltip_dnd": "مزاحم نشوید",
    "tooltip_delete": "حذف حساب",
    "default_account_name": "حساب",
    "hibernation_title": "حساب در خواب زمستانی",
    "hibernation_desc": "این جلسه برای آزادسازی حافظه موقتاً متوقف شده است.",
    "wake_button": "فعال‌سازی",
    "btn_edit": "ویرایش",
    "btn_delete": "حذف",
    "account_status_title": "وضعیت حساب",
    "account_status_desc": "حساب‌های غیرفعال ذخیره می‌مانند اما بارگیری نمی‌شوند.",
    "status_active": "فعال",
    "status_inactive": "غیرفعال",
    "dnd_title": "مزاحم نشوید",
    "dnd_desc": "بی‌صدا کردن اعلان‌ها برای این حساب.",
    "untitled_account": "حساب بدون نام",
    "card_theme_title": "پوسته‌ها و سبک بصری",
    "label_palette": "پالت رنگ",
    "palette_whatsapp": "WhatsApp (زمردی)",
    "palette_messenger": "Messenger (آبی متا)",
    "palette_telegram": "Telegram (آبی فیروزه‌ای)",
    "palette_signal": "Signal (آبی سلطنتی)",
    "palette_forest": "جنگل (زیتونی و خاکی)",
    "card_language_title": "زبان رابط کاربری",
    "card_tray_title": "سینی سیستم (نماد وضعیت)",
    "hint_tray": "پیکربندی نماد در نوار وظیفه سیستم.",
    "label_tray_style": "سبک نماد سینی",
    "tray_style_auto": "پیش‌فرض / برند",
    "tray_style_light": "روشن (سفید تک‌رنگ)",
    "tray_style_dark": "تاریک (سیاه تک‌رنگ)",
    "label_tray_badge": "شمارنده پیام‌های خوانده نشده",
    "hint_tray_badge": "نمایش نشان عددی روی نماد",
    "heading_notifications_privacy": "اعلان‌ها",
    "desc_notifications_privacy": "اطلاعات مجاز در اعلان‌ها را انتخاب کنید.",
    "label_privacy_preset": "حریم خصوصی",
    "preset_broad": "کامل",
    "preset_medium": "متوسط",
    "preset_strict": "سخت‌گیرانه",
    "preset_custom": "سفارشی",
    "notif_desktop_title": "اعلان‌های دسکتاپ",
    "notif_desktop_desc": "نمایش اعلان‌های واتس‌اپ با سیستم دسکتاپ.",
    "notif_photo_title": "عکس مخاطب",
    "notif_photo_desc": "نمایش تصویر فرستنده در صورت وجود.",
    "notif_name_title": "نام مخاطب",
    "notif_name_desc": "نمایش نام فرستنده یا گروه.",
    "notif_preview_title": "پیش‌نمایش پیام",
    "notif_preview_desc": "نمایش محتوای پیام دریافتی.",
    "notif_sound_title": "صدای اعلان",
    "notif_sound_desc": "پخش صدای هشدار برای پیام‌های جدید.",
    "perm_heading": "مجوزها",
    "perm_desc": "تعیین کنید چه مجوزهایی می‌توانند خودکار به WhatsApp Web اعطا شوند.",
    "perm_notice": "مجوزهای غیرفعال در صورت نیاز درخواست خواهند شد.",
    "perm_btn_allow_all": "اجازه به همه",
    "perm_btn_remove_all": "حذف همه",
    "perm_group_device": "دسترسی به دستگاه",
    "perm_mic_title": "میکروفون",
    "perm_mic_desc": "اجازه دسترسی خودکار به میکروفون شما.",
    "perm_camera_title": "دوربین",
    "perm_camera_desc": "اجازه دسترسی خودکار به دوربین شما.",
    "perm_location_title": "موقعیت مکانی",
    "perm_location_desc": "اجازه دسترسی خودکار به موقعیت مکانی شما.",
    "perm_group_share": "اشتراک‌گذاری",
    "perm_screen_title": "اشتراک‌گذاری صفحه",
    "perm_screen_desc": "اجازه اشتراک‌گذاری خودکار صفحه نمایش.",
    "perm_screen_audio_title": "صفحه با صدا",
    "perm_screen_audio_desc": "اجازه اشتراک‌گذاری خودکار صفحه با صدا.",
    "lang_en": "English",
    "lang_zh": "中文 (普通话)",
    "lang_hi": "हिन्दी",
    "lang_es": "Español",
    "lang_fr": "Français",
    "lang_ar": "العربية",
    "lang_bn": "বাংলা",
    "lang_pt": "Português",
    "lang_ru": "Русский",
    "lang_ur": "اردو",
    "lang_id": "Bahasa Indonesia",
    "lang_de": "Deutsch",
    "lang_ja": "日本語",
    "lang_mr": "मराठी",
    "lang_te": "తెలుగు",
    "lang_tr": "Türkçe",
    "lang_ta": "தமிழ்",
    "lang_yue": "粵語 (廣東話)",
    "lang_vi": "Tiếng Việt",
    "lang_fil": "Filipino",
    "lang_ko": "한국어",
    "lang_fa": "فارسی",
    "lang_ha": "Hausa",
    "lang_sw": "Kiswahili",
    "lang_it": "Italiano"
  },
  "ha": {
    "tooltip_back": "Koma zuwa tattaunawa",
    "settings_subtitle": "Zaɓuɓɓukan duniya da kula da asusun",
    "desc_accounts": "Sarrafa asusun WhatsApp dinka ko kunna 'Kada a dame ni'.",
    "desc_appearance": "Keɓance jigon kallo da yaren manhaja.",
    "desc_notifications": "Sarrafa sirrin sanarwar tsarin na'ura.",
    "hint_theme": "Zaɓi kalar da kake so",
    "hint_language": "Zaɓi yaren manhaja",
    "tooltip_add_account": "Ƙara Asusu",
    "tooltip_report_bug": "Bayar da Rahoton Matsala",
    "tooltip_settings": "Saituna",
    "welcome": "Barka da zuwa WhatsNexus",
    "welcome_desc": "Zaɓi asusu a gefe ko ƙara sabo don farawa.",
    "settings_title": "Saituna",
    "tab_accounts": "Asusun",
    "tab_appearance": "Kamanoni",
    "tab_notifications": "Sanarwa",
    "tab_permissions": "Izini",
    "heading_accounts": "Kula da Asusu",
    "label_theme": "Jigo",
    "theme_auto": "Kai tsaye (Tsarin Na'ura)",
    "theme_light": "Fari",
    "theme_dark": "Duhu",
    "label_language": "Yare",
    "label_privacy": "Bayanin Sirri",
    "privacy_broad": "Fasali",
    "privacy_broad_desc": "Hoto, suna, saƙo da sauti.",
    "privacy_medium": "Matsakaici",
    "privacy_medium_desc": "Hoto, suna, saƙo ɓoye, da sauti.",
    "privacy_strict": "Tsanani",
    "privacy_strict_desc": "Tambarin manhaja kawai, babu sauti.",
    "tooltip_dnd": "Kada a dame ni",
    "tooltip_delete": "Goge Asusu",
    "default_account_name": "Asusu",
    "hibernation_title": "Asusu yana cikin barci",
    "hibernation_desc": "An dakatar da wannan asusun don rage nauyin na'ura.",
    "wake_button": "Tada shi",
    "btn_edit": "Gyara",
    "btn_delete": "Goge",
    "account_status_title": "Halin Asusu",
    "account_status_desc": "Asusun da aka kashe suna nan amma ba sa aiki.",
    "status_active": "Yana aiki",
    "status_inactive": "An kashe",
    "dnd_title": "Kada a dame ni",
    "dnd_desc": "Kashe sanarwar wannan asusun.",
    "untitled_account": "Asusun da babu suna",
    "card_theme_title": "Jigogi da Salo",
    "label_palette": "Kalar Zabi",
    "palette_whatsapp": "WhatsApp (Kore)",
    "palette_messenger": "Messenger (Shudi Meta)",
    "palette_telegram": "Telegram (Shudi)",
    "palette_signal": "Signal (Shudi Sarauta)",
    "palette_forest": "Daji (Zaitun)",
    "card_language_title": "Yaren Manhaja",
    "card_tray_title": "Alamar Na'ura (Tray)",
    "hint_tray": "Saita alama a maɓallin kwamfuta.",
    "label_tray_style": "Salon Alama",
    "tray_style_auto": "Na asali / Alama",
    "tray_style_light": "Haske (Fari)",
    "tray_style_dark": "Duhu (Baƙi)",
    "label_tray_badge": "Lissafin saƙonnin da ba a karanta ba",
    "hint_tray_badge": "Nuna lambar saƙonni a kan alama",
    "heading_notifications_privacy": "Sanarwa",
    "desc_notifications_privacy": "Zaɓi abubuwan da za su fito a sanarwa.",
    "label_privacy_preset": "Sirri",
    "preset_broad": "Bude",
    "preset_medium": "Matsakaici",
    "preset_strict": "Tsauri",
    "preset_custom": "Na Musamman",
    "notif_desktop_title": "Sanarwar Kwamfuta",
    "notif_desktop_desc": "Nuna sanarwar WhatsApp ta hanyar kwamfuta.",
    "notif_photo_title": "Hoton Mai Magana",
    "notif_photo_desc": "Nuna hoton mai aiko da saƙo.",
    "notif_name_title": "Sunan Mai Magana",
    "notif_name_desc": "Nuna sunan mai magana ko ƙungiya.",
    "notif_preview_title": "Duban Saƙo",
    "notif_preview_desc": "Nuna abin da ke cikin saƙo.",
    "notif_sound_title": "Sautin Sanarwa",
    "notif_sound_desc": "Bada izinin yin ƙara idan sabon saƙo ya shigo.",
    "perm_heading": "Izini",
    "perm_desc": "Saita izinin da za a ba WhatsApp Web kai tsaye.",
    "perm_notice": "Za a ci gaba da tambayar izinin da aka kashe idan buƙata ta taso.",
    "perm_btn_allow_all": "Bada Duka",
    "perm_btn_remove_all": "Cire Duka",
    "perm_group_device": "Shiga Na'ura",
    "perm_mic_title": "makirufo",
    "perm_mic_desc": "Bada damar amfani da makirufo kai tsaye.",
    "perm_camera_title": "kamara",
    "perm_camera_desc": "Bada damar amfani da kamara kai tsaye.",
    "perm_location_title": "Wuri",
    "perm_location_desc": "Bada damar duba wurin da kake.",
    "perm_group_share": "Rabawa",
    "perm_screen_title": "Raba fuska",
    "perm_screen_desc": "Bada damar raba abin da ke fuskarka.",
    "perm_screen_audio_title": "Fuska tare da sauti",
    "perm_screen_audio_desc": "Bada damar raba fuska tare da sautin na'ura.",
    "lang_en": "English",
    "lang_zh": "中文 (普通话)",
    "lang_hi": "हिन्दी",
    "lang_es": "Español",
    "lang_fr": "Français",
    "lang_ar": "العربية",
    "lang_bn": "বাংলা",
    "lang_pt": "Português",
    "lang_ru": "Русский",
    "lang_ur": "اردو",
    "lang_id": "Bahasa Indonesia",
    "lang_de": "Deutsch",
    "lang_ja": "日本語",
    "lang_mr": "मराठी",
    "lang_te": "తెలుగు",
    "lang_tr": "Türkçe",
    "lang_ta": "தமிழ்",
    "lang_yue": "粵語 (廣東話)",
    "lang_vi": "Tiếng Việt",
    "lang_fil": "Filipino",
    "lang_ko": "한국어",
    "lang_fa": "فارسی",
    "lang_ha": "Hausa",
    "lang_sw": "Kiswahili",
    "lang_it": "Italiano"
  },
  "sw": {
    "tooltip_back": "Rudi kwenye mazungumzo",
    "settings_subtitle": "Mapendeleo ya jumla na usimamizi wa akaunti",
    "desc_accounts": "Dhibiti akaunti zako za WhatsApp au uwashe Usinisumbue.",
    "desc_appearance": "Badilisha mandhari na lugha ya kiolesura.",
    "desc_notifications": "Dhibiti faragha ya yaliyomo kwenye arifa.",
    "hint_theme": "Chagua mpangilio wa rangi unaopendelea",
    "hint_language": "Chagua lugha ya kiolesura",
    "tooltip_add_account": "Ongeza Akaunti",
    "tooltip_report_bug": "Ripoti Hitilafu",
    "tooltip_settings": "Mipangilio",
    "welcome": "Karibu WhatsNexus",
    "welcome_desc": "Chagua akaunti kwenye upau wa kando au ongeza mpya ili kuanza.",
    "settings_title": "Mipangilio",
    "tab_accounts": "Akaunti",
    "tab_appearance": "Muonekano",
    "tab_notifications": "Arifa",
    "tab_permissions": "Ruhusa",
    "heading_accounts": "Usimamizi wa Akaunti",
    "label_theme": "Mandhari",
    "theme_auto": "Otomatiki (Mfumo)",
    "theme_light": "Nyeupe",
    "theme_dark": "Giza",
    "label_language": "Lugha",
    "label_privacy": "Wasifu wa Faragha",
    "privacy_broad": "Pana",
    "privacy_broad_desc": "Picha, jina, onyesho la kukagua ujumbe na sauti.",
    "privacy_medium": "Wastani",
    "privacy_medium_desc": "Picha, jina, 'Ujumbe uliofichwa' na sauti.",
    "privacy_strict": "Madhubuti",
    "privacy_strict_desc": "Aikoni ya programu, maelezo yamefichwa, kimya.",
    "tooltip_dnd": "Usinisumbue",
    "tooltip_delete": "Futa Akaunti",
    "default_account_name": "Akaunti",
    "hibernation_title": "Akaunti Imelala",
    "hibernation_desc": "Kipindi hiki kimesimamishwa ili kupunguza matumizi ya RAM.",
    "wake_button": "Amsha",
    "btn_edit": "Hariri",
    "btn_delete": "Futa",
    "account_status_title": "Hali ya akaunti",
    "account_status_desc": "Akaunti zilizolemazwa huhifadhiwa lakini hazipokei arifa.",
    "status_active": "Inafanya kazi",
    "status_inactive": "Imelemazwa",
    "dnd_title": "Usinisumbue",
    "dnd_desc": "Nyamazisha arifa kwa akaunti hii.",
    "untitled_account": "Akaunti Isiyo na Jina",
    "card_theme_title": "Mandhari & Mitindo ya Rangi",
    "label_palette": "Ubao wa Rangi",
    "palette_whatsapp": "WhatsApp (Zumaridi)",
    "palette_messenger": "Messenger (Bluu Meta)",
    "palette_telegram": "Telegram (Bluu ya Anga)",
    "palette_signal": "Signal (Bluu Kifalme)",
    "palette_forest": "Msitu (Mzeituni & Udongo)",
    "card_language_title": "Lugha ya Kiolesura",
    "card_tray_title": "Trei ya Mfumo (Aikoni ya Hali)",
    "hint_tray": "Sanidi aikoni kwenye upau wa kazi wa mfumo.",
    "label_tray_style": "Mtindo wa Aikoni ya Trei",
    "tray_style_auto": "Chaguomsingi / Chapa",
    "tray_style_light": "Nyeupe (Monochrome nyeupe)",
    "tray_style_dark": "Giza (Monochrome nyeusi)",
    "label_tray_badge": "Kihesabu cha ujumbe ambao haujasomwa",
    "hint_tray_badge": "Onyesha beji ya nambari kwenye aikoni",
    "heading_notifications_privacy": "Arifa",
    "desc_notifications_privacy": "Chagua taarifa inayoweza kuonekana kwenye arifa.",
    "label_privacy_preset": "Faragha",
    "preset_broad": "Wazi",
    "preset_medium": "Wastani",
    "preset_strict": "Madhubuti",
    "preset_custom": "Maalum",
    "notif_desktop_title": "Arifa za kompyuta",
    "notif_desktop_desc": "Onyesha arifa za WhatsApp kwa kutumia mfumo wa kompyuta.",
    "notif_photo_title": "Picha ya mwasiliani",
    "notif_photo_desc": "Onyesha picha ya mtumaji inapopatikana.",
    "notif_name_title": "Jina la mwasiliani",
    "notif_name_desc": "Onyesha jina la mtumaji au kikundi.",
    "notif_preview_title": "Onyesho la kukagua ujumbe",
    "notif_preview_desc": "Onyesha maudhui ya ujumbe uliopokelewa.",
    "notif_sound_title": "Sauti ya arifa",
    "notif_sound_desc": "Ruhusu kucheza sauti ya tahadhari kwa ujumbe mpya.",
    "perm_heading": "Ruhusa",
    "perm_desc": "Bainisha ruhusa zinazoweza kutolewa kiotomatiki kwa WhatsApp Web.",
    "perm_notice": "Ruhusa zilizolemazwa zitaendelea kuombwa inapobidi.",
    "perm_btn_allow_all": "Ruhusu zote",
    "perm_btn_remove_all": "Ondoa zote",
    "perm_group_device": "Ufikiaji wa kifaa",
    "perm_mic_title": "kipaza sauti",
    "perm_mic_desc": "Ruhusu ufikiaji wa kipaza sauti chako kiotomatiki.",
    "perm_camera_title": "kamera",
    "perm_camera_desc": "Ruhusu ufikiaji wa kamera yako kiotomatiki.",
    "perm_location_title": "Mahali",
    "perm_location_desc": "Ruhusu ufikiaji wa eneo lako kiotomatiki.",
    "perm_group_share": "Kushiriki",
    "perm_screen_title": "Kushiriki skrini",
    "perm_screen_desc": "Ruhusu kushiriki maudhui ya skrini kiotomatiki.",
    "perm_screen_audio_title": "Skrini yenye sauti",
    "perm_screen_audio_desc": "Ruhusu kushiriki skrini yenye sauti kiotomatiki.",
    "lang_en": "English",
    "lang_zh": "中文 (普通话)",
    "lang_hi": "हिन्दी",
    "lang_es": "Español",
    "lang_fr": "Français",
    "lang_ar": "العربية",
    "lang_bn": "বাংলা",
    "lang_pt": "Português",
    "lang_ru": "Русский",
    "lang_ur": "اردو",
    "lang_id": "Bahasa Indonesia",
    "lang_de": "Deutsch",
    "lang_ja": "日本語",
    "lang_mr": "मराठी",
    "lang_te": "తెలుగు",
    "lang_tr": "Türkçe",
    "lang_ta": "தமிழ்",
    "lang_yue": "粵語 (廣東話)",
    "lang_vi": "Tiếng Việt",
    "lang_fil": "Filipino",
    "lang_ko": "한국어",
    "lang_fa": "فارسی",
    "lang_ha": "Hausa",
    "lang_sw": "Kiswahili",
    "lang_it": "Italiano"
  },
  "it": {
    "tooltip_back": "Torna alle chat",
    "settings_subtitle": "Preferenze globali e gestione account",
    "desc_accounts": "Gestisci i tuoi account WhatsApp, rinominali o attiva Non disturbare.",
    "desc_appearance": "Personalizza il tema visivo e la lingua dell'interfaccia.",
    "desc_notifications": "Controlla la privacy dei contenuti delle notifiche di sistema.",
    "hint_theme": "Scegli la combinazione di colori preferita",
    "hint_language": "Seleziona la lingua dell'interfaccia",
    "tooltip_add_account": "Aggiungi account",
    "tooltip_report_bug": "Segnala un bug",
    "tooltip_settings": "Impostazioni",
    "welcome": "Benvenuto in WhatsNexus",
    "welcome_desc": "Seleziona un account dalla barra laterale o aggiungine uno nuovo per iniziare.",
    "settings_title": "Impostazioni",
    "tab_accounts": "Account",
    "tab_appearance": "Aspetto",
    "tab_notifications": "Notifiche",
    "tab_permissions": "Autorizzazioni",
    "heading_accounts": "Gestione account",
    "label_theme": "Tema",
    "theme_auto": "Automatico (Sistema)",
    "theme_light": "Chiaro",
    "theme_dark": "Scuro",
    "label_language": "Lingua",
    "label_privacy": "Profilo di privacy",
    "privacy_broad": "Ampio",
    "privacy_broad_desc": "Foto, nome, anteprima del messaggio e suono.",
    "privacy_medium": "Medio",
    "privacy_medium_desc": "Foto, nome, 'Messaggio nascosto' e suono.",
    "privacy_strict": "Rigoroso",
    "privacy_strict_desc": "Icona dell'app, dettagli nascosti, silenzioso.",
    "tooltip_dnd": "Non disturbare",
    "tooltip_delete": "Elimina account",
    "default_account_name": "Account",
    "hibernation_title": "Account in ibernazione",
    "hibernation_desc": "Questa sessione è stata sospesa per liberare RAM.",
    "wake_button": "Riattiva",
    "btn_edit": "Modifica",
    "btn_delete": "Elimina",
    "account_status_title": "Stato dell'account",
    "account_status_desc": "Gli account disattivati rimangono salvati ma non ricevono notifiche.",
    "status_active": "Attivo",
    "status_inactive": "Disattivato",
    "dnd_title": "Non disturbare",
    "dnd_desc": "Disattiva le notifiche per questo account.",
    "untitled_account": "Account senza nome",
    "card_theme_title": "Temi e stile visivo",
    "label_palette": "Tavolozza dei colori",
    "palette_whatsapp": "WhatsApp (Smeraldo)",
    "palette_messenger": "Messenger (Blu Meta)",
    "palette_telegram": "Telegram (Blu Ciano)",
    "palette_signal": "Signal (Blu Reale)",
    "palette_forest": "Foresta (Oliva e Terra)",
    "card_language_title": "Lingua dell'interfaccia",
    "card_tray_title": "Vassoio di sistema (Icona di stato)",
    "hint_tray": "Configura la presenza e lo stile dell'icona sulla barra delle applicazioni.",
    "label_tray_style": "Stile icona nel vassoio",
    "tray_style_auto": "Predefinito / Marchio",
    "tray_style_light": "Chiaro (Bianco monocromatico)",
    "tray_style_dark": "Scuro (Nero monocromatico)",
    "label_tray_badge": "Contatore messaggi non letti",
    "hint_tray_badge": "Mostra il badge numerico sull'icona",
    "heading_notifications_privacy": "Notifiche",
    "desc_notifications_privacy": "Scegli quali informazioni possono apparire nelle notifiche.",
    "label_privacy_preset": "Privacy",
    "preset_broad": "Ampia",
    "preset_medium": "Media",
    "preset_strict": "Rigorosa",
    "preset_custom": "Personalizzata",
    "notif_desktop_title": "Notifiche desktop",
    "notif_desktop_desc": "Mostra le notifiche di WhatsApp tramite il sistema desktop.",
    "notif_photo_title": "Foto contatto",
    "notif_photo_desc": "Mostra la foto del mittente se disponibile.",
    "notif_name_title": "Nome contatto",
    "notif_name_desc": "Mostra il mittente o il nome del gruppo.",
    "notif_preview_title": "Anteprima del messaggio",
    "notif_preview_desc": "Mostra il contenuto del messaggio ricevuto.",
    "notif_sound_title": "Suono di notifica",
    "notif_sound_desc": "Riproduci un suono di avviso per i nuovi messaggi.",
    "perm_heading": "Autorizzazioni",
    "perm_desc": "Definisci quali autorizzazioni possono essere concesse automaticamente a WhatsApp Web.",
    "perm_notice": "Le autorizzazioni disabilitate continueranno a essere richieste quando necessario.",
    "perm_btn_allow_all": "Consenti tutto",
    "perm_btn_remove_all": "Rimuovi tutto",
    "perm_group_device": "Accesso al dispositivo",
    "perm_mic_title": "microfono",
    "perm_mic_desc": "Consenti automaticamente l'accesso al tuo microfono.",
    "perm_camera_title": "fotocamera",
    "perm_camera_desc": "Consenti automaticamente l'accesso alla tua fotocamera.",
    "perm_location_title": "Posizione",
    "perm_location_desc": "Consenti automaticamente l'accesso alla tua posizione.",
    "perm_group_share": "Condivisione",
    "perm_screen_title": "Condividi schermo",
    "perm_screen_desc": "Consenti automaticamente la condivisione dei contenuti dello schermo.",
    "perm_screen_audio_title": "Schermo con audio",
    "perm_screen_audio_desc": "Consenti automaticamente la condivisione dello schermo con audio.",
    "lang_en": "English",
    "lang_zh": "中文 (普通话)",
    "lang_hi": "हिन्दी",
    "lang_es": "Español",
    "lang_fr": "Français",
    "lang_ar": "العربية",
    "lang_bn": "বাংলা",
    "lang_pt": "Português",
    "lang_ru": "Русский",
    "lang_ur": "اردو",
    "lang_id": "Bahasa Indonesia",
    "lang_de": "Deutsch",
    "lang_ja": "日本語",
    "lang_mr": "मराठी",
    "lang_te": "తెలుగు",
    "lang_tr": "Türkçe",
    "lang_ta": "தமிழ்",
    "lang_yue": "粵語 (廣東話)",
    "lang_vi": "Tiếng Việt",
    "lang_fil": "Filipino",
    "lang_ko": "한국어",
    "lang_fa": "فارسی",
    "lang_ha": "Hausa",
    "lang_sw": "Kiswahili",
    "lang_it": "Italiano"
  }
};

function populateLanguageSelect() {
  const langSelect = document.getElementById('language-select');
  langSelect.innerHTML = '';
  
  const currentLangCode = settings.language || 'en';
  const dict = i18n[currentLangCode] || i18n['en'];
  
  supportedLanguages.forEach(code => {
    const translatedName = dict[`lang_${code}`] || nativeNames[code];
    const nativeName = nativeNames[code];
    const option = document.createElement('option');
    option.value = code;
    option.innerText = `${translatedName} (${nativeName})`;
    langSelect.appendChild(option);
  });
  
  langSelect.value = currentLangCode;
}

function updateTranslations() {
  const lang = i18n[settings.language] || i18n['en'];
  
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (lang[key]) {
      if (el.tagName === 'INPUT' && el.type === 'text') {
        el.placeholder = lang[key];
      } else {
        el.innerText = lang[key];
      }
    }
  });

  populateLanguageSelect();
  renderSettingsAccounts(); 
}

const accountList = document.getElementById('account-list');
const addAccountBtn = document.getElementById('add-account-btn');
const reportBugBtn = document.getElementById('report-bug-btn');
const settingsBtn = document.getElementById('settings-btn');
const webviewContainer = document.getElementById('webview-container');
const emptyState = document.getElementById('empty-state');

const settingsView = document.getElementById('settings-view');
const backToChatsBtn = document.getElementById('back-to-chats-btn');
const tabBtns = document.querySelectorAll('.tab-btn');
const settingsPanels = document.querySelectorAll('.settings-panel');
const settingsAccountList = document.getElementById('settings-account-list');

const themeSelect = document.getElementById('theme-select');
const paletteSelect = document.getElementById('palette-select');
const languageSelect = document.getElementById('language-select');
const trayStyleSelect = document.getElementById('tray-style-select');
const trayBadgeToggle = document.getElementById('tray-badge-toggle');

const privacyPresetSelect = document.getElementById('privacy-preset-select');
const notifDesktopToggle = document.getElementById('notif-desktop-toggle');
const notifPhotoToggle = document.getElementById('notif-photo-toggle');
const notifNameToggle = document.getElementById('notif-name-toggle');
const notifPreviewToggle = document.getElementById('notif-preview-toggle');
const notifSoundToggle = document.getElementById('notif-sound-toggle');

// Elementos de la Pestaña Permisos
const permAllowAllBtn = document.getElementById('perm-allow-all-btn');
const permDenyAllBtn = document.getElementById('perm-deny-all-btn');
const permMicToggle = document.getElementById('perm-mic-toggle');
const permCameraToggle = document.getElementById('perm-camera-toggle');
const permLocationToggle = document.getElementById('perm-location-toggle');
const permScreenToggle = document.getElementById('perm-screen-toggle');
const permScreenAudioToggle = document.getElementById('perm-screen-audio-toggle');

// Rastreo de mensajes no leídos por cuenta para el System Tray
const accountUnreadCounts = {};

function updateTotalUnread() {
  let total = 0;
  accounts.forEach(acc => {
    if (acc.enabled !== false && !acc.dnd) {
      total += (accountUnreadCounts[acc.id] || 0);
    }
  });
  ipcRenderer.send('update-tray-badge', total);
}

function init() {
  applySettings();
  
  // Garantizar propiedad enabled en cuentas existentes
  accounts.forEach(acc => {
    if (acc.enabled === undefined) acc.enabled = true;
  });

  if (accounts.length === 0) {
    const lang = i18n[settings.language] || i18n['en'];
    addAccount(`${lang.default_account_name} 1`);
  } else {
    // Solo cuentas activadas pueden mostrarse y seleccionarse
    const enabledAccounts = accounts.filter(a => a.enabled !== false);
    const savedActiveId = localStorage.getItem('whatsNexusActiveAccount');
    const targetActiveId = (savedActiveId && enabledAccounts.some(a => a.id === savedActiveId))
      ? savedActiveId
      : (enabledAccounts.length > 0 ? enabledAccounts[0].id : null);

    renderAllSidebarAccounts();

    accounts.forEach(acc => {
      acc.lastAccessed = Date.now();
      // Lazy loading: solo instanciamos el webview si está habilitada y es el objetivo inicial
      const isTarget = (acc.id === targetActiveId && acc.enabled !== false);
      acc.hibernated = !isTarget;
      createWebviewContainer(acc, !isTarget);
    });

    if (targetActiveId) {
      activateAccount(targetActiveId);
    } else {
      activateAccount(null);
    }
  }

  // Hibernation checker every 1 minute
  setInterval(checkHibernation, 60 * 1000);
}

function saveAccounts() {
  // Garantizar persistencia limpia sin estados transitorios
  const toSave = accounts.map(a => ({
    id: a.id,
    name: a.name,
    partition: a.partition,
    avatarUrl: a.avatarUrl,
    dnd: a.dnd,
    enabled: a.enabled !== false,
    isCustomNamed: !!a.isCustomNamed
  }));
  localStorage.setItem('whatsNexusAccounts', JSON.stringify(toSave));
}

function saveSettings() {
  localStorage.setItem('whatsNexusSettings', JSON.stringify(settings));
  applySettings();
}

function applySettings() {
  const isDark = (settings.theme === 'theme-auto' || !settings.theme)
    ? (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
    : (settings.theme === 'theme-dark');

  const palette = settings.themePalette || 'whatsapp';
  
  // Establecer paleta y modo de luz/oscuridad en el body
  document.body.className = `palette-${palette} ${isDark ? 'theme-dark' : 'theme-light'}`;
  
  if (themeSelect) themeSelect.value = settings.theme || 'theme-auto';
  if (paletteSelect) paletteSelect.value = palette;
  if (trayStyleSelect) trayStyleSelect.value = settings.trayStyle || 'auto';
  if (trayBadgeToggle) trayBadgeToggle.checked = settings.trayShowBadge !== false;

  // Sincronizar UI de Notificaciones
  if (settings.notifications) {
    if (privacyPresetSelect) privacyPresetSelect.value = settings.notifications.preset || 'broad';
    if (notifDesktopToggle) notifDesktopToggle.checked = settings.notifications.desktopNotifications !== false;
    if (notifPhotoToggle) notifPhotoToggle.checked = settings.notifications.contactPhoto !== false;
    if (notifNameToggle) notifNameToggle.checked = settings.notifications.contactName !== false;
    if (notifPreviewToggle) notifPreviewToggle.checked = settings.notifications.messagePreview !== false;
    if (notifSoundToggle) notifSoundToggle.checked = settings.notifications.notificationSound !== false;

    // Atenuar controles secundarios si las notificaciones de escritorio están apagadas
    const isDesktopEnabled = settings.notifications.desktopNotifications !== false;
    document.querySelectorAll('.notif-sub-option').forEach(el => {
      if (!isDesktopEnabled) {
        el.classList.add('dimmed');
      } else {
        el.classList.remove('dimmed');
      }
    });

    // Enviar configuración a las webviews activas y sincronizar estado de audio
    document.querySelectorAll('webview').forEach(wv => {
      try {
        wv.send('update-notification-settings', settings.notifications);
        wv.send('set-dark-mode', isDark);
      } catch (_) {}
    });

    accounts.forEach(acc => {
      const wv = document.getElementById(`webview_${acc.id}`);
      if (wv) {
        try {
          const isMuted = !!acc.dnd || (settings.notifications && settings.notifications.notificationSound === false);
          wv.setAudioMuted(isMuted);
        } catch (_) {}
      }
    });
  }

  // Sincronizar modo oscuro/claro a nivel global de Chromium
  ipcRenderer.send('set-theme-mode', isDark ? 'dark' : 'light');

  // Sincronizar UI de Permisos
  if (settings.permissions) {
    if (permMicToggle) permMicToggle.checked = settings.permissions.microphone !== false;
    if (permCameraToggle) permCameraToggle.checked = !!settings.permissions.camera;
    if (permLocationToggle) permLocationToggle.checked = !!settings.permissions.location;
    if (permScreenToggle) permScreenToggle.checked = settings.permissions.screenShare !== false;
    if (permScreenAudioToggle) permScreenAudioToggle.checked = !!settings.permissions.screenShareAudio;

    // Sincronizar permisos con el proceso principal
    ipcRenderer.send('update-permission-settings', settings.permissions);
  }

  // Sincronizar apariencia de la bandeja con el proceso principal
  ipcRenderer.send('update-tray-settings', {
    style: settings.trayStyle || 'auto',
    showBadge: settings.trayShowBadge !== false
  });
  
  updateTranslations();
  updateTotalUnread();
}

function addAccount(name = null) {
  const accountId = 'acc_' + Date.now();
  const lang = i18n[settings.language] || i18n['en'];
  const accountName = name || `${lang.default_account_name} ${accounts.length + 1}`;
  
  const account = {
    id: accountId,
    name: accountName,
    partition: `persist:${accountId}`,
    avatarUrl: null,
    dnd: false,
    enabled: true,
    lastAccessed: Date.now(),
    hibernated: false
  };
  
  accounts.push(account);
  saveAccounts();
  
  renderAllSidebarAccounts();
  createWebviewContainer(account);
  
  if (!name) {
    activateAccount(accountId);
  }
  renderSettingsAccounts();
}

function getAvatarHtml(account) {
  if (account.avatarUrl) {
    return `<img src="${account.avatarUrl}" alt="Avatar">`;
  }
  return `<i class="fa-solid fa-circle-user"></i>`;
}

function renderAllSidebarAccounts() {
  accountList.innerHTML = '';
  accounts.forEach(acc => {
    if (acc.enabled !== false) {
      renderAccountSidebarItem(acc);
    }
  });

  if (activeAccountId) {
    document.querySelectorAll('.account-item').forEach(item => {
      if (item.dataset.id === activeAccountId) item.classList.add('active');
      else item.classList.remove('active');
    });
  }
}

// Globo de texto / Tooltip flotante desacoplado del overflow de la sidebar
const floatingTooltip = document.createElement('div');
floatingTooltip.className = 'sidebar-floating-tooltip';
document.body.appendChild(floatingTooltip);

function attachSidebarTooltip(el, account) {
  el.addEventListener('mouseenter', () => {
    const rect = el.getBoundingClientRect();
    const currentAcc = accounts.find(a => a.id === account.id) || account;
    floatingTooltip.innerText = currentAcc.name;
    floatingTooltip.style.top = `${rect.top + rect.height / 2}px`;
    floatingTooltip.style.left = `${rect.right + 12}px`;
    floatingTooltip.classList.add('visible');
  });
  el.addEventListener('mouseleave', () => {
    floatingTooltip.classList.remove('visible');
  });
}

function renderAccountSidebarItem(account) {
  const li = document.createElement('li');
  li.className = 'account-item';
  li.dataset.id = account.id;
  li.title = account.name;
  
  li.innerHTML = `
    <div class="account-avatar" id="avatar_${account.id}">
      ${getAvatarHtml(account)}
    </div>
  `;

  attachSidebarTooltip(li, account);
  
  li.addEventListener('click', () => {
    floatingTooltip.classList.remove('visible');
    activateAccount(account.id);
  });
  
  accountList.appendChild(li);
}

function updateAccountSidebarItem(account) {
  const avatarDiv = document.getElementById(`avatar_${account.id}`);
  if (avatarDiv) {
    avatarDiv.innerHTML = getAvatarHtml(account);
  }
  const li = document.querySelector(`.account-item[data-id="${account.id}"]`);
  if (li) {
    li.title = account.name;
  }
}

function createWebviewContainer(account, startHibernated = false) {
  const container = document.createElement('div');
  container.id = `container_${account.id}`;
  container.className = 'account-container hidden'; // By default hidden
  
  const lang = i18n[settings.language] || i18n['en'];
  
  // Overlay de Hibernación (Visible si startHibernated es true)
  const overlay = document.createElement('div');
  overlay.className = `hibernation-overlay ${startHibernated ? '' : 'hidden'}`;
  overlay.id = `hibernation_${account.id}`;
  overlay.innerHTML = `
    <i class="fa-solid fa-moon hibernation-icon"></i>
    <h3 data-i18n="hibernation_title">${lang.hibernation_title}</h3>
    <p data-i18n="hibernation_desc">${lang.hibernation_desc}</p>
    <button class="wake-btn" onclick="wakeWebview('${account.id}')" data-i18n="wake_button">${lang.wake_button}</button>
  `;
  
  container.appendChild(overlay);
  webviewContainer.appendChild(container);

  // Solo crear el webview en el DOM si NO empieza hibernado (Lazy Loading)
  if (!startHibernated) {
    buildWebviewDOM(account, container);
  }
}

function buildWebviewDOM(account, parentContainer) {
  const webview = document.createElement('webview');
  webview.id = `webview_${account.id}`;
  webview.setAttribute('src', 'https://web.whatsapp.com/');
  webview.setAttribute('partition', account.partition);
  webview.setAttribute('webpreferences', 'backgroundThrottling=yes, contextIsolation=no'); // CRITICO: Throttling de memoria y acceso a contexto principal
  
  const preloadPath = path.join(__dirname, '..', 'preload.js');
  webview.setAttribute('preload', `file://${preloadPath}`);
  webview.setAttribute('useragent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  webview.className = 'webview-active';

  // Sincronizar configuración de notificaciones, DND y tema al cargar la sesión
  webview.addEventListener('dom-ready', () => {
    const isDark = (settings.theme === 'theme-auto' || !settings.theme)
      ? (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
      : (settings.theme === 'theme-dark');
    try {
      if (settings && settings.notifications) {
        webview.send('update-notification-settings', settings.notifications);
      }
      webview.send('update-account-settings', { dnd: !!account.dnd });
      webview.send('set-dark-mode', isDark);
      webview.setAudioMuted(!!account.dnd || (settings.notifications && settings.notifications.notificationSound === false));
    } catch (_) {}
  });

  // Detección reactiva de mensajes no leídos mediante el título de la página
  webview.addEventListener('page-title-updated', (e) => {
    const match = e.title.match(/\((\d+)\)/);
    const unread = match ? parseInt(match[1], 10) : 0;
    accountUnreadCounts[account.id] = unread;
    updateTotalUnread();
  });

  webview.addEventListener('ipc-message', (event) => {
    if (event.channel === 'profile-picture-updated') {
      const imgUrl = event.args[0];
      const acc = accounts.find(a => a.id === account.id);
      if (acc && acc.avatarUrl !== imgUrl) {
        acc.avatarUrl = imgUrl;
        saveAccounts();
        updateAccountSidebarItem(acc);
        renderSettingsAccounts();
      }
    } else if (event.channel === 'profile-name-updated') {
      const newName = event.args[0];
      const acc = accounts.find(a => a.id === account.id);
      if (acc && newName && acc.name !== newName) {
        const lang = i18n[settings.language] || i18n['en'];
        const isGenericName = !acc.isCustomNamed || 
                              acc.name.startsWith(lang.default_account_name) ||
                              acc.name.startsWith('Account') ||
                              acc.name.startsWith('Cuenta') ||
                              acc.name.startsWith('+');
        if (isGenericName) {
          acc.name = newName;
          saveAccounts();
          updateAccountSidebarItem(acc);
          renderSettingsAccounts();
        }
      }
    } else if (event.channel === 'guest-notification') {
      const notifData = event.args[0] || {};
      const acc = accounts.find(a => a.id === account.id);

      // 1. REGLA AUTORITARIA: Si la cuenta está en NO MOLESTAR o desactivada, descartar de raíz
      if (!acc || acc.dnd || acc.enabled === false) {
        return;
      }

      // 2. Si las notificaciones de escritorio están apagadas globalmente, descartar
      if (!settings.notifications || settings.notifications.desktopNotifications === false) {
        return;
      }

      // 3. Aplicar filtros de privacidad de forma estricta
      let title = notifData.title || 'WhatsApp';
      let body = notifData.body || '';
      let iconDataUrl = notifData.iconDataUrl || null;
      let silent = false;

      // Nombre de contacto
      if (settings.notifications.contactName === false) {
        title = 'WhatsNexus';
      }

      // Vista previa del mensaje
      if (settings.notifications.messagePreview === false) {
        body = '•••';
      }

      // Foto de contacto
      if (settings.notifications.contactPhoto === false) {
        iconDataUrl = null;
      }

      // Sonido de notificación
      if (settings.notifications.notificationSound === false) {
        silent = true;
      }

      // Despachar la notificación nativa con avatar circular al proceso principal
      ipcRenderer.send('show-native-notification', {
        title,
        body,
        iconDataUrl,
        silent,
        accountId: account.id
      });
    }
  });

  parentContainer.appendChild(webview);
}

function checkHibernation() {
  const now = Date.now();
  accounts.forEach(acc => {
    // Si la cuenta NO está activa en este momento y pasó el tiempo de inactividad
    if (activeAccountId !== acc.id && !acc.hibernated && (now - acc.lastAccessed > HIBERNATION_TIMEOUT)) {
      hibernateWebview(acc.id);
    }
  });
}

function hibernateWebview(id) {
  const acc = accounts.find(a => a.id === id);
  if (!acc) return;
  
  const webview = document.getElementById(`webview_${id}`);
  if (webview) {
    webview.remove(); // DESTRUCCIÓN TOTAL: Libera RAM.
  }
  accountUnreadCounts[id] = 0;
  updateTotalUnread();
  
  const overlay = document.getElementById(`hibernation_${id}`);
  if (overlay) {
    overlay.classList.remove('hidden');
  }
  
  acc.hibernated = true;
  console.log(`[Hibernation] Cuenta ${id} hibernada para ahorrar memoria.`);
}

window.wakeWebview = (id) => {
  const acc = accounts.find(a => a.id === id);
  if (!acc) return;
  
  acc.lastAccessed = Date.now();
  
  if (acc.hibernated) {
    const overlay = document.getElementById(`hibernation_${id}`);
    if (overlay) overlay.classList.add('hidden');
    
    const container = document.getElementById(`container_${id}`);
    if (container) buildWebviewDOM(acc, container);
    
    acc.hibernated = false;
    console.log(`[Hibernation] Cuenta ${id} despertada.`);
  }
};

function closeSettingsView() {
  if (settingsView) settingsView.classList.add('hidden');
  if (settingsBtn) settingsBtn.classList.remove('active');
}

function openSettingsView() {
  // Deactivate active account tab in sidebar and hide webviews
  document.querySelectorAll('.account-item').forEach(item => item.classList.remove('active'));
  document.querySelectorAll('.account-container').forEach(container => container.classList.add('hidden'));
  emptyState.classList.add('hidden');

  // Activate settings button in sidebar
  if (settingsBtn) settingsBtn.classList.add('active');
  if (settingsView) settingsView.classList.remove('hidden');

  renderSettingsAccounts();
}

function activateAccount(id) {
  closeSettingsView();

  if (!id) {
    activeAccountId = null;
    localStorage.removeItem('whatsNexusActiveAccount');
    document.querySelectorAll('.account-item').forEach(item => item.classList.remove('active'));
    document.querySelectorAll('.account-container').forEach(container => container.classList.add('hidden'));
    emptyState.classList.remove('hidden');
    return;
  }
  
  const targetAcc = accounts.find(a => a.id === id);
  if (!targetAcc || targetAcc.enabled === false) {
    const nextActive = accounts.find(a => a.enabled !== false);
    if (nextActive) {
      return activateAccount(nextActive.id);
    } else {
      return activateAccount(null);
    }
  }

  activeAccountId = id;
  localStorage.setItem('whatsNexusActiveAccount', id);
  emptyState.classList.add('hidden');

  document.querySelectorAll('.account-item').forEach(item => {
    if (item.dataset.id === id) item.classList.add('active');
    else item.classList.remove('active');
  });
  
  document.querySelectorAll('.account-container').forEach(container => {
    if (container.id === `container_${id}`) container.classList.remove('hidden');
    else container.classList.add('hidden');
  });
  
  if (targetAcc) {
    targetAcc.lastAccessed = Date.now();
    if (targetAcc.hibernated) wakeWebview(id);
  }
}

function deleteAccount(id) {
  accounts = accounts.filter(a => a.id !== id);
  saveAccounts();
  
  const container = document.getElementById(`container_${id}`);
  if (container) container.remove();
  
  renderAllSidebarAccounts();
  
  const isSettingsOpen = settingsView && !settingsView.classList.contains('hidden');
  if (activeAccountId === id) {
    const enabledAccounts = accounts.filter(a => a.enabled !== false);
    if (enabledAccounts.length > 0) {
      activeAccountId = enabledAccounts[0].id;
      localStorage.setItem('whatsNexusActiveAccount', activeAccountId);
      if (!isSettingsOpen) {
        activateAccount(activeAccountId);
      }
    } else {
      activeAccountId = null;
      localStorage.removeItem('whatsNexusActiveAccount');
      if (!isSettingsOpen) {
        emptyState.classList.remove('hidden');
      }
    }
  }
  renderSettingsAccounts();
}

window.setAccountStatus = function(id, enabled) {
  const acc = accounts.find(a => a.id === id);
  if (!acc) return;
  
  acc.enabled = enabled;
  saveAccounts();
  
  if (!enabled) {
    // Al desactivar: pausar y remover webview para no consumir RAM ni recibir notificaciones
    hibernateWebview(id);
    
    if (activeAccountId === id) {
      const remaining = accounts.filter(a => a.enabled !== false);
      if (remaining.length > 0) {
        activeAccountId = remaining[0].id;
        localStorage.setItem('whatsNexusActiveAccount', activeAccountId);
      } else {
        activeAccountId = null;
        localStorage.removeItem('whatsNexusActiveAccount');
      }
    }
  } else {
    // Al activar: si no hay cuenta activa, seleccionarla
    if (!activeAccountId) {
      activeAccountId = id;
      localStorage.setItem('whatsNexusActiveAccount', id);
    }
  }

  renderAllSidebarAccounts();
  renderSettingsAccounts();
  updateTotalUnread();
};

window.toggleEditAccountName = function(id) {
  const displayEl = document.getElementById(`name_display_${id}`);
  const inputEl = document.getElementById(`name_input_${id}`);
  if (!displayEl || !inputEl) return;

  if (inputEl.classList.contains('hidden')) {
    displayEl.classList.add('hidden');
    inputEl.classList.remove('hidden');
    inputEl.focus();
    inputEl.select();
  } else {
    saveAccountName(id);
  }
};

window.saveAccountName = function(id) {
  const acc = accounts.find(a => a.id === id);
  const displayEl = document.getElementById(`name_display_${id}`);
  const inputEl = document.getElementById(`name_input_${id}`);
  if (!acc || !displayEl || !inputEl) return;

  const lang = i18n[settings.language] || i18n['en'];
  const newName = inputEl.value.trim() || lang.untitled_account || 'Cuenta sin nombre';
  acc.name = newName;
  acc.isCustomNamed = true;
  inputEl.value = newName;
  displayEl.innerText = newName;
  
  displayEl.classList.remove('hidden');
  inputEl.classList.add('hidden');
  
  saveAccounts();
  updateAccountSidebarItem(acc);
};

settingsBtn.addEventListener('click', () => {
  openSettingsView();
});

if (backToChatsBtn) {
  backToChatsBtn.addEventListener('click', () => {
    const enabledAccounts = accounts.filter(a => a.enabled !== false);
    if (activeAccountId && enabledAccounts.some(a => a.id === activeAccountId)) {
      activateAccount(activeAccountId);
    } else if (enabledAccounts.length > 0) {
      activateAccount(enabledAccounts[0].id);
    } else {
      closeSettingsView();
      emptyState.classList.remove('hidden');
    }
  });
}

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    settingsPanels.forEach(p => p.classList.remove('active'));
    
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

function renderSettingsAccounts() {
  settingsAccountList.innerHTML = '';
  const lang = i18n[settings.language] || i18n['en'];
  
  accounts.forEach(acc => {
    const isEnabled = acc.enabled !== false;
    const isDnd = !!acc.dnd;
    const accountTitle = acc.name || lang.untitled_account || 'Cuenta sin nombre';

    const card = document.createElement('li');
    card.dataset.id = acc.id;
    
    // Si la cuenta está DESACTIVADA: tarjeta compacta mostrando solo avatar, nombre y switch de activación
    if (!isEnabled) {
      card.className = 'settings-account-card account-disabled account-compact';
      card.innerHTML = `
        <div class="account-card-header">
          <div class="account-card-identity">
            <div class="account-avatar">${getAvatarHtml(acc)}</div>
            <div class="account-name-container">
              <span class="account-name-display">${accountTitle}</span>
            </div>
          </div>
          <div class="account-card-actions" style="display: flex; align-items: center; gap: 12px;">
            <span class="account-status-badge badge-inactive">${lang.status_inactive}</span>
            <label class="switch">
              <input type="checkbox" onchange="setAccountStatus('${acc.id}', this.checked)">
              <span class="switch-slider"></span>
            </label>
          </div>
        </div>
      `;
      settingsAccountList.appendChild(card);
      return;
    }

    // Cuenta ACTIVADA: Tarjeta completa con Editar, Eliminar, Estado y No Molestar
    card.className = 'settings-account-card';
    card.innerHTML = `
      <div class="account-card-header">
        <div class="account-card-identity">
          <div class="account-avatar">${getAvatarHtml(acc)}</div>
          <div class="account-name-container">
            <span class="account-name-display" id="name_display_${acc.id}">${accountTitle}</span>
            <input type="text" class="account-name-input hidden" id="name_input_${acc.id}" value="${accountTitle}">
          </div>
        </div>
        <div class="account-card-actions">
          <button class="btn-card-action edit-btn" onclick="toggleEditAccountName('${acc.id}')">
            <span>${lang.btn_edit}</span>
          </button>
          <button class="btn-card-action delete-btn" onclick="deleteAccount('${acc.id}')">
            <span>${lang.btn_delete}</span>
          </button>
        </div>
      </div>

      <!-- Fila: Estado de la cuenta -->
      <div class="account-card-row">
        <div class="account-row-info">
          <h4 class="account-row-title">${lang.account_status_title}</h4>
          <p class="account-row-desc">${lang.account_status_desc}</p>
        </div>
        <div class="account-row-control" style="display: flex; align-items: center; gap: 12px;">
          <span class="account-status-badge badge-active">${lang.status_active}</span>
          <label class="switch">
            <input type="checkbox" checked onchange="setAccountStatus('${acc.id}', this.checked)">
            <span class="switch-slider"></span>
          </label>
        </div>
      </div>

      <!-- Fila: No molestar -->
      <div class="account-card-row">
        <div class="account-row-info">
          <h4 class="account-row-title">${lang.dnd_title}</h4>
          <p class="account-row-desc">${lang.dnd_desc}</p>
        </div>
        <div class="account-row-control">
          <label class="switch">
            <input type="checkbox" id="dnd_switch_${acc.id}" ${isDnd ? 'checked' : ''} onchange="toggleDND('${acc.id}')">
            <span class="switch-slider"></span>
          </label>
        </div>
      </div>
    `;

    const input = card.querySelector(`#name_input_${acc.id}`);
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          saveAccountName(acc.id);
        } else if (e.key === 'Escape') {
          input.value = acc.name;
          card.querySelector(`#name_display_${acc.id}`).classList.remove('hidden');
          input.classList.add('hidden');
        }
      });
      input.addEventListener('blur', () => {
        saveAccountName(acc.id);
      });
    }

    settingsAccountList.appendChild(card);
  });
}

window.toggleDND = (id) => {
  const acc = accounts.find(a => a.id === id);
  if (acc) {
    acc.dnd = !acc.dnd;
    saveAccounts();
    renderSettingsAccounts();
    updateTotalUnread();

    const wv = document.getElementById(`webview_${acc.id}`);
    if (wv) {
      try {
        wv.send('update-account-settings', { dnd: !!acc.dnd });
        wv.setAudioMuted(!!acc.dnd || (settings.notifications && settings.notifications.notificationSound === false));
      } catch (_) {}
    }
  }
};

window.deleteAccount = deleteAccount;

if (themeSelect) {
  themeSelect.addEventListener('change', (e) => {
    settings.theme = e.target.value;
    saveSettings();
  });
}

if (paletteSelect) {
  paletteSelect.addEventListener('change', (e) => {
    settings.themePalette = e.target.value;
    saveSettings();
  });
}

if (trayStyleSelect) {
  trayStyleSelect.addEventListener('change', (e) => {
    settings.trayStyle = e.target.value;
    saveSettings();
  });
}

if (trayBadgeToggle) {
  trayBadgeToggle.addEventListener('change', (e) => {
    settings.trayShowBadge = e.target.checked;
    saveSettings();
  });
}

languageSelect.addEventListener('change', (e) => {
  settings.language = e.target.value;
  saveSettings();
});

// Manejo de Plantillas de Privacidad (Amplio, Medio, Estricto, Personalizado)
if (privacyPresetSelect) {
  privacyPresetSelect.addEventListener('change', (e) => {
    const preset = e.target.value;
    settings.notifications.preset = preset;

    if (preset === 'broad') {
      settings.notifications.contactPhoto = true;
      settings.notifications.contactName = true;
      settings.notifications.messagePreview = true;
      settings.notifications.notificationSound = true;
    } else if (preset === 'medium') {
      settings.notifications.contactPhoto = true;
      settings.notifications.contactName = true;
      settings.notifications.messagePreview = false;
      settings.notifications.notificationSound = true;
    } else if (preset === 'strict') {
      settings.notifications.contactPhoto = false;
      settings.notifications.contactName = false;
      settings.notifications.messagePreview = false;
      settings.notifications.notificationSound = false;
    }
    saveSettings();
  });
}

function handleIndividualNotificationToggle() {
  settings.notifications.contactPhoto = notifPhotoToggle ? notifPhotoToggle.checked : true;
  settings.notifications.contactName = notifNameToggle ? notifNameToggle.checked : true;
  settings.notifications.messagePreview = notifPreviewToggle ? notifPreviewToggle.checked : true;
  settings.notifications.notificationSound = notifSoundToggle ? notifSoundToggle.checked : true;

  // Si el usuario mueve una de las opciones manualmente, automáticamente cambia a 'personalizado'
  settings.notifications.preset = 'custom';
  saveSettings();
}

[notifPhotoToggle, notifNameToggle, notifPreviewToggle, notifSoundToggle].forEach(toggle => {
  if (toggle) {
    toggle.addEventListener('change', handleIndividualNotificationToggle);
  }
});

if (notifDesktopToggle) {
  notifDesktopToggle.addEventListener('change', () => {
    settings.notifications.desktopNotifications = notifDesktopToggle.checked;
    saveSettings();
  });
}


// ========================================================
// Manejadores de la Pestaña Permisos
// ========================================================
function handlePermissionToggle(key, toggleEl) {
  if (toggleEl) {
    toggleEl.addEventListener('change', () => {
      settings.permissions[key] = toggleEl.checked;
      saveSettings();
    });
  }
}

handlePermissionToggle('microphone', permMicToggle);
handlePermissionToggle('camera', permCameraToggle);
handlePermissionToggle('location', permLocationToggle);
handlePermissionToggle('screenShare', permScreenToggle);
handlePermissionToggle('screenShareAudio', permScreenAudioToggle);

if (permAllowAllBtn) {
  permAllowAllBtn.addEventListener('click', () => {
    settings.permissions.microphone = true;
    settings.permissions.camera = true;
    settings.permissions.location = true;
    settings.permissions.screenShare = true;
    settings.permissions.screenShareAudio = true;
    saveSettings();
  });
}

if (permDenyAllBtn) {
  permDenyAllBtn.addEventListener('click', () => {
    settings.permissions.microphone = false;
    settings.permissions.camera = false;
    settings.permissions.location = false;
    settings.permissions.screenShare = false;
    settings.permissions.screenShareAudio = false;
    saveSettings();
  });
}

addAccountBtn.addEventListener('click', () => addAccount());

if (reportBugBtn) {
  reportBugBtn.addEventListener('click', () => {
    let currentVer = '0.5.1';
    try { currentVer = require('../../package.json').version || '0.5.1'; } catch (_) {}
    const osInfo = `${process.platform} ${process.arch}`;
    const electronVer = process.versions.electron || 'N/A';
    const chromeVer = process.versions.chrome || 'N/A';
    const lang = settings.language || 'es';
    const theme = settings.theme || 'theme-dark';
    const totalAccounts = accounts.length;

    const issueTitle = encodeURIComponent('[Bug]: ');
    const issueBody = encodeURIComponent(
`### 🐛 Descripción del Problema
<!-- Explica de forma clara qué está sucediendo o qué falló -->


### 🔁 Pasos para Reproducir
1. Ir a '...'
2. Hacer clic en '...'
3. Ver el error

### ✅ Comportamiento Esperado
<!-- Qué esperabas que sucediera -->


---

### 💻 Información de Diagnóstico
- **Versión de WhatsNexus:** v${currentVer} (Beta)
- **Sistema Operativo:** ${osInfo}
- **Electron:** v${electronVer}
- **Chromium:** v${chromeVer}
- **Idioma de la App:** ${lang}
- **Tema Actual:** ${theme}
- **Cuentas Configuradas:** ${totalAccounts}
`
    );

    const url = `https://github.com/Sentinel-Mexico/WhatsNexus-Dekstop/issues/new?title=${issueTitle}&body=${issueBody}`;
    shell.openExternal(url);
  });
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (settings.theme === 'theme-auto') applySettings();
});

document.addEventListener('DOMContentLoaded', init);

// Enfocar cuenta al hacer click en una notificación nativa
ipcRenderer.on('select-account', (event, accountId) => {
  if (accountId) {
    activateAccount(accountId);
  }
});
