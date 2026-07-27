# امکانات پروژه ژینو (راهنمای هوش مصنوعی و طراح)

> این فایل منبع حقیقت برای بازطراحی صفحات با **امکانات فعلی** سایت است.
> هنگام ساخت یا چیدمان صفحه، فقط از ویجت‌ها و props تعریف‌شده اینجا استفاده کنید — ویجت جدید اختراع نکنید مگر اینکه در کد اضافه شده باشد.
>
> منابع کد:
> - نوع ویجت‌ها: `src/types.ts` → `ServiceBlockType`
> - پیش‌فرض و لیبل‌ها: `src/lib/landingToBlocks.ts` → `createEmptyBlock`, `BLOCK_LABELS`, `NESTABLE_WIDGET_TYPES`
> - پالت هر نوع صفحه: `src/components/page-builder/PageBuilderEditor.tsx`

---

## ۱. خلاصه پروژه

کلینیک روانشناسی ژینو — اپ **React + Express + MySQL** (بدون Firebase).

| حوزه | توضیح |
|------|--------|
| صفحات سایت | صفحه‌ساز بلوکی (`PageBuilderDoc`) برای home / about / contact / blog و صفحات سفارشی `/p/:slug` |
| صفحات خدمت | همان صفحه‌ساز برای هر `ServiceItem` |
| مقالات | همان صفحه‌ساز + فیلدهای SEO (در صورت فعال بودن ماژول) |
| هدر/فوتر/منو | `SiteChromeSettings` در تنظیمات کلینیک |
| پرسنل | دکتر/درمانگر → ویجت‌های `doctors` و `staffCarousel` |
| نوبت‌دهی | ماژول `appointments` (پیش‌فرض روشن) |
| رسانه | کتابخانه آپلود تصویر/ویدئو (`MediaPicker`) |
| SEO | ماژول `seoOptimizer` (پیش‌فرض خاموش) + `SEOHead` |
| ترجمه | ماژول `autoTranslate` (Google Website Translator) |
| نقش‌ها | `admin` / `doctor` / `operator` / `patient` |
| ادمین | overview، appointments، personnel، users، pages، articles، faqs، contact، modules، system، tools-io، settings |

### شکل سند صفحه‌ساز (همه انواع صفحه)

```ts
{
  version: 1,
  blocks: Array<{
    id: string;           // یکتا، مثلاً hero-xxxx
    type: ServiceBlockType;
    props: Record<string, unknown>;
  }>
}
```

هر بلوک می‌تواند انیمیشن اسکرول داشته باشد:

| prop | مقادیر |
|------|--------|
| `animateEnabled` | `true` / `false` |
| `animateType` | `fade-in` \| `fade-up` \| `fade-down` |

---

## ۲. قوانین طراحی با صفحه‌ساز (برای AI)

1. **فقط typeهای موجود** در جدول زیر — نام‌ها دقیقاً camelCase انگلیسی.
2. **پالت صفحه را رعایت کنید** (سایت ≠ خدمت ≠ مقاله).
3. **کانتینر تو در تو نیست**: فقط یک سطح — `container` → ستون‌ها → ویجت‌های nestable. خود `container` داخل ستون نمی‌رود.
4. برای چیدمان چندستونه از `container` استفاده کنید؛ برای فاصله عمودی `spacer`؛ برای جداکننده `divider`.
5. دیتای زنده کلینیک را دوباره hardcode نکنید اگر ویجت دیتامحور هست:
   - پزشکان → `doctors` / `staffCarousel`
   - خدمات → `servicesGrid` / `otherServices`
   - مقالات → `articlesGrid`
   - FAQ از دیتابیس → `latestFaqs`
   - تماس از تنظیمات → `contactInfo`
6. آیکون‌ها: نام‌های **Material Symbols** (مثل `psychology`, `calendar_month`).
7. عرض صفحه سایت: `layoutWidth`: `contained` \| `full`.
8. ریسپانسیو: breakpointها `mobile < 768`، `tablet < 1024`، بعد `desktop`. خیلی از گریدها `columnsMobile/Tablet/Desktop` دارند.
9. برای شروع از props، از `createEmptyBlock(type)` در کد الگو بگیرید و فقط فیلدهای لازم را عوض کنید.

---

## ۳. پالت ویجت‌ها بر اساس نوع صفحه

