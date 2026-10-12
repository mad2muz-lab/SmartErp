export type SupportedLanguage = 'ar' | 'en' | 'hi' | 'ur' | 'bn' | 'ne' | 'tl';

export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  dir: 'rtl' | 'ltr';
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl', flag: '🇸🇦' },
  { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr', flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', dir: 'ltr', flag: '🇮🇳' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', dir: 'rtl', flag: '🇵🇰' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', dir: 'ltr', flag: '🇧🇩' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', dir: 'ltr', flag: '🇳🇵' },
  { code: 'tl', name: 'Tagalog', nativeName: 'Tagalog / Filipino', dir: 'ltr', flag: '🇵🇭' },
];

export const posTranslations: Record<SupportedLanguage, Record<string, string>> = {
  ar: {
    // Top banner
    posTitle: 'نقطة البيع السريعة',
    live: 'مباشر',
    zatcaPhase: 'معتمد ZATCA المرحلة 1 و 2',
    vatNumber: 'الرقم الضريبي',
    quickAdd: '+ إضافة صنف سريع',
    bulkCsv: 'استيراد بالجملة (CSV)',
    storeProductsTab: 'أصناف المتجر',
    fullScreen: 'ملء الشاشة',
    cartMobile: 'السلة',

    // Tabs
    tabFastTiles: '⚡ الأصناف السريعة',
    tabKeypad: '🔢 لوحة الأرقام',
    tabCatalog: '📦 كتالوج البيع',
    tabStoreProducts: '🏷️ أصناف المتجر',

    // Keypad tab
    customItemLabelPlaceholder: 'وصف الصنف المخصص (اختياري)...',
    keypadDisplayTitle: 'المبلغ المدخل (شامل الضريبة 15%)',
    clear: 'مسح',
    addToOrder: 'إضافة للطلب',
    enterValidAmount: 'يرجى إدخال مبلغ صالح',

    // Catalog tab
    searchPlaceholder: 'ابحث بالاسم أو الباركود أو الكود...',
    sku: 'كود',

    // Store products tab
    registeredItems: 'صنف مسجل',
    storeProductsSub: 'أصناف متجرك المتاحة للبيع الفوري',
    addSingleProduct: '+ صنف جديد',
    bulkCsvImport: 'استيراد بالجملة (Bulk CSV)',
    searchProductsPlaceholder: 'ابحث في منتجات المتجر...',
    allCategories: 'جميع التصنيفات',
    colArabicName: 'الاسم بالعربي',
    colEnglishName: 'الاسم بالإنجليزي',
    colPrice: 'السعر (\uE900)',
    colCategory: 'التصنيف',
    colSku: 'الباركود / SKU',
    colActions: 'إجراءات',
    noProductsFound: 'لم يتم العثور على أصناف تطابق البحث',
    quickAddPrompt: 'أضف صنف جديد الآن',

    // Bill / Checkout
    orderBill: 'فاتورة العميل',
    itemsSelected: 'أصناف مختارة',
    emptyCartTitle: 'السلة فارغة حالياً',
    emptyCartDesc: 'اضغط على أي صنف أو استخدم لوحة الأرقام لإضافته للطلب',
    clearCart: 'مسح السلة',
    unitPrice: 'للوحدة',
    subtotal: 'المجموع قبل الضريبة:',
    vatAmount: 'ضريبة القيمة المضافة (15%):',
    grandTotal: 'المبلغ الإجمالي شامل الضريبة:',
    printReceiptBtn: 'طباعة الإيصال الفوري (80mm)',
    emptyCartWarning: 'السلة فارغة، يرجى إضافة أصناف قبل الطباعة',
    itemAddedToast: 'تمت إضافة',

    // Modals
    editProduct: 'تعديل الصنف',
    saveChanges: 'حفظ التعديلات',
    cancel: 'إلغاء',
    deleteConfirm: 'هل أنت متأكد من حذف الصنف؟',
    bulkModalTitle: 'إضافة أصناف بالجملة • Bulk CSV Import',
    bulkModalDesc: 'الصق أسطر CSV أو انسخ من ملف Excel لإضافة عدة أصناف فوراً',
    downloadSampleCsv: 'تحميل نموذج CSV',
    importNowBtn: 'استيراد كافة الأصناف الآن',
    uploadingItems: 'جاري رفع الأصناف...',
    requiredColumnsOrder: 'ترتيب الأعمدة المطلوب: 1. الاسم بالعربي • 2. الاسم بالإنجليزي • 3. السعر بالريال • 4. التصنيف • 5. الباركود',
  },

  en: {
    // Top banner
    posTitle: 'Quick POS Cashier',
    live: 'LIVE',
    zatcaPhase: 'ZATCA Certified Phase 1 & 2',
    vatNumber: 'VAT Number',
    quickAdd: '+ Quick Add Item',
    bulkCsv: 'Bulk Import (CSV)',
    storeProductsTab: 'Store Products',
    fullScreen: 'Fullscreen',
    cartMobile: 'Cart',

    // Tabs
    tabFastTiles: '⚡ Fast Tiles',
    tabKeypad: '🔢 Numpad / Custom',
    tabCatalog: '📦 Catalog',
    tabStoreProducts: '🏷️ Store Products',

    // Keypad tab
    customItemLabelPlaceholder: 'Custom item note (optional)...',
    keypadDisplayTitle: 'ENTERED AMOUNT (INCL. 15% VAT)',
    clear: 'Clear',
    addToOrder: 'Add to Order',
    enterValidAmount: 'Please enter a valid price amount',

    // Catalog tab
    searchPlaceholder: 'Search by name, barcode, or SKU...',
    sku: 'SKU',

    // Store products tab
    registeredItems: 'items registered',
    storeProductsSub: 'Store catalog products ready for instant sale',
    addSingleProduct: '+ Add Product',
    bulkCsvImport: 'Bulk Import (CSV)',
    searchProductsPlaceholder: 'Search store products...',
    allCategories: 'All Categories',
    colArabicName: 'Arabic Name',
    colEnglishName: 'English Name',
    colPrice: 'Price (\uE900)',
    colCategory: 'Category',
    colSku: 'SKU / Barcode',
    colActions: 'Actions',
    noProductsFound: 'No products match your search',
    quickAddPrompt: 'Add your first product now',

    // Bill / Checkout
    orderBill: 'Customer Bill',
    itemsSelected: 'items selected',
    emptyCartTitle: 'Cart is empty',
    emptyCartDesc: 'Tap any product or enter price to add to order',
    clearCart: 'Clear Cart',
    unitPrice: 'each',
    subtotal: 'Subtotal (Excl. VAT):',
    vatAmount: 'VAT Amount (15%):',
    grandTotal: 'Grand Total (Incl. VAT):',
    printReceiptBtn: 'Print Instant Receipt (80mm)',
    emptyCartWarning: 'Cart is empty. Please add items before printing receipt.',
    itemAddedToast: 'Added',

    // Modals
    editProduct: 'Edit Product',
    saveChanges: 'Save Changes',
    cancel: 'Cancel',
    deleteConfirm: 'Are you sure you want to delete this product?',
    bulkModalTitle: 'Bulk Products Import (CSV / Excel)',
    bulkModalDesc: 'Paste CSV rows or copy from Excel to upload dozens of products at once',
    downloadSampleCsv: 'Download Sample CSV',
    importNowBtn: 'Import All Products Now',
    uploadingItems: 'Uploading products...',
    requiredColumnsOrder: 'Column Order: 1. Arabic Name • 2. English Name • 3. Price (\uE900) • 4. Category • 5. SKU',
  },

  hi: {
    // Top banner
    posTitle: 'त्वरित पीओएस काउंटर',
    live: 'लाइव',
    zatcaPhase: 'ZATCA चरण 1 और 2 प्रमाणित',
    vatNumber: 'वैट नंबर',
    quickAdd: '+ तुरंत आइटम जोड़ें',
    bulkCsv: 'थोक आयात (CSV)',
    storeProductsTab: 'दुकान उत्पाद',
    fullScreen: 'पूर्ण स्क्रीन',
    cartMobile: 'कार्ट',

    // Tabs
    tabFastTiles: '⚡ त्वरित आइटम (Tiles)',
    tabKeypad: '🔢 कीपैड (Keypad)',
    tabCatalog: '📦 उत्पाद सूची',
    tabStoreProducts: '🏷️ दुकान उत्पाद',

    // Keypad tab
    customItemLabelPlaceholder: 'आइटम का नाम / विवरण (वैकल्पिक)...',
    keypadDisplayTitle: 'दर्ज राशि (15% वैट सहित)',
    clear: 'मिटाएं',
    addToOrder: 'ऑर्डर में जोड़ें',
    enterValidAmount: 'कृपया मान्य राशि दर्ज करें',

    // Catalog tab
    searchPlaceholder: 'नाम, बारकोड या कोड द्वारा खोजें...',
    sku: 'कोड',

    // Store products tab
    registeredItems: 'उत्पाद पंजीकृत',
    storeProductsSub: 'बिक्री के लिए तैयार आपकी दुकान के उत्पाद',
    addSingleProduct: '+ नया उत्पाद',
    bulkCsvImport: 'थोक आयात (CSV)',
    searchProductsPlaceholder: 'दुकान के उत्पाद खोजें...',
    allCategories: 'सभी श्रेणियां',
    colArabicName: 'अरबी नाम',
    colEnglishName: 'अंग्रेज़ी नाम',
    colPrice: 'कीमत (\uE900)',
    colCategory: 'श्रेणी',
    colSku: 'बारकोड / SKU',
    colActions: 'कार्रवाई',
    noProductsFound: 'कोई उत्पाद नहीं मिला',
    quickAddPrompt: 'पहला उत्पाद जोड़ें',

    // Bill / Checkout
    orderBill: 'ग्राहक बिल',
    itemsSelected: 'आइटम चुने गए',
    emptyCartTitle: 'कार्ट अभी खाली है',
    emptyCartDesc: 'आइटम जोड़ने के लिए किसी भी उत्पाद पर टैप करें',
    clearCart: 'कार्ट खाली करें',
    unitPrice: 'प्रति इकाई',
    subtotal: 'उप-योग (वैट बिना):',
    vatAmount: 'वैट राशि (15%):',
    grandTotal: 'कुल देय राशि (वैट सहित):',
    printReceiptBtn: 'तुरंत रसीद प्रिंट करें (80mm)',
    emptyCartWarning: 'कार्ट खाली है, कृपया पहले आइटम जोड़ें',
    itemAddedToast: 'जोड़ा गया',

    // Modals
    editProduct: 'उत्पाद संपादित करें',
    saveChanges: 'परिवर्तन सहेजें',
    cancel: 'रद्द करें',
    deleteConfirm: 'क्या आप वाकई इस उत्पाद को हटाना चाहते हैं?',
    bulkModalTitle: 'थोक उत्पाद आयात (CSV / Excel)',
    bulkModalDesc: 'एक साथ कई आइटम जोड़ने के लिए CSV पंक्तियाँ पेस्ट करें',
    downloadSampleCsv: 'नमूना CSV डाउनलोड करें',
    importNowBtn: 'सभी उत्पाद अभी आयात करें',
    uploadingItems: 'उत्पाद अपलोड हो रहे हैं...',
    requiredColumnsOrder: 'कॉलम क्रम: 1. अरबी नाम • 2. अंग्रेज़ी नाम • 3. मूल्य (\uE900) • 4. श्रेणी • 5. बारकोड',
  },

  ur: {
    // Top banner
    posTitle: 'فوری پی او ایس کیشیر',
    live: 'لائیو',
    zatcaPhase: 'زکوٰۃ و ٹیکس ZATCA منظور شدہ',
    vatNumber: 'ٹیکس نمبر',
    quickAdd: '+ فوری آئٹم شامل کریں',
    bulkCsv: 'بلک درآمد (CSV)',
    storeProductsTab: 'دکان کی اشیاء',
    fullScreen: 'مکمل اسکرین',
    cartMobile: 'ٹوکری',

    // Tabs
    tabFastTiles: '⚡ تیز رفتار آئٹمز',
    tabKeypad: '🔢 کی پیڈ (Keypad)',
    tabCatalog: '📦 کیٹلاگ',
    tabStoreProducts: '🏷️ اسٹور کی مصنوعات',

    // Keypad tab
    customItemLabelPlaceholder: 'آئٹم کی تفصیل (اختیاری)...',
    keypadDisplayTitle: 'درج کردہ رقم (15% ٹیکس سمیت)',
    clear: 'صاف کریں',
    addToOrder: 'آرڈر میں شامل کریں',
    enterValidAmount: 'براہ کرم درست رقم درج کریں',

    // Catalog tab
    searchPlaceholder: 'نام، بارکوڈ یا SKU سے تلاش کریں...',
    sku: 'کوڈ',

    // Store products tab
    registeredItems: 'آئٹمز درج ہیں',
    storeProductsSub: 'فوری فروخت کے لیے تیار آپ کی دکان کا کیٹلاگ',
    addSingleProduct: '+ نیا آئٹم',
    bulkCsvImport: 'بلک درآمد (CSV)',
    searchProductsPlaceholder: 'اشیاء تلاش کریں...',
    allCategories: 'تمام اقسام',
    colArabicName: 'عربی نام',
    colEnglishName: 'انگریزی نام',
    colPrice: 'قیمت (\uE900)',
    colCategory: 'قسم / Category',
    colSku: 'بارکوڈ / SKU',
    colActions: 'اقدامات',
    noProductsFound: 'کوئی آئٹم نہیں ملا',
    quickAddPrompt: 'پہلا آئٹم شامل کریں',

    // Bill / Checkout
    orderBill: 'کسٹمر بل',
    itemsSelected: 'منتخب آئٹمز',
    emptyCartTitle: 'ٹوکری خالی ہے',
    emptyCartDesc: 'آرڈر میں شامل کرنے کے لیے کسی بھی آئٹم پر کلک کریں',
    clearCart: 'ٹوکری خالی کریں',
    unitPrice: 'فی یونٹ',
    subtotal: 'رقم قبل از ٹیکس:',
    vatAmount: 'ٹیکس (15%):',
    grandTotal: 'کل واجب الادا رقم (بشمول ٹیکس):',
    printReceiptBtn: 'فوری رسید پرنٹ کریں (80mm)',
    emptyCartWarning: 'ٹوکری خالی ہے، پرنٹ کرنے سے پہلے اشیاء شامل کریں',
    itemAddedToast: 'شامل کر دیا گیا',

    // Modals
    editProduct: 'آئٹم میں ترمیم کریں',
    saveChanges: 'تبدیلیاں محفوظ کریں',
    cancel: 'منسوخ کریں',
    deleteConfirm: 'کیا آپ واقعی اس آئٹم کو حذف کرنا چاہتے ہیں؟',
    bulkModalTitle: 'بلک آئٹم درآمد (CSV / Excel)',
    bulkModalDesc: 'ایک ساتھ درجنوں اشیاء شامل کرنے کے لیے CSV پیسٹ کریں',
    downloadSampleCsv: 'نمونہ CSV ڈاؤن لوڈ کریں',
    importNowBtn: 'تمام اشیاء ابھی درآمد کریں',
    uploadingItems: 'اشیاء اپ لوڈ ہو رہی ہیں...',
    requiredColumnsOrder: 'کالمز کی ترتیب: 1. عربی نام • 2. انگریزی نام • 3. قیمت (\uE900) • 4. قسم • 5. بارکوڈ',
  },

  bn: {
    // Top banner
    posTitle: 'কুইক পিওএস ক্যাশিয়ার',
    live: 'লাইভ',
    zatcaPhase: 'ZATCA ফেজ ১ এবং ২ সার্টিফাইড',
    vatNumber: 'ভ্যাট নম্বর',
    quickAdd: '+ দ্রুত আইটেম যোগ করুন',
    bulkCsv: 'বাল্ক ইম্পোর্ট (CSV)',
    storeProductsTab: 'দোকানের পণ্য',
    fullScreen: 'ফুলস্ক্রিন',
    cartMobile: 'কার্ট',

    // Tabs
    tabFastTiles: '⚡ দ্রুত আইটেম (Tiles)',
    tabKeypad: '🔢 কীপ্যাড (Keypad)',
    tabCatalog: '📦 ক্যাটালগ',
    tabStoreProducts: '🏷️ স্টোর পণ্য',

    // Keypad tab
    customItemLabelPlaceholder: 'আইটেমের বিবরণ (ঐচ্ছিক)...',
    keypadDisplayTitle: 'প্রবিষ্ট পরিমাণ (১৫% ভ্যাট সহ)',
    clear: 'মুছুন',
    addToOrder: 'অর্ডারে যোগ করুন',
    enterValidAmount: 'দয়া করে একটি সঠিক পরিমাণ লিখুন',

    // Catalog tab
    searchPlaceholder: 'নাম, বারকোড বা কোড দিয়ে খুঁজুন...',
    sku: 'এসকেইউ',

    // Store products tab
    registeredItems: 'আইটেম নিবন্ধিত',
    storeProductsSub: 'বিক্রির জন্য প্রস্তুত আপনার দোকানের পণ্য তালিকা',
    addSingleProduct: '+ নতুন পণ্য',
    bulkCsvImport: 'বাল্ক ইম্পোর্ট (CSV)',
    searchProductsPlaceholder: 'পণ্য খুঁজুন...',
    allCategories: 'সকল ক্যাটাগরি',
    colArabicName: 'আরবি নাম',
    colEnglishName: 'ইংরেজি নাম',
    colPrice: 'মূল্য (\uE900)',
    colCategory: 'ক্যাটাগরি',
    colSku: 'বারকোড / SKU',
    colActions: 'অ্যাকশন',
    noProductsFound: 'কোনো পণ্য পাওয়া যায়নি',
    quickAddPrompt: 'প্রথম পণ্যটি এখনই যোগ করুন',

    // Bill / Checkout
    orderBill: 'গ্রাহকের বিল',
    itemsSelected: 'আইটেম নির্বাচিত',
    emptyCartTitle: 'কার্ট এখন খালি',
    emptyCartDesc: 'অর্ডারে যোগ করতে যেকোনো পণ্যে স্পর্শ করুন',
    clearCart: 'কার্ট পরিষ্কার করুন',
    unitPrice: 'প্রতি ইউনিট',
    subtotal: 'উপমোট (ভ্যাট ছাড়া):',
    vatAmount: 'ভ্যাট (১৫%):',
    grandTotal: 'সর্বমোট প্রদেয় বিল (ভ্যাট সহ):',
    printReceiptBtn: 'তাৎক্ষণিক রশিদ প্রিন্ট করুন (80mm)',
    emptyCartWarning: 'কার্ট খালি, প্রিন্ট করার আগে আইটেম যোগ করুন',
    itemAddedToast: 'যোগ করা হয়েছে',

    // Modals
    editProduct: 'পণ্য সম্পাদনা করুন',
    saveChanges: 'সংরক্ষণ করুন',
    cancel: 'বাতিল',
    deleteConfirm: 'আপনি কি নিশ্চিত যে এই পণ্যটি মুছে ফেলতে চান?',
    bulkModalTitle: 'বাল্ক পণ্য ইম্পোর্ট (CSV / Excel)',
    bulkModalDesc: 'একসাথে অনেক পণ্য যোগ করতে CSV পেস্ট করুন',
    downloadSampleCsv: 'নমুনা CSV ডাউনলোড করুন',
    importNowBtn: 'সকল পণ্য এখনই ইম্পোর্ট করুন',
    uploadingItems: 'পণ্য আপলোড হচ্ছে...',
    requiredColumnsOrder: 'কলাম ক্রম: ১. আরবি নাম • ২. ইংরেজি নাম • ৩. মূল্য (\uE900) • ৪. ক্যাটাগরি • ৫. বারকোড',
  },

  ne: {
    // Top banner
    posTitle: 'द्रुत पीओएस क्यासियर',
    live: 'प्रत्यक्ष (LIVE)',
    zatcaPhase: 'ZATCA चरण १ र २ प्रमाणित',
    vatNumber: 'भ्याट नम्बर',
    quickAdd: '+ तुरुन्त सामान थप्नुहोस्',
    bulkCsv: 'थोक आयात (CSV)',
    storeProductsTab: 'पसलका सामानहरू',
    fullScreen: 'पूरा स्क्रिन',
    cartMobile: 'झोला (Cart)',

    // Tabs
    tabFastTiles: '⚡ द्रुत सामानहरू (Tiles)',
    tabKeypad: '🔢 किप्याड (Keypad)',
    tabCatalog: '📦 सूची (Catalog)',
    tabStoreProducts: '🏷️ पसलका उत्पादनहरू',

    // Keypad tab
    customItemLabelPlaceholder: 'सामानको नाम / विवरण (वैकल्पिक)...',
    keypadDisplayTitle: 'प्रविष्ट रकम (१५% भ्याट सहित)',
    clear: 'हटाउनुहोस्',
    addToOrder: 'अर्डरमा थप्नुहोस्',
    enterValidAmount: 'कृपया मान्य मूल्य प्रविष्ट गर्नुहोस्',

    // Catalog tab
    searchPlaceholder: 'नाम वा बारकोड खोज्नुहोस्...',
    sku: 'कोड',

    // Store products tab
    registeredItems: 'सामान दर्ता गरियो',
    storeProductsSub: 'तपाईंको पसलका तत्काल बिक्रीयोग्य उत्पादनहरू',
    addSingleProduct: '+ नयाँ सामान',
    bulkCsvImport: 'थोक आयात (CSV)',
    searchProductsPlaceholder: 'उत्पादनहरू खोज्नुहोस्...',
    allCategories: 'सबै वर्गहरू',
    colArabicName: 'अरबी नाम',
    colEnglishName: 'अंग्रेजी नाम',
    colPrice: 'मूल्य (\uE900)',
    colCategory: 'वर्ग (Category)',
    colSku: 'बारकोड / SKU',
    colActions: 'कार्यहरू',
    noProductsFound: 'कुनै सामान फेला परेन',
    quickAddPrompt: 'पहिलो सामान थप्नुहोस्',

    // Bill / Checkout
    orderBill: 'ग्राहकको बिल',
    itemsSelected: 'सामान चयन गरियो',
    emptyCartTitle: 'झोला अहिले खाली छ',
    emptyCartDesc: 'अर्डरमा थप्न कुनै पनि सामानमा क्लिक गर्नुहोस्',
    clearCart: 'झोला खाली गर्नुहोस्',
    unitPrice: 'प्रति एकाइ',
    subtotal: 'कुल रकम (भ्याट बाहेक):',
    vatAmount: 'भ्याट रकम (१५%):',
    grandTotal: 'जम्मा तिर्नुपर्ने रकम (भ्याट सहित):',
    printReceiptBtn: 'तुरुन्त रसिद छाप्नुहोस् (80mm)',
    emptyCartWarning: 'झोला खाली छ, कृपया रसिद छाप्नुअघि सामान थप्नुहोस्',
    itemAddedToast: 'थपियो',

    // Modals
    editProduct: 'सामान सम्पादन गर्नुहोस्',
    saveChanges: 'परिवर्तन सुरक्षित गर्नुहोस्',
    cancel: 'रद्द गर्नुहोस्',
    deleteConfirm: 'के तपाईं यो सामान पक्का हटाउन चाहनुहुन्छ?',
    bulkModalTitle: 'थोक उत्पादन आयात (CSV / Excel)',
    bulkModalDesc: 'एकैचोटि धेरै सामान थप्न CSV टाँस्नुहोस्',
    downloadSampleCsv: 'नमूना CSV डाउनलोड गर्नुहोस्',
    importNowBtn: 'सबै सामान अहिले आयात गर्नुहोस्',
    uploadingItems: 'सामान अपलोड हुँदैछ...',
    requiredColumnsOrder: 'कॉलम क्रम: १. अरबी नाम • २. अंग्रेजी नाम • ३. मूल्य (\uE900) • ४. वर्ग • ५. बारकोड',
  },

  tl: {
    // Top banner
    posTitle: 'Mabilisang POS Cashier',
    live: 'LIVE',
    zatcaPhase: 'Sertipikadong ZATCA Phase 1 & 2',
    vatNumber: 'Numero ng VAT',
    quickAdd: '+ Mabilisang Dagdag ng Aytem',
    bulkCsv: 'Maramihang Pag-import (CSV)',
    storeProductsTab: 'Mga Produkto sa Tindahan',
    fullScreen: 'Fullscreen',
    cartMobile: 'Kariton (Cart)',

    // Tabs
    tabFastTiles: '⚡ Mabilisang Pindot (Tiles)',
    tabKeypad: '🔢 Numpad / Custom',
    tabCatalog: '📦 Katalogo',
    tabStoreProducts: '🏷️ Mga Produkto sa Tindahan',

    // Keypad tab
    customItemLabelPlaceholder: 'Pangalan o deskripsyon ng aytem (opsyonal)...',
    keypadDisplayTitle: 'HALAGANG IPINASOK (KASAMA ANG 15% VAT)',
    clear: 'Burahin',
    addToOrder: 'Idagdag sa Order',
    enterValidAmount: 'Mangyaring maglagay ng wastong halaga',

    // Catalog tab
    searchPlaceholder: 'Maghanap gamit ang pangalan o barcode...',
    sku: 'SKU',

    // Store products tab
    registeredItems: 'mga nakarehistrong produkto',
    storeProductsSub: 'Mga produkto ng tindahan na handa para sa benta',
    addSingleProduct: '+ Magdagdag ng Produkto',
    bulkCsvImport: 'Maramihang Pag-import (CSV)',
    searchProductsPlaceholder: 'Maghanap ng produkto...',
    allCategories: 'Lahat ng Kategorya',
    colArabicName: 'Pangalan sa Arabic',
    colEnglishName: 'Pangalan sa English',
    colPrice: 'Presyo (\uE900)',
    colCategory: 'Kategorya',
    colSku: 'SKU / Barcode',
    colActions: 'Aksyon',
    noProductsFound: 'Walang nahanap na produkto',
    quickAddPrompt: 'Magdagdag ng unang produkto ngayon',

    // Bill / Checkout
    orderBill: 'Resibo ng Kostumer',
    itemsSelected: 'napiling aytem',
    emptyCartTitle: 'Walang laman ang kariton',
    emptyCartDesc: 'Pindutin ang anumang produkto o maglagay ng presyo para maidagdag',
    clearCart: 'Alisin Lahat',
    unitPrice: 'bawat isa',
    subtotal: 'Kabuuang Halaga (Bago ang VAT):',
    vatAmount: 'Halaga ng VAT (15%):',
    grandTotal: 'Kabuuang Bayarin (Kasama ang VAT):',
    printReceiptBtn: 'I-print ang Resibo Agad (80mm)',
    emptyCartWarning: 'Walang laman ang kariton, magdagdag muna bago mag-print',
    itemAddedToast: 'Naidagdag',

    // Modals
    editProduct: 'I-edit ang Produkto',
    saveChanges: 'I-save ang Pagbabago',
    cancel: 'Kanselahin',
    deleteConfirm: 'Sigurado ka bang nais mong tanggalin ang produktong ito?',
    bulkModalTitle: 'Maramihang Pag-import ng Produkto (CSV / Excel)',
    bulkModalDesc: 'I-paste ang mga linya ng CSV mula sa Excel para magdagdag nang maramihan',
    downloadSampleCsv: 'I-download ang Halimbawang CSV',
    importNowBtn: 'I-import Lahat Ngayon',
    uploadingItems: 'Ina-upload ang mga aytem...',
    requiredColumnsOrder: 'Pagkakasunod ng Kolum: 1. Arabic Name • 2. English Name • 3. Presyo (\uE900) • 4. Kategorya • 5. Barcode',
  },
};
