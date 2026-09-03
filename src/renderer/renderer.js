const path = require('path');
const { shell, ipcRenderer } = require('electron');

// Idiomas soportados
const supportedLanguages = ['en', 'es', 'hi', 'ar', 'bn', 'pt', 'ru', 'ur', 'id', 'fr'];

// Nombres nativos de cada idioma
const nativeNames = {
  en: "English", es: "Español", hi: "हिन्दी", ar: "العربية", bn: "বাংলা", pt: "Português", ru: "Русский", ur: "اردو", id: "Bahasa Indonesia", fr: "Français"
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
    cameraAndMic: false,
    location: false,
    screenShare: true,
    screenShareAudio: false
  };
}

// Diccionario de Traducciones
const i18n = {
  en: {
    tab_permissions: "Permissions", perm_heading: "Permissions", perm_desc: "Define which permissions can be automatically granted to WhatsApp Web.", perm_notice: "Disabled permissions will still be requested when needed.", perm_btn_allow_all: "Allow all", perm_btn_remove_all: "Remove all", perm_group_device: "Device access", perm_mic_title: "microphone", perm_mic_desc: "Automatically allow access to your microphone.", perm_camera_title: "camera", perm_camera_desc: "Automatically allow access to your camera.", perm_cam_mic_title: "Camera and microphone", perm_cam_mic_desc: "Automatically allow simultaneous access to camera and microphone.", perm_location_title: "Location", perm_location_desc: "Automatically allow access to your location.", perm_group_share: "Sharing", perm_screen_title: "Screen sharing", perm_screen_desc: "Automatically allow sharing screen content.", perm_screen_audio_title: "Screen with audio", perm_screen_audio_desc: "Automatically allow screen sharing with audio.", 
    tooltip_back: "Back to chats", settings_subtitle: "Global preferences & account management", desc_accounts: "Manage your WhatsApp accounts, rename them, or toggle Do Not Disturb.", desc_appearance: "Customize visual theme and interface language.", desc_notifications: "Control content privacy for system notifications.", hint_theme: "Choose your preferred color scheme", hint_language: "Select interface language",
    tooltip_add_account: "Add Account", tooltip_report_bug: "Report Bug", tooltip_settings: "Settings", welcome: "Welcome to WhatsNexus", welcome_desc: "Select an account or add a new one.", settings_title: "Settings", tab_accounts: "Accounts", tab_appearance: "Appearance", tab_notifications: "Notifications", heading_accounts: "Account Management", label_theme: "Theme", theme_auto: "Auto (System)", theme_light: "Light", theme_dark: "Dark", label_language: "Language", label_privacy: "Privacy Profile", privacy_broad: "Broad", privacy_broad_desc: "Photo, name, message preview, and sound.", privacy_medium: "Medium", privacy_medium_desc: "Photo, name, 'Hidden message', and sound.", privacy_strict: "Strict", privacy_strict_desc: "App icon, 'Hidden contact', 'Hidden message', no sound.", tooltip_dnd: "Do Not Disturb", tooltip_delete: "Delete Account", default_account_name: "Account",
    lang_en: "English", lang_es: "Spanish", lang_hi: "Hindi", lang_ar: "Arabic", lang_bn: "Bengali", lang_pt: "Portuguese", lang_ru: "Russian", lang_ur: "Urdu", lang_id: "Indonesian", lang_fr: "French",
    hibernation_title: "Account in Hibernation", hibernation_desc: "This session has been paused to free up RAM.", wake_button: "Wake Up", btn_edit: "Edit", btn_delete: "Delete", account_status_title: "Account status", account_status_desc: "Deactivated accounts remain saved, but are not loaded nor receive notifications.", status_active: "Active", status_inactive: "Deactivated", dnd_title: "Do not disturb", dnd_desc: "Mute notifications for this account.", untitled_account: "Untitled Account", card_theme_title: "Themes & Visual Style", label_palette: "Color Palette", palette_whatsapp: "WhatsApp (Emerald)", palette_messenger: "Messenger (Meta Blue)", palette_telegram: "Telegram (Cyan Blue)", palette_signal: "Signal (Royal Blue)", palette_forest: "Forest (Olive & Earth)", card_language_title: "Interface Language", card_tray_title: "System Tray (Status Icon)", hint_tray: "Configure tray presence and style on system taskbar.", label_tray_style: "Tray Icon Style", tray_style_auto: "Default / Brand", tray_style_light: "Light (Monochrome white)", tray_style_dark: "Dark (Monochrome black)", label_tray_badge: "Unread Message Counter", hint_tray_badge: "Show numerical badge on tray icon", heading_notifications_privacy: "Notifications", desc_notifications_privacy: "Choose what information can appear in notifications.", label_privacy_preset: "Privacy", preset_broad: "Broad", preset_medium: "Medium", preset_strict: "Strict", preset_custom: "Custom", notif_desktop_title: "Desktop notifications", notif_desktop_desc: "Display WhatsApp notifications using desktop notification system.", notif_photo_title: "Contact photo", notif_photo_desc: "Display sender photo when available.", notif_name_title: "Contact name", notif_name_desc: "Display sender or group name.", notif_preview_title: "Message preview", notif_preview_desc: "Display received message content.", notif_sound_title: "Notification sound", notif_sound_desc: "Allow desktop to play an alert sound for new messages.", heading_app_messages: "WhatsNexus Messages", desc_app_messages: "Control occasional messages displayed by the app itself.", notif_support_title: "Support reminders", notif_support_desc: "Occasionally display messages supporting WhatsNexus development."
  },
  es: {
    tab_permissions: "Permisos", perm_heading: "Permisos", perm_desc: "Defina qué permisos se pueden otorgar automáticamente a WhatsApp Web.", perm_notice: "Se seguirán solicitando permisos deshabilitados cuando sea necesario.", perm_btn_allow_all: "Permitir todo", perm_btn_remove_all: "Quitar todo", perm_group_device: "Acceso al dispositivo", perm_mic_title: "micrófono", perm_mic_desc: "Permita automáticamente el acceso a su micrófono.", perm_camera_title: "cámara", perm_camera_desc: "Permita automáticamente el acceso a su cámara.", perm_cam_mic_title: "Cámara y micrófono", perm_cam_mic_desc: "Permitir automáticamente el acceso simultáneo a la cámara y al micrófono.", perm_location_title: "Ubicación", perm_location_desc: "Permitir automáticamente el acceso a su ubicación.", perm_group_share: "Compartir", perm_screen_title: "Compartir pantalla", perm_screen_desc: "Permitir automáticamente compartir contenidos de la pantalla.", perm_screen_audio_title: "Pantalla con audio", perm_screen_audio_desc: "Permitir automáticamente compartir pantalla con audio.", 
    tooltip_back: "Volver a los chats", settings_subtitle: "Preferencias globales y gestión de cuentas", desc_accounts: "Administra tus perfiles de WhatsApp, cambia sus nombres o activa el modo No Molestar.", desc_appearance: "Personaliza el tema visual y el idioma de la aplicación.", desc_notifications: "Controla la privacidad del contenido en las notificaciones del sistema.", hint_theme: "Elige la combinación de colores que prefieras", hint_language: "Selecciona el idioma de la interfaz",
    tooltip_add_account: "Añadir Cuenta", tooltip_report_bug: "Reportar Error", tooltip_settings: "Configuración", welcome: "Bienvenido a WhatsNexus", welcome_desc: "Selecciona una cuenta en la barra lateral o añade una nueva para comenzar.", settings_title: "Configuración", tab_accounts: "Cuentas", tab_appearance: "Apariencia", tab_notifications: "Notificaciones", heading_accounts: "Gestión de Cuentas", label_theme: "Tema", theme_auto: "Automático (Sistema)", theme_light: "Claro", theme_dark: "Oscuro", label_language: "Idioma", label_privacy: "Perfil de Privacidad", privacy_broad: "Amplio", privacy_broad_desc: "Foto, nombre, vista previa del mensaje y sonido.", privacy_medium: "Medio", privacy_medium_desc: "Foto, nombre, 'Mensaje oculto' y sonido.", privacy_strict: "Estricto", privacy_strict_desc: "Icono de app, 'Contacto oculto', 'Mensaje oculto', sin sonido.", tooltip_dnd: "No Molestar", tooltip_delete: "Eliminar Cuenta", default_account_name: "Cuenta",
    lang_en: "Inglés", lang_es: "Español", lang_hi: "Hindi", lang_ar: "Árabe", lang_bn: "Bengalí", lang_pt: "Portugués", lang_ru: "Ruso", lang_ur: "Urdu", lang_id: "Indonesio", lang_fr: "Francés",
    hibernation_title: "Cuenta en Hibernación", hibernation_desc: "Esta sesión se ha pausado para liberar memoria RAM.", wake_button: "Despertar", btn_edit: "Editar", btn_delete: "Eliminar", account_status_title: "Estado de la cuenta", account_status_desc: "Las cuentas desactivadas permanecen guardadas, pero no se cargan ni reciben notificaciones.", status_active: "Activada", status_inactive: "Desactivada", dnd_title: "No molestar", dnd_desc: "Silencia las notificaciones de esta cuenta.", untitled_account: "Cuenta sin nombre", card_theme_title: "Temas y Estilo Visual", label_palette: "Paleta de Color", palette_whatsapp: "WhatsApp (Esmeralda)", palette_messenger: "Messenger (Azul Eléctrico)", palette_telegram: "Telegram (Celeste Ciano)", palette_signal: "Signal (Azul Real)", palette_forest: "Bosque (Oliva y Tierra)", card_language_title: "Idioma de la Interfaz", card_tray_title: "Bandeja del Sistema (Icono de Estado)", hint_tray: "Configura la presencia y estilo del icono en la barra de tareas o panel de notificaciones.", label_tray_style: "Estilo del Icono en Bandeja", tray_style_auto: "Predeterminado / Marca", tray_style_light: "Claro (Monocromático blanco)", tray_style_dark: "Oscuro (Monocromático negro)", label_tray_badge: "Contador de mensajes no leídos", hint_tray_badge: "Mostrar badge numérico en el icono", heading_notifications_privacy: "Notificaciones", desc_notifications_privacy: "Elige qué información puede aparecer en las notificaciones.", label_privacy_preset: "Privacidad", preset_broad: "Amplio", preset_medium: "Medio", preset_strict: "Estricto", preset_custom: "Personalizado", notif_desktop_title: "Notificaciones de escritorio", notif_desktop_desc: "Muestra notificaciones de WhatsApp usando el sistema de notificaciones de escritorio.", notif_photo_title: "Foto de contacto", notif_photo_desc: "Muestra la foto del remitente cuando esté disponible.", notif_name_title: "Nombre de contacto", notif_name_desc: "Muestra el remitente o el nombre del grupo.", notif_preview_title: "Vista previa del mensaje", notif_preview_desc: "Muestra el contenido del mensaje recibido.", notif_sound_title: "Sonido de notificación", notif_sound_desc: "Permite que el escritorio reproduzca un sonido de alerta para los mensajes nuevos.", heading_app_messages: "Mensajes de WhatsNexus", desc_app_messages: "Controlar los mensajes ocasionales que muestra la propia aplicación.", notif_support_title: "Recordatorios de apoyo", notif_support_desc: "Ocasionalmente muestra mensajes que respaldan el desarrollo de WhatsNexus."
  },
  hi: {
    tab_permissions: "अनुमतियाँ", perm_heading: "अनुमतियाँ", perm_desc: "परिभाषित करें कि WhatsApp Web को कौन सी अनुमतियाँ स्वचालित रूप से दी जा सकती हैं।", perm_notice: "अक्षम की गई अनुमतियों का अनुरोध आवश्यकता पड़ने पर किया जाएगा।", perm_btn_allow_all: "सभी की अनुमति दें", perm_btn_remove_all: "सभी हटाएं", perm_group_device: "डिवाइस एक्सेस", perm_mic_title: "माइक्रोफ़ोन", perm_mic_desc: "स्वचालित रूप से अपने माइक्रोफ़ोन तक पहुंच की अनुमति दें।", perm_camera_title: "कैमरा", perm_camera_desc: "स्वचालित रूप से अपने कैमरे तक पहुंच की अनुमति दें।", perm_cam_mic_title: "कैमरा और माइक्रोफ़ोन", perm_cam_mic_desc: "कैमरा और माइक्रोफ़ोन तक एक साथ पहुंच की स्वचालित अनुमति दें।", perm_location_title: "स्थान", perm_location_desc: "अपने स्थान तक स्वचालित पहुंच की अनुमति दें।", perm_group_share: "साझा करना", perm_screen_title: "स्क्रीन साझाकरण", perm_screen_desc: "स्क्रीन सामग्री साझा करने की स्वचालित अनुमति दें।", perm_screen_audio_title: "ऑडियो के साथ स्क्रीन", perm_screen_audio_desc: "ऑडियो के साथ स्क्रीन साझा करने की स्वचालित अनुमति दें।", 
    tooltip_back: "चैट पर वापस जाएं", settings_subtitle: "वैश्विक प्राथमिकताएं और खाता प्रबंधन", desc_accounts: "अपने खातों का प्रबंधन करें या डू नॉट डिस्टर्ब चालू करें।", desc_appearance: "थीम और इंटरफ़ेस भाषा अनुकूलित करें।", desc_notifications: "सिस्टम सूचनाओं की गोपनीयता नियंत्रित करें।", hint_theme: "रंग योजना चुनें", hint_language: "इंटरफ़ेस भाषा चुनें",
    tooltip_add_account: "खाता जोड़ें", tooltip_report_bug: "बग रिपोर्ट करें", tooltip_settings: "सेटिंग्स", welcome: "WhatsNexus में आपका स्वागत है", welcome_desc: "एक खाता चुनें या नया जोड़ें।", settings_title: "सेटिंग्स", tab_accounts: "खाते", tab_appearance: "दिखावट", tab_notifications: "सूचनाएं", heading_accounts: "खाता प्रबंधन", label_theme: "थीम", theme_auto: "ऑटो (सिस्टम)", theme_light: "हल्का", theme_dark: "गहरा", label_language: "भाषा", label_privacy: "गोपनीयता प्रोफ़ाइल", privacy_broad: "विस्तृत", privacy_broad_desc: "फोटो, नाम, संदेश पूर्वावलोकन और ध्वनि।", privacy_medium: "मध्यम", privacy_medium_desc: "फोटो, नाम, 'छिपा संदेश' और ध्वनि।", privacy_strict: "सख्त", privacy_strict_desc: "ऐप आइकन, 'छिपा संपर्क', 'छिपा संदेश', कोई ध्वनि नहीं।", tooltip_dnd: "परेशान न करें", tooltip_delete: "खाता हटाएं", default_account_name: "खाता",
    lang_en: "अंग्रेज़ी", lang_es: "स्पेनिश", lang_hi: "हिन्दी", lang_ar: "अरबी", lang_bn: "बंगाली", lang_pt: "पुर्तगाली", lang_ru: "रूसी", lang_ur: "उर्दू", lang_id: "इंडोनेशियाई", lang_fr: "फ्रेंच",
    hibernation_title: "खाता हाइबरनेशन में", hibernation_desc: "रैम खाली करने के लिए यह सत्र रोका गया है।", wake_button: "जागना", btn_edit: "संपादित करें", btn_delete: "हटाएं", account_status_title: "खाते की स्थिति", account_status_desc: "निष्क्रिय खाते सुरक्षित रहते हैं, लेकिन लोड नहीं होते और सूचनाएं नहीं मिलतीं।", status_active: "सक्रिय", status_inactive: "निष्क्रिय", dnd_title: "परेशान न करें", dnd_desc: "इस खाते की सूचनाएं म्यूट करें।", untitled_account: "अनाम खाता", card_theme_title: "थीम और दृश्य शैली", label_palette: "रंग पैलेट", palette_whatsapp: "WhatsApp (एमराल्ड)", palette_messenger: "Messenger (मेटा ब्लू)", palette_telegram: "Telegram (सियान ब्लू)", palette_signal: "Signal (रॉयल ब्लू)", palette_forest: "वन (ऑलिव और मिट्टी)", card_language_title: "इंटरफ़ेस भाषा", card_tray_title: "सिस्टम ट्रे (स्थिति आइकन)", hint_tray: "सिस्टम ट्रे आइकन कॉन्फ़िगर करें।", label_tray_style: "ट्रे आइकन शैली", tray_style_auto: "डिफ़ॉल्ट / ब्रांड", tray_style_light: "हल्का (सफेद)", tray_style_dark: "गहरा (काला)", label_tray_badge: "अपठित संदेश काउंटर", hint_tray_badge: "आइकन पर बैज दिखाएं", heading_notifications_privacy: "सूचनाएं", desc_notifications_privacy: "चुनें कि सूचनाओं में कौन सी जानकारी दिखाई दे सकती है।", label_privacy_preset: "गोपनीयता", preset_broad: "विस्तृत", preset_medium: "मध्यम", preset_strict: "सख्त", preset_custom: "कस्टम", notif_desktop_title: "डेस्कटॉप सूचनाएं", notif_desktop_desc: "डेस्कटॉप सूचना प्रणाली का उपयोग करके WhatsApp सूचनाएं दिखाएं।", notif_photo_title: "संपर्क फोटो", notif_photo_desc: "उपलब्ध होने पर प्रेषक की फोटो दिखाएं।", notif_name_title: "संपर्क नाम", notif_name_desc: "प्रेषक या समूह का नाम दिखाएं।", notif_preview_title: "संदेश पूर्वावलोकन", notif_preview_desc: "प्राप्त संदेश सामग्री दिखाएं।", notif_sound_title: "सूचना ध्वनि", notif_sound_desc: "नए संदेशों के लिए ध्वनि बजाएं।", heading_app_messages: "WhatsNexus संदेश", desc_app_messages: "ऐप द्वारा दिखाए जाने वाले संदेशों को नियंत्रित करें।", notif_support_title: "समर्थन अनुस्मारक", notif_support_desc: "विकास का समर्थन करने वाले संदेश दिखाएं।"
  },
  ar: {
    tab_permissions: "الأذونات", perm_heading: "الأذونات", perm_desc: "حدد الأذونات التي يمكن منحها تلقائيًا لـ WhatsApp Web.", perm_notice: "سيستمر طلب الأذونات المعطلة عند الحاجة.", perm_btn_allow_all: "السماح للكل", perm_btn_remove_all: "إزالة الكل", perm_group_device: "الوصول إلى الجهاز", perm_mic_title: "الميكروفون", perm_mic_desc: "السماح تلقائيًا بالوصول إلى الميكروفون الخاص بك.", perm_camera_title: "الكاميرا", perm_camera_desc: "السماح تلقائيًا بالوصول إلى الكاميرا الخاصة بك.", perm_cam_mic_title: "الكاميرا والميكروفون", perm_cam_mic_desc: "السماح تلقائيًا بالوصول المتزامن إلى الكاميرا والميكروفون.", perm_location_title: "الموقع", perm_location_desc: "السماح تلقائيًا بالوصول إلى موقعك الجغرافي.", perm_group_share: "المشاركة", perm_screen_title: "مشاركة الشاشة", perm_screen_desc: "السماح تلقائيًا بمشاركة محتوى الشاشة.", perm_screen_audio_title: "شاشة مع صوت", perm_screen_audio_desc: "السماح تلقائيًا بمشاركة الشاشة مع الصوت.", 
    tooltip_back: "العودة إلى الدردشات", settings_subtitle: "التفضيلات العامة وإدارة الحسابات", desc_accounts: "إدارة حسابات واتساب الخاصة بك وتبديل عدم الإزعاج.", desc_appearance: "تخصيص المظهر المرئي ولغة الواجهة.", desc_notifications: "التحكم في خصوصية محتوى إشعارات النظام.", hint_theme: "اختر نسق الألوان المفضل لديك", hint_language: "حدد لغة الواجهة",
    tooltip_add_account: "إضافة حساب", tooltip_report_bug: "الإبلاغ عن خطأ", tooltip_settings: "الإعدادات", welcome: "مرحبًا بك في WhatsNexus", welcome_desc: "حدد حسابًا أو أضف حسابًا جديدًا.", settings_title: "الإعدادات", tab_accounts: "الحسابات", tab_appearance: "المظهر", tab_notifications: "الإشعارات", heading_accounts: "إدارة الحسابات", label_theme: "السمة", theme_auto: "تلقائي (النظام)", theme_light: "فاتح", theme_dark: "داكن", label_language: "اللغة", label_privacy: "ملف الخصوصية", privacy_broad: "واسع", privacy_broad_desc: "صورة، اسم، معاينة رسالة، وصوت.", privacy_medium: "متوسط", privacy_medium_desc: "صورة، اسم، 'رسالة مخفية'، وصوت.", privacy_strict: "صارم", privacy_strict_desc: "أيقونة التطبيق، 'جهة اتصال مخفية'، 'رسالة مخفية'، بدون صوت.", tooltip_dnd: "عدم الإزعاج", tooltip_delete: "حذف الحساب", default_account_name: "حساب",
    lang_en: "الإنجليزية", lang_es: "الإسبانية", lang_hi: "الهندية", lang_ar: "العربية", lang_bn: "البنغالية", lang_pt: "البرتغالية", lang_ru: "الروسية", lang_ur: "الأردية", lang_id: "الإندونيسية", lang_fr: "الفرنسية",
    hibernation_title: "حساب في وضع الإسبات", hibernation_desc: "تم إيقاف هذه الجلسة لتحرير ذاكرة الوصول العشوائي.", wake_button: "استيقاظ", btn_edit: "تعديل", btn_delete: "حذف", account_status_title: "حالة الحساب", account_status_desc: "تبقى الحسابات المعطلة محفوظة، ولكن لا يتم تحميلها أو استلام إشعارات.", status_active: "مفعل", status_inactive: "معطل", dnd_title: "عدم الإزعاج", dnd_desc: "كتم إشعارات هذا الحساب.", untitled_account: "حساب بدون اسم", card_theme_title: "السمات والمظهر المرئي", label_palette: "لوحة الألوان", palette_whatsapp: "WhatsApp (زمردي)", palette_messenger: "Messenger (أزرق ميتا)", palette_telegram: "Telegram (أزرق سماوي)", palette_signal: "Signal (أزرق ملكي)", palette_forest: "الغابة (زيتوني وترابي)", card_language_title: "لغة الواجهة", card_tray_title: "صينية النظام (أيقونة الحالة)", hint_tray: "تكوين مظهر أيقونة شريط المهام.", label_tray_style: "نمط أيقونة الصينية", tray_style_auto: "افتراضي / العلامة التجارية", tray_style_light: "فاتح (أبيض)", tray_style_dark: "داكن (أسود)", label_tray_badge: "عداد الرسائل غير المقروءة", hint_tray_badge: "إظهار شارة رقمية على الأيقونة", heading_notifications_privacy: "الإشعارات", desc_notifications_privacy: "اختر المعلومات التي تظهر في الإشعارات.", label_privacy_preset: "الخصوصية", preset_broad: "واسع", preset_medium: "متوسط", preset_strict: "صارم", preset_custom: "مخصص", notif_desktop_title: "إشعارات سطح المكتب", notif_desktop_desc: "عرض إشعارات واتساب باستخدام نظام إشعارات سطح المكتب.", notif_photo_title: "صورة جهة الاتصال", notif_photo_desc: "إظهار صورة المرسل عند توفرها.", notif_name_title: "اسم جهة الاتصال", notif_name_desc: "إظهار اسم المرسل أو المجموعة.", notif_preview_title: "معاينة الرسالة", notif_preview_desc: "إظهار محتوى الرسالة المستلمة.", notif_sound_title: "صوت الإشعار", notif_sound_desc: "السماح بتشغيل صوت تنبيه للرسائل الجديدة.", heading_app_messages: "رسائل WhatsNexus", desc_app_messages: "التحكم في الرسائل التي يعرضها التطبيق نفسه.", notif_support_title: "تذكيرات الدعم", notif_support_desc: "عرض رسائل دعم تطوير WhatsNexus."
  },
  bn: {
    tab_permissions: "অনুমতিসমূহ", perm_heading: "অনুমতিসমূহ", perm_desc: "হোয়াটসঅ্যাপ ওয়েবকে স্বয়ংক্রিয়ভাবে কোন অনুমতিগুলি দেওয়া যাবে তা নির্ধারণ করুন।", perm_notice: "প্রয়োজনে নিষ্ক্রিয় অনুমতিগুলির জন্য এখনও অনুরোধ করা হবে।", perm_btn_allow_all: "সব অনুমতি দিন", perm_btn_remove_all: "সব সরান", perm_group_device: "ডিভাইস অ্যাক্সেস", perm_mic_title: "মাইক্রোফোন", perm_mic_desc: "স্বয়ংক্রিয়ভাবে আপনার মাইক্রোফোনে অ্যাক্সেসের অনুমতি দিন।", perm_camera_title: "ক্যামেরা", perm_camera_desc: "স্বয়ংক্রিয়ভাবে আপনার ক্যামেরায় অ্যাক্সেসের অনুমতি দিন।", perm_cam_mic_title: "ক্যামেরা এবং মাইক্রোফোন", perm_cam_mic_desc: "ক্যামেরা এবং মাইক্রোফোনে একই সাথে অ্যাক্সেসের অনুমতি দিন।", perm_location_title: "অবস্থান", perm_location_desc: "স্বয়ংক্রিয়ভাবে আপনার অবস্থান অ্যাক্সেসের অনুমতি দিন।", perm_group_share: "শেয়ারিং", perm_screen_title: "স্ক্রিন শেয়ারিং", perm_screen_desc: "স্ক্রিন সামগ্রী শেয়ার করার স্বয়ংক্রিয় অনুমতি দিন।", perm_screen_audio_title: "অডিও সহ স্ক্রিন", perm_screen_audio_desc: "অডিও সহ স্ক্রিন শেয়ার করার স্বয়ংক্রিয় অনুমতি দিন।", 
    tooltip_back: "চ্যাটে ফিরে যান", settings_subtitle: "গ্লোবাল পছন্দ এবং অ্যাকাউন্ট ব্যবস্থাপনা", desc_accounts: "আপনার হোয়াটসঅ্যাপ অ্যাকাউন্ট পরিচালনা করুন।", desc_appearance: "ভিজ্যুয়াল থিম এবং ইন্টারফেসের ভাষা কাস্টমাইজ করুন।", desc_notifications: "বিজ্ঞপ্তি গোপনীয়তা নিয়ন্ত্রণ করুন।", hint_theme: "রঙের স্কিম নির্বাচন করুন", hint_language: "ইন্টারফেসের ভাষা নির্বাচন করুন",
    tooltip_add_account: "অ্যাকাউন্ট যোগ করুন", tooltip_report_bug: "বাগ রিপোর্ট করুন", tooltip_settings: "সেটিংস", welcome: "WhatsNexus এ স্বাগতম", welcome_desc: "একটি অ্যাকাউন্ট নির্বাচন করুন বা একটি নতুন যোগ করুন।", settings_title: "সেটিংস", tab_accounts: "অ্যাকাউন্ট", tab_appearance: "উপস্থিতি", tab_notifications: "বিজ্ঞপ্তি", heading_accounts: "অ্যাকাউন্ট পরিচালনা", label_theme: "থিম", theme_auto: "অটো (সিস্টেম)", theme_light: "হালকা", theme_dark: "অন্ধকার", label_language: "ভাষা", label_privacy: "গোপনীয়তা প্রোফাইল", privacy_broad: "বিস্তৃত", privacy_broad_desc: "ছবি, নাম, বার্তা প্রাকদর্শন এবং শব্দ।", privacy_medium: "মাঝারি", privacy_medium_desc: "ছবি, নাম, 'লুকানো বার্তা' এবং শব্দ।", privacy_strict: "কঠোর", privacy_strict_desc: "অ্যাপ আইকন, 'লুকানো পরিচিতি', 'লুকানো বার্তা', কোনো শব্দ নেই।", tooltip_dnd: "বিরক্ত করবেন না", tooltip_delete: "অ্যাকাউন্ট মুছুন", default_account_name: "অ্যাকাউন্ট",
    lang_en: "ইংরেজি", lang_es: "স্প্যানিশ", lang_hi: "হিন্দি", lang_ar: "আরবি", lang_bn: "বাংলা", lang_pt: "পর্তুগিজ", lang_ru: "রাশিয়ান", lang_ur: "উর্দু", lang_id: "ইন্দোনেশিয়ান", lang_fr: "ফরাসি",
    hibernation_title: "অ্যাকাউন্ট হাইবারনেশনে", hibernation_desc: "র‍্যাম খালি করতে এই সেশনটি পজ করা হয়েছে।", wake_button: "জাগ্রত করুন", btn_edit: "সম্পাদনা", btn_delete: "মুছুন", account_status_title: "অ্যাকাউন্টের অবস্থা", account_status_desc: "নিষ্ক্রিয় অ্যাকাউন্ট সংরক্ষিত থাকে, কিন্তু লোড বা বিজ্ঞপ্তি পায় না।", status_active: "সক্রিয়", status_inactive: "নিষ্ক্রিয়", dnd_title: "বিরক্ত করবেন না", dnd_desc: "এই অ্যাকাউন্টের বিজ্ঞপ্তি নীরব করুন।", untitled_account: "নামহীন অ্যাকাউন্ট", card_theme_title: "থিম এবং ভিজ্যুয়াল শৈলী", label_palette: "রঙের প্যালেট", palette_whatsapp: "হোয়াটসঅ্যাপ (পান্না)", palette_messenger: "মেসেঞ্জার (মেটা ব্লু)", palette_telegram: "টেলিগ্রাম (সায়ান ব্লু)", palette_signal: "সিগন্যাল (রয়্যাল ব্লু)", palette_forest: "বন (জলপাই ও মাটি)", card_language_title: "ইন্টারফেস ভাষা", card_tray_title: "সিস্টেম ট্রে (স্ট্যাটাস আইকন)", hint_tray: "টাস্কবারে আইকন কনফিগার করুন।", label_tray_style: "ট্রে আইকন শৈলী", tray_style_auto: "ডিফল্ট / ব্র্যান্ড", tray_style_light: "হালকা (সাদা)", tray_style_dark: "অন্ধকার (কালো)", label_tray_badge: "অপঠিত বার্তা কাউন্টার", hint_tray_badge: "আইকনে ব্যাজ দেখান", heading_notifications_privacy: "বিজ্ঞপ্তি", desc_notifications_privacy: "বিজ্ঞপ্তিতে কোন তথ্য দেখা যেতে পারে তা চয়ন করুন।", label_privacy_preset: "গোপনীয়তা", preset_broad: "বিস্তৃত", preset_medium: "মাঝারি", preset_strict: "কঠোর", preset_custom: "কাস্টম", notif_desktop_title: "ডেস্কটপ বিজ্ঞপ্তি", notif_desktop_desc: "ডেস্কটপ সিস্টেম ব্যবহার করে হোয়াটসঅ্যাপ বিজ্ঞপ্তি প্রদর্শন করুন।", notif_photo_title: "যোগাযোগের ছবি", notif_photo_desc: "প্রেরকের ছবি প্রদর্শন করুন।", notif_name_title: "যোগাযোগের নাম", notif_name_desc: "প্রেরক বা দলের নাম প্রদর্শন করুন।", notif_preview_title: "বার্তা প্রাকদর্শন", notif_preview_desc: "প্রাপ্ত বার্তার বিষয়বস্তু প্রদর্শন করুন।", notif_sound_title: "বিজ্ঞপ্তির শব্দ", notif_sound_desc: "নতুন বার্তার জন্য শব্দ বাজানোর অনুমতি দিন।", heading_app_messages: "WhatsNexus বার্তা", desc_app_messages: "অ্যাপ দ্বারা প্রদর্শিত বার্তা নিয়ন্ত্রণ করুন।", notif_support_title: "সমর্থন অনুস্মারক", notif_support_desc: "বিকাশ সমর্থনকারী বার্তা প্রদর্শন করুন।"
  },
  pt: {
    tab_permissions: "Permissões", perm_heading: "Permissões", perm_desc: "Defina quais permissões podem ser concedidas automaticamente ao WhatsApp Web.", perm_notice: "Permissões desativadas ainda serão solicitadas quando necessário.", perm_btn_allow_all: "Permitir tudo", perm_btn_remove_all: "Remover tudo", perm_group_device: "Acesso ao dispositivo", perm_mic_title: "microfone", perm_mic_desc: "Permitir automaticamente o acesso ao seu microfone.", perm_camera_title: "câmera", perm_camera_desc: "Permitir automaticamente o acesso à sua câmera.", perm_cam_mic_title: "Câmera e microfone", perm_cam_mic_desc: "Permitir automaticamente o acesso simultâneo à câmera e ao microfone.", perm_location_title: "Localização", perm_location_desc: "Permitir automaticamente o acesso à sua localização.", perm_group_share: "Compartilhar", perm_screen_title: "Compartilhar tela", perm_screen_desc: "Permitir automaticamente o compartilhamento de conteúdo da tela.", perm_screen_audio_title: "Tela com áudio", perm_screen_audio_desc: "Permitir automaticamente compartilhar tela com áudio.", 
    tooltip_back: "Voltar para as conversas", settings_subtitle: "Preferências globais e gestão de contas", desc_accounts: "Gerencie suas contas do WhatsApp e alterne Não Incomodar.", desc_appearance: "Personalize o tema visual e o idioma da interface.", desc_notifications: "Controle a privacidade das notificações do sistema.", hint_theme: "Escolha o esquema de cores", hint_language: "Selecione o idioma da interface",
    tooltip_add_account: "Adicionar Conta", tooltip_report_bug: "Reportar Erro", tooltip_settings: "Configurações", welcome: "Bem-vindo ao WhatsNexus", welcome_desc: "Selecione uma conta ou adicione uma nova.", settings_title: "Configurações", tab_accounts: "Contas", tab_appearance: "Aparência", tab_notifications: "Notificações", heading_accounts: "Gestão de Contas", label_theme: "Tema", theme_auto: "Automático (Sistema)", theme_light: "Claro", theme_dark: "Escuro", label_language: "Idioma", label_privacy: "Perfil de Privacidade", privacy_broad: "Amplo", privacy_broad_desc: "Foto, nome, pré-visualização da mensagem e som.", privacy_medium: "Médio", privacy_medium_desc: "Foto, nome, 'Mensagem oculta' e som.", privacy_strict: "Rigoroso", privacy_strict_desc: "Ícone da app, 'Contato oculto', 'Mensagem oculta', sem som.", tooltip_dnd: "Não Incomodar", tooltip_delete: "Excluir Conta", default_account_name: "Conta",
    lang_en: "Inglês", lang_es: "Espanhol", lang_hi: "Hindi", lang_ar: "Árabe", lang_bn: "Bengali", lang_pt: "Português", lang_ru: "Russo", lang_ur: "Urdu", lang_id: "Indonésio", lang_fr: "Francês",
    hibernation_title: "Conta em Hibernação", hibernation_desc: "Esta sessão foi pausada para liberar memória RAM.", wake_button: "Despertar", btn_edit: "Editar", btn_delete: "Excluir", account_status_title: "Status da conta", account_status_desc: "Contas desativadas permanecem salvas, mas não carregam nem recebem notificações.", status_active: "Ativada", status_inactive: "Desativada", dnd_title: "Não incomodar", dnd_desc: "Silencie as notificações desta conta.", untitled_account: "Conta sem nome", card_theme_title: "Temas e Estilo Visual", label_palette: "Paleta de Cores", palette_whatsapp: "WhatsApp (Esmeralda)", palette_messenger: "Messenger (Meta Azul)", palette_telegram: "Telegram (Azul Ciano)", palette_signal: "Signal (Azul Real)", palette_forest: "Floresta (Oliva e Terra)", card_language_title: "Idioma da Interface", card_tray_title: "Bandeja do Sistema (Ícone de Status)", hint_tray: "Configure a presença e estilo do ícone na barra de tarefas.", label_tray_style: "Estilo do Ícone da Bandeja", tray_style_auto: "Padrão / Marca", tray_style_light: "Claro (Branco monocromático)", tray_style_dark: "Escuro (Preto monocromático)", label_tray_badge: "Contador de mensagens não lidas", hint_tray_badge: "Exibir selo numérico no ícone", heading_notifications_privacy: "Notificações", desc_notifications_privacy: "Escolha quais informações podem aparecer nas notificações.", label_privacy_preset: "Privacidade", preset_broad: "Amplo", preset_medium: "Médio", preset_strict: "Rigoroso", preset_custom: "Personalizado", notif_desktop_title: "Notificações na área de trabalho", notif_desktop_desc: "Exibe notificações do WhatsApp usando o sistema do desktop.", notif_photo_title: "Foto do contato", notif_photo_desc: "Mostra a foto do remetente quando disponível.", notif_name_title: "Nome do contato", notif_name_desc: "Mostra o remetente ou o nome do grupo.", notif_preview_title: "Pré-visualização da mensagem", notif_preview_desc: "Mostra o conteúdo da mensagem recebida.", notif_sound_title: "Som de notificação", notif_sound_desc: "Permite reproduzir um som de alerta para novas mensagens.", heading_app_messages: "Mensagens do WhatsNexus", desc_app_messages: "Controlar mensagens ocasionais exibidas pelo próprio aplicativo.", notif_support_title: "Lembretes de apoio", notif_support_desc: "Ocasionalmente exibe mensagens de apoio ao desenvolvimento."
  },
  ru: {
    tab_permissions: "Разрешения", perm_heading: "Разрешения", perm_desc: "Определите, какие разрешения могут быть автоматически предоставлены WhatsApp Web.", perm_notice: "Отключенные разрешения будут запрашиваться по мере необходимости.", perm_btn_allow_all: "Разрешить все", perm_btn_remove_all: "Запретить все", perm_group_device: "Доступ к устройству", perm_mic_title: "микрофон", perm_mic_desc: "Автоматически разрешать доступ к микрофону.", perm_camera_title: "камера", perm_camera_desc: "Автоматически разрешать доступ к камере.", perm_cam_mic_title: "Камера и микрофон", perm_cam_mic_desc: "Автоматически разрешать одновременный доступ к камере и микрофону.", perm_location_title: "Геолокация", perm_location_desc: "Автоматически разрешать доступ к вашему местоположению.", perm_group_share: "Демонстрация", perm_screen_title: "Демонстрация экрана", perm_screen_desc: "Автоматически разрешать демонстрацию содержимого экрана.", perm_screen_audio_title: "Экран со звуком", perm_screen_audio_desc: "Автоматически разрешать демонстрацию экрана со звуком.", 
    tooltip_back: "Назад к чатам", settings_subtitle: "Глобальные настройки и управление аккаунтами", desc_accounts: "Управляйте аккаунтами WhatsApp и режимом «Не беспокоить».", desc_appearance: "Настройте тему и язык интерфейса.", desc_notifications: "Управляйте приватностью уведомлений.", hint_theme: "Выберите цветовую схему", hint_language: "Выберите язык интерфейса",
    tooltip_add_account: "Добавить аккаунт", tooltip_report_bug: "Сообщить об ошибке", tooltip_settings: "Настройки", welcome: "Добро пожаловать в WhatsNexus", welcome_desc: "Выберите учетную запись или добавьте новую.", settings_title: "Настройки", tab_accounts: "Аккаунты", tab_appearance: "Внешний вид", tab_notifications: "Уведомления", heading_accounts: "Управление аккаунтами", label_theme: "Тема", theme_auto: "Авто (Система)", theme_light: "Светлая", theme_dark: "Темная", label_language: "Язык", label_privacy: "Профиль конфиденциальности", privacy_broad: "Широкий", privacy_broad_desc: "Фото, имя, предпросмотр сообщения и звук.", privacy_medium: "Средний", privacy_medium_desc: "Фото, имя, 'Скрытое сообщение' и звук.", privacy_strict: "Строгий", privacy_strict_desc: "Иконка приложения, 'Скрытый контакт', 'Скрытое сообщение', без звука.", tooltip_dnd: "Не беспокоить", tooltip_delete: "Удалить аккаунт", default_account_name: "Аккаунт",
    lang_en: "Английский", lang_es: "Испанский", lang_hi: "Хинди", lang_ar: "Арабский", lang_bn: "Бенгальский", lang_pt: "Португальский", lang_ru: "Русский", lang_ur: "Урду", lang_id: "Индонезийский", lang_fr: "Французский",
    hibernation_title: "Аккаунт в спящем режиме", hibernation_desc: "Этот сеанс приостановлен для освобождения ОЗУ.", wake_button: "Пробудить", btn_edit: "Редактировать", btn_delete: "Удалить", account_status_title: "Статус аккаунта", account_status_desc: "Отключенные аккаунты сохраняются, но не загружаются и не получают уведомления.", status_active: "Активен", status_inactive: "Отключен", dnd_title: "Не беспокоить", dnd_desc: "Отключить уведомления для этого аккаунта.", untitled_account: "Безымянный аккаунт", card_theme_title: "Темы и визуальный стиль", label_palette: "Цветовая палитра", palette_whatsapp: "WhatsApp (Изумрудный)", palette_messenger: "Messenger (Синий Meta)", palette_telegram: "Telegram (Голубой)", palette_signal: "Signal (Королевский синий)", palette_forest: "Лес (Оливковый и земляной)", card_language_title: "Язык интерфейса", card_tray_title: "Системный трей (Иконка статуса)", hint_tray: "Настройка значка в области уведомлений.", label_tray_style: "Стиль значка в трее", tray_style_auto: "По умолчанию / Бренд", tray_style_light: "Светлый (Белый)", tray_style_dark: "Темный (Черный)", label_tray_badge: "Счетчик непрочитанных сообщений", hint_tray_badge: "Показывать бейдж с числом на иконке", heading_notifications_privacy: "Уведомления", desc_notifications_privacy: "Выберите, какая информация отображается в уведомлениях.", label_privacy_preset: "Конфиденциальность", preset_broad: "Широкий", preset_medium: "Средний", preset_strict: "Строгий", preset_custom: "Пользовательский", notif_desktop_title: "Уведомления на рабочем столе", notif_desktop_desc: "Отображение уведомлений WhatsApp в системе рабочего стола.", notif_photo_title: "Фото контакта", notif_photo_desc: "Отображать фото отправителя при наличии.", notif_name_title: "Имя контакта", notif_name_desc: "Отображать имя отправителя или группы.", notif_preview_title: "Предпросмотр сообщения", notif_preview_desc: "Отображать текст входящего сообщения.", notif_sound_title: "Звук уведомления", notif_sound_desc: "Воспроизводить звуковой сигнал при новых сообщениях.", heading_app_messages: "Сообщения WhatsNexus", desc_app_messages: "Управление служебными сообщениями самого приложения.", notif_support_title: "Напоминания о поддержке", notif_support_desc: "Периодически показывать сообщения в поддержку разработки."
  },
  ur: {
    tab_permissions: "اجازتیں", perm_heading: "اجازتیں", perm_desc: "متعین کریں کہ واٹس ایپ ویب کو کون سی اجازتیں خودکار طور پر دی جا سکتی ہیں۔", perm_notice: "غیر فعال کردہ اجازتوں کی ضرورت پڑنے پر اب بھی درخواست کی جائے گی۔", perm_btn_allow_all: "سب کی اجازت دیں", perm_btn_remove_all: "سب ہٹائیں", perm_group_device: "ڈیوائس تک رسائی", perm_mic_title: "مائیکروفون", perm_mic_desc: "اپنے مائیکروفون تک رسائی کی خودکار اجازت دیں۔", perm_camera_title: "کیمرہ", perm_camera_desc: "اپنے کیمرے تک رسائی کی خودکار اجازت دیں۔", perm_cam_mic_title: "کیمرہ اور مائیکروفون", perm_cam_mic_desc: "کیمرہ اور مائیکروفون تک بیک وقت رسائی کی خودکار اجازت دیں۔", perm_location_title: "مقام", perm_location_desc: "اپنے مقام تک رسائی کی خودکار اجازت دیں۔", perm_group_share: "شیئرنگ", perm_screen_title: "اسکرین شیئرنگ", perm_screen_desc: "اسکرین کا مواد شیئر کرنے کی خودکار اجازت دیں۔", perm_screen_audio_title: "آڈیو کے ساتھ اسکرین", perm_screen_audio_desc: "آڈیو کے ساتھ اسکرین شیئر کرنے کی خودکار اجازت دیں۔", 
    tooltip_back: "چیٹس پر واپس جائیں", settings_subtitle: "عالمی ترجیحات اور اکاؤنٹ کا نظم", desc_accounts: "اپنے اکاؤنٹس کا انتظام کریں اور پریشان نہ کریں موڈ تبدیل کریں۔", desc_appearance: "تھیم اور زبان تبدیل کریں۔", desc_notifications: "اطلاعات کی رازداری کا انتظام کریں۔", hint_theme: "رنگین تھیم منتخب کریں", hint_language: "زبان منتخب کریں",
    tooltip_add_account: "اکاؤنٹ شامل کریں", tooltip_report_bug: "خرابی کی اطلاع دیں", tooltip_settings: "ترتیبات", welcome: "WhatsNexus میں خوش آمدید", welcome_desc: "ایک اکاؤنٹ منتخب کریں یا نیا شامل کریں۔", settings_title: "ترتیبات", tab_accounts: "اکاؤنٹس", tab_appearance: "ظاہری شکل", tab_notifications: "اطلاعات", heading_accounts: "اکاؤنٹ مینجمنٹ", label_theme: "تھیم", theme_auto: "آٹو (سسٹم)", theme_light: "روشنی", theme_dark: "تاریک", label_language: "زبان", label_privacy: "رازداری پروفائل", privacy_broad: "وسیع", privacy_broad_desc: "تصویر، نام، پیغام کا پیش نظارہ، اور آواز۔", privacy_medium: "درمیانہ", privacy_medium_desc: "تصویر، نام، 'پوشیدہ پیغام'، اور آواز۔", privacy_strict: "سخت", privacy_strict_desc: "ایپ آئیکن، 'پوشیدہ رابطہ'، 'پوشیدہ پیغام'، کوئی آواز نہیں۔", tooltip_dnd: "پریشان نہ کریں", tooltip_delete: "اکاؤنٹ حذف کریں", default_account_name: "اکاؤنٹ",
    lang_en: "انگریزی", lang_es: "ہسپانوی", lang_hi: "ہندی", lang_ar: "عربی", lang_bn: "بنگالی", lang_pt: "پرتگالی", lang_ru: "روسی", lang_ur: "اردو", lang_id: "انڈونیشیائی", lang_fr: "فرانسیسی",
    hibernation_title: "اکاؤنٹ ہائبرنیشن میں", hibernation_desc: "RAM خالی کرنے کے لیے اس سیشن کو روک دیا گیا ہے۔", wake_button: "جاگیں", btn_edit: "ترمیم کریں", btn_delete: "حذف کریں", account_status_title: "اکاؤنٹ کی حیثیت", account_status_desc: "غیر فعال اکاؤنٹس محفوظ رہتے ہیں، لیکن لوڈ یا اطلاعات موصول نہیں کرتے۔", status_active: "فعال", status_inactive: "غیر فعال", dnd_title: "پریشان نہ کریں", dnd_desc: "اس اکاؤنٹ کی اطلاعات کو خاموش کریں۔", untitled_account: "بے نام اکاؤنٹ", card_theme_title: "تھیمز اور بصری انداز", label_palette: "رنگین پیلیٹ", palette_whatsapp: "WhatsApp (زمرد)", palette_messenger: "Messenger (میٹا نیلا)", palette_telegram: "Telegram (سیان نیلا)", palette_signal: "Signal (شاہی نیلا)", palette_forest: "جنگل (زیتون اور مٹی)", card_language_title: "انٹرفیس زبان", card_tray_title: "سسٹم ٹرے (حیثیت کا آئیکن)", hint_tray: "ٹاسک بار پر آئیکن کی ترتیبات۔", label_tray_style: "ٹرے آئیکن کا انداز", tray_style_auto: "طے شدہ / برانڈ", tray_style_light: "روشنی (سفید)", tray_style_dark: "تاریک (سیاہ)", label_tray_badge: "نہ پڑھے گئے پیغامات کا کاؤنٹر", hint_tray_badge: "آئیکن پر نمبر دکھائیں", heading_notifications_privacy: "اطلاعات", desc_notifications_privacy: "منتخب کریں کہ اطلاعات میں کون سی معلومات ظاہر ہو سکتی ہے۔", label_privacy_preset: "رازداری", preset_broad: "وسیع", preset_medium: "درمیانہ", preset_strict: "سخت", preset_custom: "اپنی مرضی کے مطابق", notif_desktop_title: "ڈیسک ٹاپ اطلاعات", notif_desktop_desc: "ڈیسک ٹاپ کے ذریعے واٹس ایپ اطلاعات دکھائیں۔", notif_photo_title: "رابطہ کی تصویر", notif_photo_desc: "دستیاب ہونے پر بھیجنے والے کی تصویر دکھائیں۔", notif_name_title: "رابطے کا نام", notif_name_desc: "بھیجنے والے یا گروپ کا نام دکھائیں۔", notif_preview_title: "پیغام کا پیش نظارہ", notif_preview_desc: "موصول ہونے والے پیغام کا مواد دکھائیں۔", notif_sound_title: "اطلاع کی آواز", notif_sound_desc: "نئے پیغامات کے لیے آواز چلانے کی اجازت دیں۔", heading_app_messages: "WhatsNexus کے پیغامات", desc_app_messages: "ایپ کے اپنے پیغامات کو کنٹرول کریں۔", notif_support_title: "حمایت کی یاد دہانیاں", notif_support_desc: "ترقیاتی کام کی حمایت کے پیغامات دکھائیں۔"
  },
  id: {
    tab_permissions: "Izin", perm_heading: "Izin", perm_desc: "Tentukan izin apa yang dapat diberikan secara otomatis ke WhatsApp Web.", perm_notice: "Izin yang dinonaktifkan akan tetap diminta saat diperlukan.", perm_btn_allow_all: "Izinkan semua", perm_btn_remove_all: "Hapus semua", perm_group_device: "Akses perangkat", perm_mic_title: "mikrofon", perm_mic_desc: "Izinkan akses otomatis ke mikrofon Anda.", perm_camera_title: "kamera", perm_camera_desc: "Izinkan akses otomatis ke kamera Anda.", perm_cam_mic_title: "Kamera dan mikrofon", perm_cam_mic_desc: "Izinkan akses simultan otomatis ke kamera dan mikrofon.", perm_location_title: "Lokasi", perm_location_desc: "Izinkan akses otomatis ke lokasi Anda.", perm_group_share: "Berbagi", perm_screen_title: "Berbagi layar", perm_screen_desc: "Izinkan berbagi konten layar secara otomatis.", perm_screen_audio_title: "Layar dengan audio", perm_screen_audio_desc: "Izinkan berbagi layar dengan audio secara otomatis.", 
    tooltip_back: "Kembali ke obrolan", settings_subtitle: "Preferensi global dan manajemen akun", desc_accounts: "Kelola akun WhatsApp Anda dan mode Jangan Ganggu.", desc_appearance: "Sesuaikan tema dan bahasa antarmuka.", desc_notifications: "Kontrol privasi notifikasi sistem.", hint_theme: "Pilih skema warna", hint_language: "Pilih bahasa antarmuka",
    tooltip_add_account: "Tambah Akun", tooltip_report_bug: "Laporkan Bug", tooltip_settings: "Pengaturan", welcome: "Selamat datang di WhatsNexus", welcome_desc: "Pilih akun atau tambahkan yang baru.", settings_title: "Pengaturan", tab_accounts: "Akun", tab_appearance: "Tampilan", tab_notifications: "Notifikasi", heading_accounts: "Manajemen Akun", label_theme: "Tema", theme_auto: "Otomatis (Sistem)", theme_light: "Terang", theme_dark: "Gelap", label_language: "Bahasa", label_privacy: "Profil Privasi", privacy_broad: "Luas", privacy_broad_desc: "Foto, nama, pratinjau pesan, dan suara.", privacy_medium: "Sedang", privacy_medium_desc: "Foto, nama, 'Pesan tersembunyi', dan suara.", privacy_strict: "Ketat", privacy_strict_desc: "Ikon aplikasi, 'Kontak tersembunyi', 'Pesan tersembunyi', tanpa suara.", tooltip_dnd: "Jangan Ganggu", tooltip_delete: "Hapus Akun", default_account_name: "Akun",
    lang_en: "Inggris", lang_es: "Spanyol", lang_hi: "Hindi", lang_ar: "Arab", lang_bn: "Bengali", lang_pt: "Portugis", lang_ru: "Rusia", lang_ur: "Urdu", lang_id: "Bahasa Indonesia", lang_fr: "Prancis",
    hibernation_title: "Akun dalam Hibernasi", hibernation_desc: "Sesi ini telah dijeda untuk membebaskan RAM.", wake_button: "Bangunkan", btn_edit: "Edit", btn_delete: "Hapus", account_status_title: "Status akun", account_status_desc: "Akun nonaktif tetap tersimpan, tetapi tidak dimuat atau menerima notifikasi.", status_active: "Aktif", status_inactive: "Nonaktif", dnd_title: "Jangan ganggu", dnd_desc: "Bisukan notifikasi untuk akun ini.", untitled_account: "Akun tanpa nama", card_theme_title: "Tema & Gaya Visual", label_palette: "Palet Warna", palette_whatsapp: "WhatsApp (Zamrud)", palette_messenger: "Messenger (Biru Meta)", palette_telegram: "Telegram (Biru Sian)", palette_signal: "Signal (Biru Royal)", palette_forest: "Hutan (Zaitun & Tanah)", card_language_title: "Bahasa Antarmuka", card_tray_title: "Baki Sistem (Ikon Status)", hint_tray: "Konfigurasikan ikon di bilah tugas atau baki sistem.", label_tray_style: "Gaya Ikon Baki", tray_style_auto: "Standar / Merek", tray_style_light: "Terang (Putih monokrom)", tray_style_dark: "Gelap (Hitam monokrom)", label_tray_badge: "Penghitung pesan belum dibaca", hint_tray_badge: "Tampilkan lencana numerik pada ikon", heading_notifications_privacy: "Notifikasi", desc_notifications_privacy: "Pilih informasi yang dapat muncul di notifikasi.", label_privacy_preset: "Privasi", preset_broad: "Luas", preset_medium: "Sedang", preset_strict: "Ketat", preset_custom: "Kustom", notif_desktop_title: "Notifikasi desktop", notif_desktop_desc: "Tampilkan notifikasi WhatsApp menggunakan sistem desktop.", notif_photo_title: "Foto kontak", notif_photo_desc: "Tampilkan foto pengirim bila tersedia.", notif_name_title: "Nama kontak", notif_name_desc: "Tampilkan pengirim atau nama grup.", notif_preview_title: "Pratinjau pesan", notif_preview_desc: "Tampilkan isi pesan yang diterima.", notif_sound_title: "Suara notifikasi", notif_sound_desc: "Izinkan sistem memutar suara peringatan untuk pesan baru.", heading_app_messages: "Pesan WhatsNexus", desc_app_messages: "Kontrol pesan berkala yang ditampilkan oleh aplikasi.", notif_support_title: "Pengingat dukungan", notif_support_desc: "Sesekali tampilkan pesan pendukung pengembangan."
  },
  fr: {
    tab_permissions: "Autorisations", perm_heading: "Autorisations", perm_desc: "Définissez les autorisations qui peuvent être accordées automatiquement à WhatsApp Web.", perm_notice: "Les autorisations désactivées continueront d'être demandées si nécessaire.", perm_btn_allow_all: "Tout autoriser", perm_btn_remove_all: "Tout supprimer", perm_group_device: "Accès à l'appareil", perm_mic_title: "microphone", perm_mic_desc: "Autoriser automatiquement l'accès à votre microphone.", perm_camera_title: "caméra", perm_camera_desc: "Autoriser automatiquement l'accès à votre caméra.", perm_cam_mic_title: "Caméra et microphone", perm_cam_mic_desc: "Autoriser automatiquement l'accès simultané à la caméra et au microphone.", perm_location_title: "Localisation", perm_location_desc: "Autoriser automatiquement l'accès à votre localisation.", perm_group_share: "Partage", perm_screen_title: "Partager l'écran", perm_screen_desc: "Autoriser automatiquement le partage du contenu de l'écran.", perm_screen_audio_title: "Écran avec audio", perm_screen_audio_desc: "Autoriser automatiquement le partage d'écran avec audio.", 
    tooltip_back: "Retour aux discussions", settings_subtitle: "Préférences globales et gestion des comptes", desc_accounts: "Gérez vos comptes WhatsApp et le mode Ne pas déranger.", desc_appearance: "Personnalisez le thème et la langue de l'interface.", desc_notifications: "Contrôlez la confidentialité des notifications.", hint_theme: "Choisissez le thème de couleur", hint_language: "Sélectionnez la langue de l'interface",
    tooltip_add_account: "Ajouter un compte", tooltip_report_bug: "Signaler un bug", tooltip_settings: "Paramètres", welcome: "Bienvenue sur WhatsNexus", welcome_desc: "Sélectionnez un compte ou ajoutez-en un nouveau.", settings_title: "Paramètres", tab_accounts: "Comptes", tab_appearance: "Apparence", tab_notifications: "Notifications", heading_accounts: "Gestion des comptes", label_theme: "Thème", theme_auto: "Auto (Système)", theme_light: "Clair", theme_dark: "Sombre", label_language: "Langue", label_privacy: "Profil de confidentialité", privacy_broad: "Large", privacy_broad_desc: "Photo, nom, aperçu du message et son.", privacy_medium: "Moyen", privacy_medium_desc: "Photo, nom, 'Message masqué' et son.", privacy_strict: "Strict", privacy_strict_desc: "Icône de l'application, 'Contact masqué', 'Message masqué', pas de son.", tooltip_dnd: "Ne pas déranger", tooltip_delete: "Supprimer le compte", default_account_name: "Compte",
    lang_en: "Anglais", lang_es: "Espagnol", lang_hi: "Hindi", lang_ar: "Arabe", lang_bn: "Bengali", lang_pt: "Portugais", lang_ru: "Russe", lang_ur: "Ourdou", lang_id: "Indonésien", lang_fr: "Français",
    hibernation_title: "Compte en Hibernation", hibernation_desc: "Cette session a été mise en pause pour libérer de la RAM.", wake_button: "Réveiller", btn_edit: "Modifier", btn_delete: "Supprimer", account_status_title: "Statut du compte", account_status_desc: "Les comptes désactivés restent enregistrés, mais ne sont pas chargés et ne reçoivent pas de notifications.", status_active: "Activé", status_inactive: "Désactivé", dnd_title: "Ne pas déranger", dnd_desc: "Désactiver les notifications de ce compte.", untitled_account: "Compte sans nom", card_theme_title: "Thèmes et style visuel", label_palette: "Palette de couleurs", palette_whatsapp: "WhatsApp (Émeraude)", palette_messenger: "Messenger (Bleu Meta)", palette_telegram: "Telegram (Bleu Cyan)", palette_signal: "Signal (Bleu Royal)", palette_forest: "Forêt (Olive & Terre)", card_language_title: "Langue de l'interface", card_tray_title: "Barre d'état système (Tray)", hint_tray: "Configurer l'icône dans la zone de notification.", label_tray_style: "Style d'icône de la barre", tray_style_auto: "Par défaut / Marque", tray_style_light: "Clair (Blanc monochrome)", tray_style_dark: "Sombre (Noir monochrome)", label_tray_badge: "Compteur de messages non lus", hint_tray_badge: "Afficher le badge numérique sur l'icône", heading_notifications_privacy: "Notifications", desc_notifications_privacy: "Choisissez les informations pouvant apparaître dans les notifications.", label_privacy_preset: "Confidentialité", preset_broad: "Large", preset_medium: "Moyen", preset_strict: "Strict", preset_custom: "Personnalisé", notif_desktop_title: "Notifications de bureau", notif_desktop_desc: "Affichez les notifications WhatsApp via le système de bureau.", notif_photo_title: "Photo de contact", notif_photo_desc: "Afficher la photo de l'expéditeur si disponible.", notif_name_title: "Nom de contact", notif_name_desc: "Afficher l'expéditeur ou le nom du groupe.", notif_preview_title: "Aperçu du message", notif_preview_desc: "Afficher le contenu du message reçu.", notif_sound_title: "Son de notification", notif_sound_desc: "Permettre au système de jouer un son pour les nouveaux messages.", heading_app_messages: "Messages de WhatsNexus", desc_app_messages: "Contrôler les messages occasionnels affichés par l'application.", notif_support_title: "Rappels de soutien", notif_support_desc: "Afficher occasionnellement des messages de soutien au développement."
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
const permCamMicToggle = document.getElementById('perm-cam-mic-toggle');
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
    if (permCamMicToggle) permCamMicToggle.checked = !!settings.permissions.cameraAndMic;
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
      // Si se activa cámara y micrófono simultáneo, sincronizar cámara y micrófono si aplica
      if (key === 'cameraAndMic' && toggleEl.checked) {
        settings.permissions.camera = true;
        settings.permissions.microphone = true;
      }
      saveSettings();
    });
  }
}

handlePermissionToggle('microphone', permMicToggle);
handlePermissionToggle('camera', permCameraToggle);
handlePermissionToggle('cameraAndMic', permCamMicToggle);
handlePermissionToggle('location', permLocationToggle);
handlePermissionToggle('screenShare', permScreenToggle);
handlePermissionToggle('screenShareAudio', permScreenAudioToggle);

if (permAllowAllBtn) {
  permAllowAllBtn.addEventListener('click', () => {
    settings.permissions.microphone = true;
    settings.permissions.camera = true;
    settings.permissions.cameraAndMic = true;
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
    settings.permissions.cameraAndMic = false;
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