| ویجت | صفحه سایت (S) | خدمت (V) | مقاله (A) | قابل قرارگیری داخل ستون |
|------|:---:|:---:|:---:|:---:|
| `container` | ✓ | ✓ | ✓ | والد (نه تودرتو) |
| `divider` | ✓ | ✓ | ✓ | ✓ |
| `spacer` | ✓ | ✓ | ✓ | ✓ |
| `heroHeader` | ✓ | ✓ | ✓ | ✗ |
| `pageHero` | ✓ | ✗ | ✓ | ✗ |
| `hero` | ✓ | ✓ | ✗ | ✗ |
| `imageCarousel` | ✓ | ✓ | ✓ | ✓ |
| `singleImage` | ✓ | ✓ | ✓ | ✓ |
| `imageGallery` | ✓ | ✓ | ✓ | ✓ |
| `verticalImageGallery` | ✓ | ✓ | ✓ | ✓ |
| `videoPlayer` | ✓ | ✓ | ✓ | ✓ |
| `icon` | ✓ | ✓ | ✓ | ✓ |
| `googleMap` | ✓ | ✓ | ✓ | ✓ |
| `tabGallery` | ✓ | ✓ | ✓ | ✗ |
| `richText` | ✓ | ✓ | ✓ | ✓ |
| `htmlCode` | ✓ | ✓ | ✓ | ✓ |
| `highlights` | ✓ | ✓ | ✓ | ✓ |
| `features` | ✓ | ✓ | ✓ | ✓ |
| `iconList` | ✓ | ✓ | ✓ | ✓ |
| `button` | ✓ | ✓ | ✓ | ✓ |
| `process` | ✗ | ✓ | ✓ | ✗ |
| `symptoms` | ✗ | ✓ | ✗ | ✗ |
| `cta` | ✓ | ✓ | ✓ | ✓ |
| `doctors` | ✓ | ✓ | ✓ | ✗ |
| `staffCarousel` | ✓ | ✓ | ✓ | ✗ |
| `servicesGrid` | ✓ | ✗ | ✗ | ✗ |
| `otherServices` | ✓ | ✓ | ✗ | ✗ |
| `articlesGrid` | ✓ | ✗ | ✗ | ✗ |
| `testimonials` | ✓ | ✓ | ✗ | ✗ |
| `faqs` | ✓ | ✓ | ✓ | ✗ |
| `latestFaqs` | ✓ | ✓ | ✓ | ✗ |
| `contactInfo` | ✓ | ✓ | ✓ | ✓ |
| `contactCards` | ✓ | ✗ | ✗ | ✓ |
| `contactForm` | ✓ | ✗ | ✗ | ✗ |

**اختصاصی‌ها:**
- فقط خدمت: `symptoms`
- فقط سایت: `servicesGrid`, `articlesGrid`, `contactCards`, `contactForm`
- سایت + مقاله (نه خدمت): `pageHero`
- خدمت + مقاله (نه سایت): `process`
- سایت + خدمت (نه مقاله): `hero`, `otherServices`, `testimonials`

---

## ۴. کاتالوگ ویجت‌ها

گروه‌ها در UI: **چیدمان** / **رسانه** / **محتوا** / **کلینیک**.

### ۴.۱ چیدمان

#### `container` — کانتینر / ستون‌ها
چیدمان چندستونه. ستون‌ها آرایه `columns[]` با بلوک‌های nestable.

Props مهم:
- `columnCount`, `columnsMobile`, `columnsTablet`, `columnsDesktop`
- `gap`: مثلاً `md`
- `columnsDirection`: `row` \| …
- `padding`, `paddingX`, `paddingY`, `marginTop`, `marginBottom`
- `borderRadius`, `shadow`, `background`, `backgroundColor`, `backgroundImage`, `backgroundOverlay`
- `widthMode`: `contained` \| …، `maxWidth`
- هر ستون: `id`, `blocks[]`, `widthMode`, `widthValue`, padding/margin، `alignH`, `alignV`, `backgroundColor`, `borderRadius`
- تب ریسپانسیو: overrideهای باند دستگاه (مثل `paddingMobile`)

#### `divider` — خط جداکننده
`widthMode`, `widthPercent`/`widthPx`, `thickness`, `lineStyle`, `color`/`customColor`, `align`, `orientation`, `spacing`, `contentMode` (`none`/`text`/`icon`)، `text`, `icon`, `fadeEnds`, `endCap`, …

#### `spacer` — فاصله عمودی
`linked`, `size`/`height`, `sizeTop`/`sizeBottom`, `responsive`, `heightMobile`/`heightTablet`/`heightDesktop`, `showGuide`

#### `heroHeader` — هدر هیرو غنی (لندینگ)
متن + کروسل تصویر + دپارتمان‌ها + آمار + CTA.

