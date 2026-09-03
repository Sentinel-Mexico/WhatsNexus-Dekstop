const path = require('path');
const { shell } = require('electron');

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

// Diccionario de Traducciones
const i18n = {
  en: {
    tooltip_back: "Back to chats", settings_subtitle: "Global preferences & account management", desc_accounts: "Manage your WhatsApp accounts, rename them, or toggle Do Not Disturb.", desc_appearance: "Customize visual theme and interface language.", desc_notifications: "Control content privacy for system notifications.", hint_theme: "Choose your preferred color scheme", hint_language: "Select interface language",
    tooltip_add_account: "Add Account", tooltip_report_bug: "Report Bug", tooltip_settings: "Settings", welcome: "Welcome to WhatsNexus", welcome_desc: "Select an account or add a new one.", settings_title: "Settings", tab_accounts: "Accounts", tab_appearance: "Appearance", tab_notifications: "Notifications", heading_accounts: "Account Management", label_theme: "Theme", theme_auto: "Auto (System)", theme_light: "Light", theme_dark: "Dark", label_language: "Language", label_privacy: "Privacy Profile", privacy_broad: "Broad", privacy_broad_desc: "Photo, name, message preview, and sound.", privacy_medium: "Medium", privacy_medium_desc: "Photo, name, 'Hidden message', and sound.", privacy_strict: "Strict", privacy_strict_desc: "App icon, 'Hidden contact', 'Hidden message', no sound.", tooltip_dnd: "Do Not Disturb", tooltip_delete: "Delete Account", default_account_name: "Account",
    lang_en: "English", lang_es: "Spanish", lang_hi: "Hindi", lang_ar: "Arabic", lang_bn: "Bengali", lang_pt: "Portuguese", lang_ru: "Russian", lang_ur: "Urdu", lang_id: "Indonesian", lang_fr: "French",
    hibernation_title: "Account in Hibernation", hibernation_desc: "This session has been paused to free up RAM.", wake_button: "Wake Up", btn_edit: "Edit", btn_delete: "Delete", account_status_title: "Account status", account_status_desc: "Deactivated accounts remain saved, but are not loaded nor receive notifications.", status_active: "Active", status_inactive: "Deactivated", dnd_title: "Do not disturb", dnd_desc: "Mute notifications for this account.", untitled_account: "Untitled Account"
  },
  es: {
    tooltip_back: "Volver a los chats", settings_subtitle: "Preferencias globales y gestión de cuentas", desc_accounts: "Administra tus perfiles de WhatsApp, cambia sus nombres o activa el modo No Molestar.", desc_appearance: "Personaliza el tema visual y el idioma de la aplicación.", desc_notifications: "Controla la privacidad del contenido en las notificaciones del sistema.", hint_theme: "Elige la combinación de colores que prefieras", hint_language: "Selecciona el idioma de la interfaz",
    tooltip_add_account: "Añadir Cuenta", tooltip_report_bug: "Reportar Error", tooltip_settings: "Configuración", welcome: "Bienvenido a WhatsNexus", welcome_desc: "Selecciona una cuenta en la barra lateral o añade una nueva para comenzar.", settings_title: "Configuración", tab_accounts: "Cuentas", tab_appearance: "Apariencia", tab_notifications: "Notificaciones", heading_accounts: "Gestión de Cuentas", label_theme: "Tema", theme_auto: "Automático (Sistema)", theme_light: "Claro", theme_dark: "Oscuro", label_language: "Idioma", label_privacy: "Perfil de Privacidad", privacy_broad: "Amplio", privacy_broad_desc: "Foto, nombre, vista previa del mensaje y sonido.", privacy_medium: "Medio", privacy_medium_desc: "Foto, nombre, 'Mensaje oculto' y sonido.", privacy_strict: "Estricto", privacy_strict_desc: "Icono de app, 'Contacto oculto', 'Mensaje oculto', sin sonido.", tooltip_dnd: "No Molestar", tooltip_delete: "Eliminar Cuenta", default_account_name: "Cuenta",
    lang_en: "Inglés", lang_es: "Español", lang_hi: "Hindi", lang_ar: "Árabe", lang_bn: "Bengalí", lang_pt: "Portugués", lang_ru: "Ruso", lang_ur: "Urdu", lang_id: "Indonesio", lang_fr: "Francés",
    hibernation_title: "Cuenta en Hibernación", hibernation_desc: "Esta sesión se ha pausado para liberar memoria RAM.", wake_button: "Despertar", btn_edit: "Editar", btn_delete: "Eliminar", account_status_title: "Estado de la cuenta", account_status_desc: "Las cuentas desactivadas permanecen guardadas, pero no se cargan ni reciben notificaciones.", status_active: "Activada", status_inactive: "Desactivada", dnd_title: "No molestar", dnd_desc: "Silencia las notificaciones de esta cuenta.", untitled_account: "Cuenta sin nombre"
  },
  hi: {
    tooltip_back: "चैट पर वापस जाएं", settings_subtitle: "वैश्विक प्राथमिकताएं और खाता प्रबंधन", desc_accounts: "अपने खातों का प्रबंधन करें या डू नॉट डिस्टर्ब चालू करें।", desc_appearance: "थीम और इंटरफ़ेस भाषा अनुकूलित करें।", desc_notifications: "सिस्टम सूचनाओं की गोपनीयता नियंत्रित करें।", hint_theme: "रंग योजना चुनें", hint_language: "इंटरफ़ेस भाषा चुनें",
    tooltip_add_account: "खाता जोड़ें", tooltip_report_bug: "बग रिपोर्ट करें", tooltip_settings: "सेटिंग्स", welcome: "WhatsNexus में आपका स्वागत है", welcome_desc: "एक खाता चुनें या नया जोड़ें।", settings_title: "सेटिंग्स", tab_accounts: "खाते", tab_appearance: "दिखावट", tab_notifications: "सूचनाएं", heading_accounts: "खाता प्रबंधन", label_theme: "थीम", theme_auto: "ऑटो (सिस्टम)", theme_light: "हल्का", theme_dark: "गहरा", label_language: "भाषा", label_privacy: "गोपनीयता प्रोफ़ाइल", privacy_broad: "विस्तृत", privacy_broad_desc: "फोटो, नाम, संदेश पूर्वावलोकन और ध्वनि।", privacy_medium: "मध्यम", privacy_medium_desc: "फोटो, नाम, 'छिपा संदेश' और ध्वनि।", privacy_strict: "सख्त", privacy_strict_desc: "ऐप आइकन, 'छिपा संपर्क', 'छिपा संदेश', कोई ध्वनि नहीं।", tooltip_dnd: "परेशान न करें", tooltip_delete: "खाता हटाएं", default_account_name: "खाता",
    lang_en: "अंग्रेज़ी", lang_es: "स्पेनिश", lang_hi: "हिन्दी", lang_ar: "अरबी", lang_bn: "बंगाली", lang_pt: "पुर्तगाली", lang_ru: "रूसी", lang_ur: "उर्दू", lang_id: "इंडोनेशियाई", lang_fr: "फ्रेंच",
    hibernation_title: "खाता हाइबरनेशन में", hibernation_desc: "रैम खाली करने के लिए यह सत्र रोका गया है।", wake_button: "जागना", btn_edit: "संपादित करें", btn_delete: "हटाएं", account_status_title: "खाते की स्थिति", account_status_desc: "निष्क्रिय खाते सुरक्षित रहते हैं, लेकिन लोड नहीं होते और सूचनाएं नहीं मिलतीं।", status_active: "सक्रिय", status_inactive: "निष्क्रिय", dnd_title: "परेशान न करें", dnd_desc: "इस खाते की सूचनाएं म्यूट करें।", untitled_account: "अनाम खाता"
  },
  ar: {
    tooltip_back: "العودة إلى الدردشات", settings_subtitle: "التفضيلات العامة وإدارة الحسابات", desc_accounts: "إدارة حسابات واتساب الخاصة بك وتبديل عدم الإزعاج.", desc_appearance: "تخصيص المظهر المرئي ولغة الواجهة.", desc_notifications: "التحكم في خصوصية محتوى إشعارات النظام.", hint_theme: "اختر نسق الألوان المفضل لديك", hint_language: "حدد لغة الواجهة",
    tooltip_add_account: "إضافة حساب", tooltip_report_bug: "الإبلاغ عن خطأ", tooltip_settings: "الإعدادات", welcome: "مرحبًا بك في WhatsNexus", welcome_desc: "حدد حسابًا أو أضف حسابًا جديدًا.", settings_title: "الإعدادات", tab_accounts: "الحسابات", tab_appearance: "المظهر", tab_notifications: "الإشعارات", heading_accounts: "إدارة الحسابات", label_theme: "السمة", theme_auto: "تلقائي (النظام)", theme_light: "فاتح", theme_dark: "داكن", label_language: "اللغة", label_privacy: "ملف الخصوصية", privacy_broad: "واسع", privacy_broad_desc: "صورة، اسم، معاينة رسالة، وصوت.", privacy_medium: "متوسط", privacy_medium_desc: "صورة، اسم، 'رسالة مخفية'، وصوت.", privacy_strict: "صارم", privacy_strict_desc: "أيقونة التطبيق، 'جهة اتصال مخفية'، 'رسالة مخفية'، بدون صوت.", tooltip_dnd: "عدم الإزعاج", tooltip_delete: "حذف الحساب", default_account_name: "حساب",
    lang_en: "الإنجليزية", lang_es: "الإسبانية", lang_hi: "الهندية", lang_ar: "العربية", lang_bn: "البنغالية", lang_pt: "البرتغالية", lang_ru: "الروسية", lang_ur: "الأردية", lang_id: "الإندونيسية", lang_fr: "الفرنسية",
    hibernation_title: "حساب في وضع الإسبات", hibernation_desc: "تم إيقاف هذه الجلسة لتحرير ذاكرة الوصول العشوائي.", wake_button: "استيقاظ", btn_edit: "تعديل", btn_delete: "حذف", account_status_title: "حالة الحساب", account_status_desc: "تبقى الحسابات المعطلة محفوظة، ولكن لا يتم تحميلها أو استلام إشعارات.", status_active: "مفعل", status_inactive: "معطل", dnd_title: "عدم الإزعاج", dnd_desc: "كتم إشعارات هذا الحساب.", untitled_account: "حساب بدون اسم"
  },
  bn: {
    tooltip_back: "চ্যাটে ফিরে যান", settings_subtitle: "গ্লোবাল পছন্দ এবং অ্যাকাউন্ট ব্যবস্থাপনা", desc_accounts: "আপনার হোয়াটসঅ্যাপ অ্যাকাউন্ট পরিচালনা করুন।", desc_appearance: "ভিজ্যুয়াল থিম এবং ইন্টারফেসের ভাষা কাস্টমাইজ করুন।", desc_notifications: "বিজ্ঞপ্তি গোপনীয়তা নিয়ন্ত্রণ করুন।", hint_theme: "রঙের স্কিম নির্বাচন করুন", hint_language: "ইন্টারফেসের ভাষা নির্বাচন করুন",
    tooltip_add_account: "অ্যাকাউন্ট যোগ করুন", tooltip_report_bug: "বাগ রিপোর্ট করুন", tooltip_settings: "সেটিংস", welcome: "WhatsNexus এ স্বাগতম", welcome_desc: "একটি অ্যাকাউন্ট নির্বাচন করুন বা একটি নতুন যোগ করুন।", settings_title: "সেটিংস", tab_accounts: "অ্যাকাউন্ট", tab_appearance: "উপস্থিতি", tab_notifications: "বিজ্ঞপ্তি", heading_accounts: "অ্যাকাউন্ট পরিচালনা", label_theme: "থিম", theme_auto: "অটো (সিস্টেম)", theme_light: "হালকা", theme_dark: "অন্ধকার", label_language: "ভাষা", label_privacy: "গোপনীয়তা প্রোফাইল", privacy_broad: "বিস্তৃত", privacy_broad_desc: "ছবি, নাম, বার্তা প্রাকদর্শন এবং শব্দ।", privacy_medium: "মাঝারি", privacy_medium_desc: "ছবি, নাম, 'লুকানো বার্তা' এবং শব্দ।", privacy_strict: "কঠোর", privacy_strict_desc: "অ্যাপ আইকন, 'লুকানো পরিচিতি', 'লুকানো বার্তা', কোনো শব্দ নেই।", tooltip_dnd: "বিরক্ত করবেন না", tooltip_delete: "অ্যাকাউন্ট মুছুন", default_account_name: "অ্যাকাউন্ট",
    lang_en: "ইংরেজি", lang_es: "স্প্যানিশ", lang_hi: "হিন্দি", lang_ar: "আরবি", lang_bn: "বাংলা", lang_pt: "পর্তুগিজ", lang_ru: "রাশিয়ান", lang_ur: "উর্দু", lang_id: "ইন্দোনেশিয়ান", lang_fr: "ফরাসি",
    hibernation_title: "অ্যাকাউন্ট হাইবারনেশনে", hibernation_desc: "র‍্যাম খালি করতে এই সেশনটি পজ করা হয়েছে।", wake_button: "জাগ্রত করুন", btn_edit: "সম্পাদনা", btn_delete: "মুছুন", account_status_title: "অ্যাকাউন্টের অবস্থা", account_status_desc: "নিষ্ক্রিয় অ্যাকাউন্ট সংরক্ষিত থাকে, কিন্তু লোড বা বিজ্ঞপ্তি পায় না।", status_active: "সক্রিয়", status_inactive: "নিষ্ক্রিয়", dnd_title: "বিরক্ত করবেন না", dnd_desc: "এই অ্যাকাউন্টের বিজ্ঞপ্তি নীরব করুন।", untitled_account: "নামহীন অ্যাকাউন্ট"
  },
  pt: {
    tooltip_back: "Voltar para as conversas", settings_subtitle: "Preferências globais e gestão de contas", desc_accounts: "Gerencie suas contas do WhatsApp e alterne Não Incomodar.", desc_appearance: "Personalize o tema visual e o idioma da interface.", desc_notifications: "Controle a privacidade das notificações do sistema.", hint_theme: "Escolha o esquema de cores", hint_language: "Selecione o idioma da interface",
    tooltip_add_account: "Adicionar Conta", tooltip_report_bug: "Reportar Erro", tooltip_settings: "Configurações", welcome: "Bem-vindo ao WhatsNexus", welcome_desc: "Selecione uma conta ou adicione uma nova.", settings_title: "Configurações", tab_accounts: "Contas", tab_appearance: "Aparência", tab_notifications: "Notificações", heading_accounts: "Gestão de Contas", label_theme: "Tema", theme_auto: "Automático (Sistema)", theme_light: "Claro", theme_dark: "Escuro", label_language: "Idioma", label_privacy: "Perfil de Privacidade", privacy_broad: "Amplo", privacy_broad_desc: "Foto, nome, pré-visualização da mensagem e som.", privacy_medium: "Médio", privacy_medium_desc: "Foto, nome, 'Mensagem oculta' e som.", privacy_strict: "Rigoroso", privacy_strict_desc: "Ícone da app, 'Contato oculto', 'Mensagem oculta', sem som.", tooltip_dnd: "Não Incomodar", tooltip_delete: "Excluir Conta", default_account_name: "Conta",
    lang_en: "Inglês", lang_es: "Espanhol", lang_hi: "Hindi", lang_ar: "Árabe", lang_bn: "Bengali", lang_pt: "Português", lang_ru: "Russo", lang_ur: "Urdu", lang_id: "Indonésio", lang_fr: "Francês",
    hibernation_title: "Conta em Hibernação", hibernation_desc: "Esta sessão foi pausada para liberar memória RAM.", wake_button: "Despertar", btn_edit: "Editar", btn_delete: "Excluir", account_status_title: "Status da conta", account_status_desc: "Contas desativadas permanecem salvas, mas não carregam nem recebem notificações.", status_active: "Ativada", status_inactive: "Desativada", dnd_title: "Não incomodar", dnd_desc: "Silencie as notificações desta conta.", untitled_account: "Conta sem nome"
  },
  ru: {
    tooltip_back: "Назад к чатам", settings_subtitle: "Глобальные настройки и управление аккаунтами", desc_accounts: "Управляйте аккаунтами WhatsApp и режимом «Не беспокоить».", desc_appearance: "Настройте тему и язык интерфейса.", desc_notifications: "Управляйте приватностью уведомлений.", hint_theme: "Выберите цветовую схему", hint_language: "Выберите язык интерфейса",
    tooltip_add_account: "Добавить аккаунт", tooltip_report_bug: "Сообщить об ошибке", tooltip_settings: "Настройки", welcome: "Добро пожаловать в WhatsNexus", welcome_desc: "Выберите учетную запись или добавьте новую.", settings_title: "Настройки", tab_accounts: "Аккаунты", tab_appearance: "Внешний вид", tab_notifications: "Уведомления", heading_accounts: "Управление аккаунтами", label_theme: "Тема", theme_auto: "Авто (Система)", theme_light: "Светлая", theme_dark: "Темная", label_language: "Язык", label_privacy: "Профиль конфиденциальности", privacy_broad: "Широкий", privacy_broad_desc: "Фото, имя, предпросмотр сообщения и звук.", privacy_medium: "Средний", privacy_medium_desc: "Фото, имя, 'Скрытое сообщение' и звук.", privacy_strict: "Строгий", privacy_strict_desc: "Иконка приложения, 'Скрытый контакт', 'Скрытое сообщение', без звука.", tooltip_dnd: "Не беспокоить", tooltip_delete: "Удалить аккаунт", default_account_name: "Аккаунт",
    lang_en: "Английский", lang_es: "Испанский", lang_hi: "Хинди", lang_ar: "Арабский", lang_bn: "Бенгальский", lang_pt: "Португальский", lang_ru: "Русский", lang_ur: "Урду", lang_id: "Индонезийский", lang_fr: "Французский",
    hibernation_title: "Аккаунт в спящем режиме", hibernation_desc: "Этот сеанс приостановлен для освобождения ОЗУ.", wake_button: "Пробудить", btn_edit: "Редактировать", btn_delete: "Удалить", account_status_title: "Статус аккаунта", account_status_desc: "Отключенные аккаунты сохраняются, но не загружаются и не получают уведомления.", status_active: "Активен", status_inactive: "Отключен", dnd_title: "Не беспокоить", dnd_desc: "Отключить уведомления для этого аккаунта.", untitled_account: "Безымянный аккаунт"
  },
  ur: {
    tooltip_back: "چیٹس پر واپس جائیں", settings_subtitle: "عالمی ترجیحات اور اکاؤنٹ کا نظم", desc_accounts: "اپنے اکاؤنٹس کا انتظام کریں اور پریشان نہ کریں موڈ تبدیل کریں۔", desc_appearance: "تھیم اور زبان تبدیل کریں۔", desc_notifications: "اطلاعات کی رازداری کا انتظام کریں۔", hint_theme: "رنگین تھیم منتخب کریں", hint_language: "زبان منتخب کریں",
    tooltip_add_account: "اکاؤنٹ شامل کریں", tooltip_report_bug: "خرابی کی اطلاع دیں", tooltip_settings: "ترتیبات", welcome: "WhatsNexus میں خوش آمدید", welcome_desc: "ایک اکاؤنٹ منتخب کریں یا نیا شامل کریں۔", settings_title: "ترتیبات", tab_accounts: "اکاؤنٹس", tab_appearance: "ظاہری شکل", tab_notifications: "اطلاعات", heading_accounts: "اکاؤنٹ مینجمنٹ", label_theme: "تھیم", theme_auto: "آٹو (سسٹم)", theme_light: "روشنی", theme_dark: "تاریک", label_language: "زبان", label_privacy: "رازداری پروفائل", privacy_broad: "وسیع", privacy_broad_desc: "تصویر، نام، پیغام کا پیش نظارہ، اور آواز۔", privacy_medium: "درمیانہ", privacy_medium_desc: "تصویر، نام، 'پوشیدہ پیغام'، اور آواز۔", privacy_strict: "سخت", privacy_strict_desc: "ایپ آئیکن، 'پوشیدہ رابطہ'، 'پوشیدہ پیغام'، کوئی آواز نہیں۔", tooltip_dnd: "پریشان نہ کریں", tooltip_delete: "اکاؤنٹ حذف کریں", default_account_name: "اکاؤنٹ",
    lang_en: "انگریزی", lang_es: "ہسپانوی", lang_hi: "ہندی", lang_ar: "عربی", lang_bn: "بنگالی", lang_pt: "پرتگالی", lang_ru: "روسی", lang_ur: "اردو", lang_id: "انڈونیشیائی", lang_fr: "فرانسیسی",
    hibernation_title: "اکاؤنٹ ہائبرنیشن میں", hibernation_desc: "RAM خالی کرنے کے لیے اس سیشن کو روک دیا گیا ہے۔", wake_button: "جاگیں", btn_edit: "ترمیم کریں", btn_delete: "حذف کریں", account_status_title: "اکاؤنٹ کی حیثیت", account_status_desc: "غیر فعال اکاؤنٹس محفوظ رہتے ہیں، لیکن لوڈ یا اطلاعات موصول نہیں کرتے۔", status_active: "فعال", status_inactive: "غیر فعال", dnd_title: "پریشان نہ کریں", dnd_desc: "اس اکاؤنٹ کی اطلاعات کو خاموش کریں۔", untitled_account: "بے نام اکاؤنٹ"
  },
  id: {
    tooltip_back: "Kembali ke obrolan", settings_subtitle: "Preferensi global dan manajemen akun", desc_accounts: "Kelola akun WhatsApp Anda dan mode Jangan Ganggu.", desc_appearance: "Sesuaikan tema dan bahasa antarmuka.", desc_notifications: "Kontrol privasi notifikasi sistem.", hint_theme: "Pilih skema warna", hint_language: "Pilih bahasa antarmuka",
    tooltip_add_account: "Tambah Akun", tooltip_report_bug: "Laporkan Bug", tooltip_settings: "Pengaturan", welcome: "Selamat datang di WhatsNexus", welcome_desc: "Pilih akun atau tambahkan yang baru.", settings_title: "Pengaturan", tab_accounts: "Akun", tab_appearance: "Tampilan", tab_notifications: "Notifikasi", heading_accounts: "Manajemen Akun", label_theme: "Tema", theme_auto: "Otomatis (Sistem)", theme_light: "Terang", theme_dark: "Gelap", label_language: "Bahasa", label_privacy: "Profil Privasi", privacy_broad: "Luas", privacy_broad_desc: "Foto, nama, pratinjau pesan, dan suara.", privacy_medium: "Sedang", privacy_medium_desc: "Foto, nama, 'Pesan tersembunyi', dan suara.", privacy_strict: "Ketat", privacy_strict_desc: "Ikon aplikasi, 'Kontak tersembunyi', 'Pesan tersembunyi', tanpa suara.", tooltip_dnd: "Jangan Ganggu", tooltip_delete: "Hapus Akun", default_account_name: "Akun",
    lang_en: "Inggris", lang_es: "Spanyol", lang_hi: "Hindi", lang_ar: "Arab", lang_bn: "Bengali", lang_pt: "Portugis", lang_ru: "Rusia", lang_ur: "Urdu", lang_id: "Bahasa Indonesia", lang_fr: "Prancis",
    hibernation_title: "Akun dalam Hibernasi", hibernation_desc: "Sesi ini telah dijeda untuk membebaskan RAM.", wake_button: "Bangunkan", btn_edit: "Edit", btn_delete: "Hapus", account_status_title: "Status akun", account_status_desc: "Akun nonaktif tetap tersimpan, tetapi tidak dimuat atau menerima notifikasi.", status_active: "Aktif", status_inactive: "Nonaktif", dnd_title: "Jangan ganggu", dnd_desc: "Bisukan notifikasi untuk akun ini.", untitled_account: "Akun tanpa nama"
  },
  fr: {
    tooltip_back: "Retour aux discussions", settings_subtitle: "Préférences globales et gestion des comptes", desc_accounts: "Gérez vos comptes WhatsApp et le mode Ne pas déranger.", desc_appearance: "Personnalisez le thème et la langue de l'interface.", desc_notifications: "Contrôlez la confidentialité des notifications.", hint_theme: "Choisissez le thème de couleur", hint_language: "Sélectionnez la langue de l'interface",
    tooltip_add_account: "Ajouter un compte", tooltip_report_bug: "Signaler un bug", tooltip_settings: "Paramètres", welcome: "Bienvenue sur WhatsNexus", welcome_desc: "Sélectionnez un compte ou ajoutez-en un nouveau.", settings_title: "Paramètres", tab_accounts: "Comptes", tab_appearance: "Apparence", tab_notifications: "Notifications", heading_accounts: "Gestion des comptes", label_theme: "Thème", theme_auto: "Auto (Système)", theme_light: "Clair", theme_dark: "Sombre", label_language: "Langue", label_privacy: "Profil de confidentialité", privacy_broad: "Large", privacy_broad_desc: "Photo, nom, aperçu du message et son.", privacy_medium: "Moyen", privacy_medium_desc: "Photo, nom, 'Message masqué' et son.", privacy_strict: "Strict", privacy_strict_desc: "Icône de l'application, 'Contact masqué', 'Message masqué', pas de son.", tooltip_dnd: "Ne pas déranger", tooltip_delete: "Supprimer le compte", default_account_name: "Compte",
    lang_en: "Anglais", lang_es: "Espagnol", lang_hi: "Hindi", lang_ar: "Arabe", lang_bn: "Bengali", lang_pt: "Portugais", lang_ru: "Russe", lang_ur: "Ourdou", lang_id: "Indonésien", lang_fr: "Français",
    hibernation_title: "Compte en Hibernation", hibernation_desc: "Cette session a été mise en pause pour libérer de la RAM.", wake_button: "Réveiller", btn_edit: "Modifier", btn_delete: "Supprimer", account_status_title: "Statut du compte", account_status_desc: "Les comptes désactivés restent enregistrés, mais ne sont pas chargés et ne reçoivent pas de notifications.", status_active: "Activé", status_inactive: "Désactivé", dnd_title: "Ne pas déranger", dnd_desc: "Désactiver les notifications de ce compte.", untitled_account: "Compte sans nom"
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
const languageSelect = document.getElementById('language-select');
const privacyRadios = document.querySelectorAll('input[name="privacy-profile"]');

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
    enabled: a.enabled !== false
  }));
  localStorage.setItem('whatsNexusAccounts', JSON.stringify(toSave));
}

