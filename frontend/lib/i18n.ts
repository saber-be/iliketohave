import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      appName: 'iliketohave',
      heroTitleLine1: 'Collect, share &',
      heroTitleHighlight: 'never forget what you want.',
      heroSubtitle:
        "iliketohave keeps all your wishes in one beautiful place. Create wishlists, share them with friends and family, and track what you've already received.",
      heroCta: 'Login or Register',
      heroNote: "No spam. Just a simple way to share what you'd love to have.",

      // Dashboard / wishlists
      dashboardTitle: 'My wishlists',
      dashboardNewWishlist: 'New wishlist',
      dashboardEmpty:
        'No wishlists yet. A wishlist is a place to collect things you might want in the future. Click {{button}} above to create your first one.',

      // Wizard titles / intro
      wizardTitleStep1: 'Step 1 of 3 - Give your wishlist a name',
      wizardTitleStep2: 'Step 2 of 3 - Add a short description (optional)',
      wizardTitleStep3: 'Step 3 of 3 - Who can see this wishlist?',
      wizardIntro:
        'We will guide you through 3 quick steps to create a wishlist. This usually takes less than a minute.',

      // Wizard fields
      wizardFieldNameLabel: 'Wishlist name',
      wizardFieldNamePlaceholder: 'e.g. Books I want to read, Gadgets for 2025',
      wizardFieldNameHelp:
        'This is a short label to help you recognize this wishlist later. Only you will see this name unless you make the wishlist public in the last step.',

      wizardFieldDescriptionLabel: 'Description (optional)',
      wizardFieldDescriptionPlaceholder:
        'e.g. Things to buy before my trip in June, or Courses I want to complete this year',
      wizardFieldDescriptionHelp:
        'Use this to remind yourself what belongs in this wishlist. You can leave it empty if the name is already clear for you.',

      // Visibility
      wizardVisibilityHelp:
        'Choose who can see this wishlist. You can change this later from the wishlist page.',
      wizardVisibilityPrivateTitle: 'Private (recommended)',
      wizardVisibilityPrivateDesc: 'Only you can see this wishlist.',
      wizardVisibilityPublicTitle: 'Public',
      wizardVisibilityPublicDesc:
        'Anyone with the link can see this wishlist. They cannot edit it.',

      // Buttons / errors
      wizardBack: 'Back',
      wizardNext: 'Next',
      wizardCreate: 'Create wishlist',
      wizardCreating: 'Creating your wishlist…',
      wizardErrorNameRequired:
        'Please enter a name so you can recognize this wishlist later.',
      wizardErrorGeneric:
        'Something went wrong while creating your wishlist. Please try again.',

      // Item wizard (add first item)
      itemWizardTitleStep1: 'Step 1 of 3 - What do you want to add?',
      itemWizardTitleStep2: 'Step 2 of 3 - Add a link (optional)',
      itemWizardTitleStep3: 'Step 3 of 3 - Add a short note (optional)',
      itemWizardIntro:
        'We will help you add your first item to this wishlist. You can always add more items later.',
      itemWizardFieldNameLabel: 'Item name',
      itemWizardFieldNamePlaceholder:
        'e.g. Noise-cancelling headphones, JavaScript course',
      itemWizardFieldNameHelp:
        'This is the main thing you want to add to this wishlist.',
      itemWizardFieldLinkLabel: 'Link (optional)',
      itemWizardFieldLinkPlaceholder: 'Paste a product link or any URL here',
      itemWizardFieldLinkHelp:
        'Adding a link helps you or others find the exact item later, but you can also skip this.',
      itemWizardFieldNoteLabel: 'Note (optional)',
      itemWizardFieldNotePlaceholder:
        'Add any details you want to remember about this item',
      itemWizardFieldNoteHelp:
        'You can add size, color, or anything else that matters to you.',
      itemWizardBack: 'Back',
      itemWizardNext: 'Next',
      itemWizardCreate: 'Add item to wishlist',
      itemWizardCreating: 'Adding your item…',
      itemWizardErrorNameRequired: 'Please enter a name for this item.',
      itemWizardErrorGeneric:
        'Something went wrong while adding this item. Please try again.',
    },
  },
  fa: {
    translation: {
      appName: 'iliketohave',
      heroTitleLine1: 'جمع کن، به اشتراک بگذار و',
      heroTitleHighlight: 'هیچ‌وقت چیزهایی که می‌خوای رو فراموش نکن.',
      heroSubtitle:
        'iliketohave همه‌ی خواسته‌هات رو یک‌جا نگه می‌داره. لیست آرزو بساز، با بقیه به اشتراک بذار و چیزهایی که گرفتی رو پیگیری کن.',
      heroCta: 'ورود یا ثبت‌نام',
      heroNote:
        'بدون اسپم؛ فقط یک راه ساده برای به اشتراک گذاشتن چیزهایی که دوست داری داشته باشی.',

      // Dashboard / wishlists
      dashboardTitle: 'لیست آرزوهای من',
      dashboardNewWishlist: 'لیست آرزوی جدید',
      dashboardEmpty:
        'هنوز هیچ لیست آرزویی نداری. لیست آرزو جاییه برای جمع کردن چیزهایی که ممکنه در آینده بخوای داشته باشی. برای ساخت اولین لیست، روی دکمه {{button}} بالا بزن.',

      // Wizard titles / intro
      wizardTitleStep1: 'قدم ۱ از ۳ - برای لیست آرزوت اسم بگذار',
      wizardTitleStep2: 'قدم ۲ از ۳ - یک توضیح کوتاه بنویس (اختیاری)',
      wizardTitleStep3: 'قدم ۳ از ۳ - چه کسی این لیست را ببیند؟',
      wizardIntro:
        'در سه قدم کوتاه بهت کمک می‌کنیم یک لیست آرزو بسازی. معمولاً کمتر از یک دقیقه زمان می‌برد.',

      // Wizard fields
      wizardFieldNameLabel: 'نام لیست آرزو',
      wizardFieldNamePlaceholder:
        'مثلاً: کتاب‌هایی که می‌خوام بخونم، گجت‌های سال بعد',
      wizardFieldNameHelp:
        'این فقط یک اسم کوتاهه تا بعداً راحت لیست آرزوت رو بشناسی. مگر اینکه در قدم آخر لیست رو عمومی کنی، فقط خودت این اسم رو می‌بینی.',

      wizardFieldDescriptionLabel: 'توضیح (اختیاری)',
      wizardFieldDescriptionPlaceholder:
        'مثلاً: چیزهایی که باید قبل از سفر خرداد بخرم، یا دوره‌هایی که می‌خوام امسال بگذرونم',
      wizardFieldDescriptionHelp:
        'اینجا می‌تونی برای خودت توضیح بدی که چه چیزهایی باید داخل این لیست باشد. اگر اسمِ لیست برات واضح است، می‌تونی این قسمت را خالی بگذاری.',

      // Visibility
      wizardVisibilityHelp:
        'انتخاب کن چه کسی بتواند این لیست آرزو را ببیند. بعداً هم می‌توانی این تنظیم را از صفحه‌ی خود لیست تغییر بدهی.',
      wizardVisibilityPrivateTitle: 'خصوصی (پیشنهادی)',
      wizardVisibilityPrivateDesc: 'فقط خودت می‌توانی این لیست آرزو را ببینی.',
      wizardVisibilityPublicTitle: 'عمومی',
      wizardVisibilityPublicDesc:
        'هر کسی که لینک را داشته باشد می‌تواند این لیست آرزو را ببیند، ولی نمی‌تواند آن را ویرایش کند.',

      // Buttons / errors
      wizardBack: 'قبلی',
      wizardNext: 'بعدی',
      wizardCreate: 'ساخت لیست آرزو',
      wizardCreating: 'در حال ساخت لیست آرزو…',
      wizardErrorNameRequired:
        'لطفاً یک نام وارد کن تا بعداً بتوانی این لیست آرزو را راحت بشناسی.',
      wizardErrorGeneric:
        'در ساخت لیست آرزو خطایی رخ داد. لطفاً دوباره تلاش کن.',

      // Item wizard (add first item)
      itemWizardTitleStep1: 'قدم ۱ از ۳ - می‌خوای چه چیزی اضافه کنی؟',
      itemWizardTitleStep2: 'قدم ۲ از ۳ - لینک را اضافه کن (اختیاری)',
      itemWizardTitleStep3: 'قدم ۳ از ۳ - یک توضیح کوتاه بنویس (اختیاری)',
      itemWizardIntro:
        'کمکت می‌کنیم اولین آیتم را به این لیست آرزو اضافه کنی. بعداً هم می‌تونی هرچقدر خواستی آیتم‌های بیشتری اضافه کنی.',
      itemWizardFieldNameLabel: 'نام آیتم',
      itemWizardFieldNamePlaceholder:
        'مثلاً: هدفون نویزکنسلینگ، دوره جاوااسکریپت',
      itemWizardFieldNameHelp:
        'این همون چیز اصلیه که می‌خوای به این لیست آرزو اضافه کنی.',
      itemWizardFieldLinkLabel: 'لینک (اختیاری)',
      itemWizardFieldLinkPlaceholder: 'اینجا لینک محصول یا هر آدرس دیگری را وارد کن',
      itemWizardFieldLinkHelp:
        'با اضافه کردن لینک، خودت یا بقیه راحت‌تر می‌تونید بعداً دقیقاً همین آیتم رو پیدا کنید. اگر دوست نداشتی، می‌تونی خالی بگذاری.',
      itemWizardFieldNoteLabel: 'توضیح (اختیاری)',
      itemWizardFieldNotePlaceholder:
        'هر جزئیاتی که دوست داری بعداً یادت بمونه را اینجا بنویس',
      itemWizardFieldNoteHelp:
        'می‌تونی اندازه، رنگ یا هر چیزی که برات مهمه رو اینجا بنویسی.',
      itemWizardBack: 'قبلی',
      itemWizardNext: 'بعدی',
      itemWizardCreate: 'افزودن آیتم به لیست آرزو',
      itemWizardCreating: 'در حال افزودن آیتم…',
      itemWizardErrorNameRequired: 'لطفاً برای این آیتم یک نام وارد کن.',
      itemWizardErrorGeneric:
        'در افزودن این آیتم خطایی رخ داد. لطفاً دوباره تلاش کن.',
    },
  },
};

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });
}

export default i18n;