Props کلیدی:
- `badge`, `statusText`, `showStatus`, `title`, `titleHighlight`, `subtitle`
- `contentAlign`, `mediaSide`, `titleSize`, `accentColor`, `sectionPadding`, `mediaRadius`
- عرض: `widthMode`, `widthModeMobile`, `widthModeTablet`, `widthPercent`, `widthPx`, `widthAlign`
- پس‌زمینه: `background`, `backgroundColor`, `backgroundImage`, `backgroundOverlay`, `borderRadius`, `paddingX`, `marginTop`/`Bottom`/`X`
- CTA: `showCta`, `ctaLabel`, `ctaIcon`, `ctaAction` (`guide` \| `booking` \| لینک)، `ctaLink`, `ctaVariant`
- `showDepartments`, `departmentsTitle`, `departments[{icon,label}]`
- کروسل: `showCarousel`, `carouselAutoplay`, `carouselIntervalMs`, `showCarouselDots`/`Arrows`, `slides[{image,badge,title,description,rating,floatingBadge,floatingIcon}]`
- آمار: `showStats`, `stats[{icon,value,label}]`, `showRatingBadge`, `showFloatingBadge`

#### `pageHero` — هیرو ساده‌تر صفحه (سایت/مقاله)
`badge`, `title`, `subtitle`, `showBooking`, `primaryCtaLabel`, `secondaryCtaLabel`, `secondaryCtaScreen`, `imageMode`, `heroImage`, `imageAlt`, `overlayOpacity`

#### `hero` — بنر خدمت
`title`, `subtitle`, `badge`, `heroImage`, `duration`, `format`, `satisfactionRate`, `sessionFeeNote`

---

### ۴.۲ رسانه

| type | نقش | props مهم |
|------|-----|-----------|
| `imageCarousel` | اسلایدر تصویر | `autoplay`, `intervalMs`, `showDots`/`showArrows`, `aspect`, `slides[{image,caption}]` |
| `singleImage` | یک تصویر | `image`, `alt`, `caption`, `subtitle`, عرض، `aspect`, `objectFit`, `borderRadius`, `align`, `shadow`, `captionPosition`, `clickBehavior` (`lightbox`/لینک)، `linkUrl`, `openInNewTab` |
| `imageGallery` | گرید عکس | `title`/`subtitle`, ستون‌ها، `gap`, `aspect`, `objectFit`, `borderRadius`, `captionPosition`, `clickBehavior`, `items[]` |
| `verticalImageGallery` | گالری ستونی/ماسونری | ستون‌ها، `gap`, `borderRadius`, `shadow`, `columnAnimate`, `animateStaggerMs`, `clickBehavior`, `items[]` |
| `videoPlayer` | ویدئو | `title`, `sourceType` (`upload`/URL)، `videoUrl`, `posterImage`, `autoplay`, `muted`, `controls`, `aspect` |
| `icon` | یک آیکون | `icon`, `label`, `size`, `color`, `align`, `filled`, `linkTarget` |
| `googleMap` | نقشه | `mode` (`coords`/`address`)، `lat`/`lng`, `address`, `zoom`, `height`, `borderRadius`, `showMarker` |
| `tabGallery` | تب + تصویر بزرگ | `badge`, `title`, `subtitle`, `tabHint`, `items[{id,title,description,thumbnail,image}]` |

---

### ۴.۳ محتوا

| type | نقش | props مهم |
|------|-----|-----------|
| `richText` | متن HTML ویرایشگر | `html` |
| `htmlCode` | HTML خام | `html`, `padded`, `maxWidth` |
| `highlights` | کارت‌های آمار/هایلایت | `items[{icon,label,value}]`, ستون‌ها |
| `features` | ویژگی‌ها | `title`, `items[{icon,title,desc}]` |
| `iconList` | لیست تیک‌دار | `iconSize`, `color`, `filled`, `gap`, `items[{icon,text,link}]` |
| `button` | دکمه CTA | `label`, `icon`, `showIcon`, `iconPosition`, `color`, `variant`, `size`, `align`, `fullWidth`, `action` (`booking`/لینک…)، `link` |
| `process` | مراحل شماره‌دار | `title`, `eyebrow`, `steps[{number,title,desc}]` |
| `symptoms` | مخاطب/نشانه‌ها (خدمت) | `title`, `subtitle`, `items[{icon,title,desc}]` |
| `cta` | نوار فراخوان | `badge`, `title`, `subtitle`, `phoneLabel`, `phoneHref` |

---

### ۴.۴ کلینیک / دیتامحور