function saveSettings() {
  localStorage.setItem('whatsNexusSettings', JSON.stringify(settings));
  applySettings();
}

function applySettings() {
  if (settings.theme === 'theme-auto') {
    const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.body.className = isDark ? 'theme-dark' : 'theme-light';
  } else {
    document.body.className = settings.theme;
  }
  
  themeSelect.value = settings.theme;
  document.querySelector(`input[name="privacy-profile"][value="${settings.privacy}"]`).checked = true;
  
  updateTranslations();
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

function renderAccountSidebarItem(account) {
  const li = document.createElement('li');
  li.className = 'account-item tooltip-container';
  li.dataset.id = account.id;
  
  li.innerHTML = `
    <div class="account-avatar" id="avatar_${account.id}">
      ${getAvatarHtml(account)}
    </div>
    <span class="tooltip-text" id="tooltip_${account.id}">${account.name}</span>
  `;
  
  li.addEventListener('click', () => {
    activateAccount(account.id);
  });
  
  accountList.appendChild(li);
}

function updateAccountSidebarItem(account) {
  const avatarDiv = document.getElementById(`avatar_${account.id}`);
  if (avatarDiv) {
    avatarDiv.innerHTML = getAvatarHtml(account);
  }
  const tooltip = document.getElementById(`tooltip_${account.id}`);
  if (tooltip) {
    tooltip.innerText = account.name;
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
  webview.setAttribute('webpreferences', 'backgroundThrottling=yes'); // CRITICO: Throttling de memoria
  
  const preloadPath = path.join(__dirname, '..', 'preload.js');
  webview.setAttribute('preload', `file://${preloadPath}`);
  webview.setAttribute('useragent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  webview.className = 'webview-active';

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
    card.className = `settings-account-card ${!isEnabled ? 'account-disabled' : ''}`;
    card.dataset.id = acc.id;
    
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
        <div class="segmented-control">
          <button class="segmented-btn status-active-btn ${isEnabled ? 'active' : ''}" onclick="setAccountStatus('${acc.id}', true)">
            ${lang.status_active}
          </button>
          <button class="segmented-btn status-inactive-btn ${!isEnabled ? 'active' : ''}" onclick="setAccountStatus('${acc.id}', false)">
            ${lang.status_inactive}
          </button>
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
  }
};

window.deleteAccount = deleteAccount;

themeSelect.addEventListener('change', (e) => {
  settings.theme = e.target.value;
  saveSettings();
});

languageSelect.addEventListener('change', (e) => {
  settings.language = e.target.value;
  saveSettings();
});

privacyRadios.forEach(radio => {
  radio.addEventListener('change', (e) => {
    settings.privacy = e.target.value;
    saveSettings();
  });
});

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