| type | نقش | props مهم |
|------|-----|-----------|
| `doctors` | کارت پزشکان از DB | `title`, `subtitle`, `specialtiesFilter[]`, `maxCount`, ستون‌ها |
| `staffCarousel` | کروسل پرسنل | badge/title/subtitle، `viewAll*`, فلش/نقطه/autoplay، فیلتر تخصص، `onlyActive`, لیبل رزرو/پروفایل، ستون‌ها |
| `servicesGrid` | شبکه خدمات | `title`, `subtitle`, ستون‌ها |
| `otherServices` | چیپ سایر خدمات | `title` |
| `articlesGrid` | فهرست مقالات | فیلتر دسته/عنوان، `sortBy`, `layout`, `maxCount`, pagination/search/categories/excerpt/badge، ستون‌ها |
| `testimonials` | نظرات دستی | `title`, `subtitle`, `items[{name,role,comment,rating}]` |
| `faqs` | FAQ دستی آکاردئون | `title`, `subtitle`, `items[{question,answer}]` |
| `latestFaqs` | FAQ زنده از DB | `badge`, `title`, `subtitle`, `maxCount`, `categoryFilter`, `showCategory`/`showLikes`/`showViewAll`, `viewAllLabel`, `accentStyle`, `openFirst` |
| `contactInfo` | تماس از تنظیمات کلینیک | `badge`, `title`, `subtitle`, `layout`, `showPhones`/`showSocials`/`showAddresses`/`showMap` |
| `contactCards` | کارت‌های قابل ویرایش تماس | `title?`, `subtitle?`, `iconFilled`, ستون‌ها، `items[{icon,title,body,note,accent,dir,link,linkLabel}]` |
| `contactForm` | فرم (انتخاب تعریف مرکزی) | `formId`, `title?`, `subtitle?` |

---

## ۵. الگوی پیشنهادی چیدمان صفحه

### صفحه اصلی (سایت)
1. `heroHeader` (یا `pageHero`)
2. `highlights` یا `features`
3. `servicesGrid` یا `staffCarousel`
4. `testimonials` / `latestFaqs`
5. `cta` یا `contactInfo`

### صفحه خدمت
1. `hero` یا `heroHeader`
2. `highlights` → `symptoms` → `process` → `features`
3. `doctors` → `testimonials` → `faqs`
4. `otherServices` → `cta`

### مقاله
1. `pageHero` یا `heroHeader`
2. `richText` + تصاویر (`singleImage` / `imageGallery`) داخل `container` در صورت نیاز
3. `process` / `features` / `faqs` / `cta` در انتها

### چیدمان دو ستونه نمونه
```json
{
  "type": "container",
  "props": {
    "columnCount": 2,
    "columnsMobile": 1,
    "columnsTablet": 2,
    "columnsDesktop": 2,
    "gap": "md",
    "columns": [
      { "id": "col-a", "blocks": [ /* nestable فقط */ ], "widthMode": "auto", "widthValue": 50 },
      { "id": "col-b", "blocks": [ /* nestable فقط */ ], "widthMode": "auto", "widthValue": 50 }
    ]
  }
}
```

---

## ۶. قابلیت‌های ادیتور (غیر از ویجت)

- پیش‌نمایش دستگاه: desktop / tablet / mobile
- درگ‌اند‌دراپ بلوک‌های سطح بالا و تودرتو
- کپی/پیست بلوک و استایل (`builderClipboard`)
- پنل متا صفحه/مقاله + تحلیل SEO (اگر ماژول روشن باشد)
- ذخیره با `version: 1` و آرایه `blocks`

---

## ۷. مسیرهای عمومی مهم

| مسیر | محتوا |
|------|--------|
| `/` | خانه |
| `/services`, `/service/:id` | فهرست و صفحه خدمت |
| `/about`, `/team`, `/contact` | درباره، تیم، تماس |
| `/blog`, `/blog/:slug` | مقالات |
| `/faq` | سوالات متداول |
| `/p/:slug` | صفحه سفارشی |
| `/login`, `/register`, `/user-panel` | احراز هویت کاربر |
| `/admin` | پنل ادمین |

---

## ۸. چک‌لیست سریع برای AI قبل از ساخت صفحه

- [ ] نوع صفحه مشخص است (سایت / خدمت / مقاله) و فقط ویجت‌های مجاز آن پالت انتخاب شده‌اند
- [ ] همه `type`ها در `ServiceBlockType` هستند
- [ ] داخل ستون فقط `NESTABLE_WIDGET_TYPES` آمده و `container` تو در تو نیست
- [ ] هر بلوک `id` یکتا دارد
- [ ] برای دیتای کلینیک از ویجت دیتامحور استفاده شده، نه کپی دستی (مگر عمداً مثل `testimonials` / `faqs` دستی)
- [ ] انیمیشن فقط با `animateEnabled` + `animateType` مجاز
- [ ] متن‌ها فارسی و RTL-friendly؛ آیکون‌ها Material Symbols

---

*آخرین به‌روزرسانی بر اساس کد فعلی پروژه. اگر ویجتی به `ServiceBlockType` یا پالت‌ها اضافه شد، این فایل را هم به‌روز کنید.*
