// ==========================================================================
// ORVENA DIGITAL — общий скрипт сайта
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
  initNavToggle();
  initFooterYear();
  initCalculator();
  initContactMethodToggle();
  initCountrySelect();
  initWhatsAppCombine();
  initLangToggle();
  initVipPage();
  redirectVipFromHome();
});

/* ---------- Мобильное меню ---------- */
function initNavToggle() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".main-nav");
  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

/* ---------- Год в футере ---------- */
function initFooterYear() {
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
}

/* ---------- Калькулятор стоимости ----------
   Структура цен. Меняйте суммы здесь — расчёт обновится сам.
*/
const PRICES = {
  type: {
    landing: 50,
    corporate: 150,
    shop: 500,
  },
  design: {
    template: 0,
    custom: 50,
  },
  addons: {
    seo: 50,
    multilang: 100,
    crm: 10,
  },
};

function initCalculator() {
  const form = document.querySelector("[data-calculator]");
  if (!form) return;

  const amountEl = form.querySelector("[data-total-amount]");
  const breakdownEl = form.querySelector("[data-total-breakdown]");
  const summaryField = form.querySelector("[data-summary-field]");

  function recalc() {
    let total = 0;
    const lines = [];

    const typeInput = form.querySelector('input[name="site-type"]:checked');
    if (typeInput) {
      const price = PRICES.type[typeInput.value] || 0;
      total += price;
      lines.push(`${typeInput.dataset.label} — $${price}`);
    }

    const designInput = form.querySelector('input[name="design-type"]:checked');
    if (designInput) {
      const price = PRICES.design[designInput.value] || 0;
      total += price;
      if (price > 0) lines.push(`${designInput.dataset.label} — +$${price}`);
    }

    form.querySelectorAll('input[name="addon"]:checked').forEach((input) => {
      const price = PRICES.addons[input.value] || 0;
      total += price;
      lines.push(`${input.dataset.label} — +$${price}`);
    });

    if (amountEl) {
      amountEl.textContent = `$${total}`;
      amountEl.classList.remove("pulse");
      // restart animation
      void amountEl.offsetWidth;
      amountEl.classList.add("pulse");
    }
    if (breakdownEl) {
      breakdownEl.textContent = lines.length
        ? lines.join(" · ")
        : "Выберите параметры выше, чтобы увидеть смету";
    }
    if (summaryField) {
      summaryField.value = lines.length
        ? `${lines.join("; ")}. Итого: $${total}`
        : "Параметры не выбраны";
    }
  }

  form.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach((input) => {
    input.addEventListener("change", recalc);
  });

  recalc();
}

/* ---------- Способ связи: Telegram / WhatsApp ----------

   Обе формы (контакты и калькулятор) отправляются обычным способом
   прямо в Formspree (action="https://formspree.io/f/..." в самом <form>),
   без перехвата через JS. Поэтому:
   - после отправки браузер реально переходит на новую страницу thanks.html
     (это задаёт скрытое поле <input type="hidden" name="_next" ...>);
   - при возврате назад браузер сам восстанавливает значения полей —
     ничего специально для этого делать не нужно, лишь бы JS не сбрасывал
     форму сам (мы это не делаем).

   Код ниже отвечает только за переключение блоков "Telegram" / "WhatsApp"
   и за сборку готовой WhatsApp-ссылки перед отправкой.
*/
function initContactMethodToggle() {
  document.querySelectorAll('input[name="Способ связи"]').forEach((radio) => {
    radio.addEventListener("change", (e) => updateContactFields(e.target.closest("form")));
  });
  document.querySelectorAll("form").forEach((form) => updateContactFields(form));
}

function updateContactFields(form) {
  if (!form) return;
  const checked = form.querySelector('input[name="Способ связи"]:checked');
  if (!checked) return;
  const method = checked.value; // "Telegram" | "WhatsApp"

  form.querySelectorAll("[data-method-field]").forEach((group) => {
    const isActive = group.dataset.methodField === method;
    group.hidden = !isActive;
    group.querySelectorAll("input, select, button").forEach((field) => {
      field.disabled = !isActive;
      if (field.tagName !== "BUTTON") field.required = isActive;
    });
  });
}

/* Перед отправкой формы собираем "код страны + номер" в одну готовую
   WhatsApp-ссылку (wa.me/...), чтобы в письме можно было сразу кликнуть
   и открыть чат, а не вручную набирать номер. */
function initWhatsAppCombine() {
  document.querySelectorAll("form").forEach((form) => {
    form.addEventListener("submit", () => {
      const code = form.querySelector('input[name="Код страны"]');
      const phone = form.querySelector('input[name="Номер WhatsApp"]');
      const combined = form.querySelector("[data-whatsapp-combined]");
      if (code && phone && combined && !phone.disabled) {
        const digits = `${code.value}${phone.value}`.replace(/[^\d]/g, "");
        combined.value = digits ? `https://wa.me/${digits}` : "";
      }
    });
  });
}

/* ---------- Компактный выбор кода страны ----------
   Свёрнутая кнопка показывает только код (+993).
   Открытый список показывает название страны и код.
   При выборе страны меняются: код, плейсхолдер и группировка
   цифр номера (у каждой страны своя длина номера), чтобы
   номер набирался без ошибок.
*/
function initCountrySelect() {
  document.querySelectorAll("[data-country-select]").forEach((wrap) => {
    const display = wrap.querySelector("[data-country-display]");
    const toggleBtn = wrap.querySelector(".country-select-btn");
    const list = wrap.querySelector(".country-select-list");
    const hiddenInput = wrap.querySelector("[data-country-value]");
    const phoneRow = wrap.closest(".phone-row");
    const phoneInput = phoneRow ? phoneRow.querySelector("[data-phone-input]") : null;
    if (!toggleBtn || !list || !hiddenInput) return;

    const items = Array.from(list.querySelectorAll("li"));

    function closeList() {
      list.hidden = true;
      toggleBtn.setAttribute("aria-expanded", "false");
    }

    function openList() {
      if (toggleBtn.disabled) return;
      list.hidden = false;
      toggleBtn.setAttribute("aria-expanded", "true");
      const current = list.querySelector('li[aria-selected="true"]') || items[0];
      if (current) current.focus();
    }

    function applyCountry(li, opts) {
      const reformat = !opts || opts.reformat !== false;
      items.forEach((item) => item.setAttribute("aria-selected", String(item === li)));
      const code = li.dataset.code;
      const groups = li.dataset.groups;
      display.textContent = code;
      hiddenInput.value = code;
      if (phoneInput) {
        phoneInput.placeholder = li.dataset.placeholder || "";
        phoneInput.dataset.groups = groups;
        if (reformat) {
          phoneInput.value = formatPhoneDigits(phoneInput.value, groups);
        }
      }
    }

    toggleBtn.addEventListener("click", () => {
      if (list.hidden) {
        openList();
      } else {
        closeList();
      }
    });

    list.addEventListener("click", (e) => {
      const li = e.target.closest("li");
      if (!li) return;
      applyCountry(li);
      closeList();
      toggleBtn.focus();
    });

    list.addEventListener("keydown", (e) => {
      const idx = items.indexOf(document.activeElement);
      if (e.key === "Escape") {
        closeList();
        toggleBtn.focus();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        (items[idx + 1] || items[0]).focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        (items[idx - 1] || items[items.length - 1]).focus();
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        applyCountry(document.activeElement);
        closeList();
        toggleBtn.focus();
      }
    });

    document.addEventListener("click", (e) => {
      if (!wrap.contains(e.target)) closeList();
    });

    // Стартовое состояние — то, что отмечено как выбранное в HTML
    const selected = list.querySelector('li[aria-selected="true"]') || items[0];
    if (selected) applyCountry(selected, { reformat: false });

    if (phoneInput) {
      phoneInput.addEventListener("input", () => {
        const groups = phoneInput.dataset.groups;
        const caretFromEnd = phoneInput.value.length - phoneInput.selectionStart;
        phoneInput.value = formatPhoneDigits(phoneInput.value, groups);
        const pos = Math.max(0, phoneInput.value.length - caretFromEnd);
        phoneInput.setSelectionRange(pos, pos);
      });
    }
  });
}

/* Преобразует введённые цифры в номер, разбитый на группы
   нужной длины для конкретной страны, например для "2,2,2,2"
   и ввода "61647766" вернёт "61 64 77 66". */
function formatPhoneDigits(raw, groupsStr) {
  const groups = String(groupsStr || "")
    .split(",")
    .map(Number)
    .filter((n) => n > 0);
  if (!groups.length) return raw;

  const total = groups.reduce((sum, n) => sum + n, 0);
  const digits = raw.replace(/\D/g, "").slice(0, total);

  const parts = [];
  let i = 0;
  groups.forEach((len) => {
    if (i >= digits.length) return;
    parts.push(digits.slice(i, i + len));
    i += len;
  });
  return parts.join(" ");
}

/* ---------- Двуязычный сайт (RU / EN) ----------
   Выбранный язык запоминается в localStorage и применяется
   при следующем визите на любой странице сайта.
   Текст помечается атрибутом data-i18n="ключ" — движок ищет
   такой ключ в словаре TRANSLATIONS[lang] и подставляет его.
*/
const LANG_STORAGE_KEY = "orvena-lang";

const TRANSLATIONS = {
  ru: {
    skip_link: "Перейти к содержимому",
    nav_home: "Главная",
    nav_services: "Услуги",
    nav_portfolio: "Портфолио",
    nav_calculator: "Калькулятор",
    nav_contacts: "Контакты",
    nav_cta: "Рассчитать стоимость",
    nav_cta_contacts: "Связаться",
    nav_vip: "VIP",

    hero_eyebrow: "Сайты, которые продают",
    hero_h1: "Разрабатываем конвертящие сайты для бизнеса под ключ",
    hero_lede: "Создаём современные лендинги, корпоративные сайты и интернет-магазины с гарантией сроков по договору. Увеличьте продажи с первого дня запуска.",
    hero_btn_calc: "Узнать стоимость за 2 минуты",
    hero_btn_cases: "Смотреть кейсы",
    hero_img_alt: "Пример макета сайта, который разрабатывает студия ORVENA DIGITAL",

    services_eyebrow: "Услуги",
    services_h2: "Что мы умеем делать хорошо",
    service1_tag: "01 / Старт продаж",
    service1_h3: "Landing Page",
    service1_p: "Одностраничный сайт для быстрого старта продаж конкретного товара или услуги. Высокая конверсия.",
    service1_price: "от $50",
    service1_unit: "/ за проект",
    service2_tag: "02 / Имидж компании",
    service2_h3: "Корпоративный сайт",
    service2_p: "Полноценный многостраничный сайт для формирования имиджа компании и детального представления услуг.",
    service2_price: "от $150",
    service2_unit: "/ за проект",
    service3_tag: "03 / Онлайн-торговля",
    service3_h3: "Интернет-магазин",
    service3_p: "Мощный инструмент для онлайн-торговли с каталогом, корзиной, личным кабинетом и приёмом платежей.",
    service3_price: "от $500",
    service3_unit: "/ за проект",

    portfolio_eyebrow: "Портфолио",
    portfolio_h2: "Наши последние работы",
    case1_type: "Интернет-магазин",
    case1_title: "Сайт для компании MY CREATIVE STUDIO",
    case1_alt: "Сайт для компании MY CREATIVE STUDIO",
    case2_type: "Одностраничник",
    case2_title: "Для компании NEXSU STUDIO",
    case2_alt: "Сайт для компании NEXSU STUDIO",

    cta_h2: "Готовы запустить свой проект?",
    cta_p: "Пройдите короткий тест, чтобы получить точную смету и индивидуальное предложение под ваш бюджет.",
    cta_btn: "Открыть калькулятор",

    footer_tagline: "Студия разработки сайтов для малого и среднего бизнеса.",
    footer_contacts_h: "Контакты",
    footer_info_h: "Инфо",
    footer_legal: "Юридическая информация",
    footer_privacy: "Политика конфиденциальности",
    footer_rights: "Все права защищены.",

    contacts_eyebrow: "На связи",
    contacts_h1: "Связаться с нами",
    contacts_lede: "Обсудите ваш проект с экспертом или задайте любой интересующий вопрос.",
    contacts_coords_h2: "Наши координаты",
    contacts_coords_p: "Мы всегда на связи в рабочих мессенджерах и готовы ответить на ваш звонок в будние дни.",
    contacts_hours: "Пн – Сб: с 10:00 до 19:00",
    contacts_remote_p: "Работаем полностью удалённо — без привязки к офису.<br>Связаться быстрее всего через Telegram.",
    contacts_form_h2: "Напишите нам",
    contacts_form_p: "Оставьте сообщение, и мы ответим вам в течение рабочего дня.",
    field_name: "Имя",
    field_method: "Как с вами связаться?",
    field_telegram_label: "Ваш Telegram username",
    field_telegram_placeholder: "username",
    field_whatsapp_label: "Номер WhatsApp",
    field_email_label: "Ваш email",
    field_message_label: "Сообщение",
    btn_send_message: "Отправить сообщение",

    calc_eyebrow: "Смета онлайн",
    calc_h1: "Рассчитайте стоимость вашего будущего сайта",
    calc_lede: "Выберите подходящие параметры — итоговая сумма пересчитывается сразу, без отправки формы.",
    calc_step1_h3: "Какой тип сайта вам необходим?",
    calc_step2_h3: "Какое решение по дизайну требуется?",
    calc_step3_h3: "Что добавить на сайт?",
    calc_step3_hint: "(можно выбрать несколько)",
    calc_step4_h3: "Получите детальную смету",
    calc_btn_send: "Отправить заявку",
  },
  en: {
    skip_link: "Skip to content",
    nav_home: "Home",
    nav_services: "Services",
    nav_portfolio: "Portfolio",
    nav_calculator: "Calculator",
    nav_contacts: "Contacts",
    nav_cta: "Get a quote",
    nav_cta_contacts: "Contact us",
    nav_vip: "VIP",

    hero_eyebrow: "Websites that sell",
    hero_h1: "We build high-converting business websites, start to finish",
    hero_lede: "We create modern landing pages, corporate sites and online stores with deadlines guaranteed by contract. Grow your sales from day one.",
    hero_btn_calc: "Get a quote in 2 minutes",
    hero_btn_cases: "View case studies",
    hero_img_alt: "A sample website layout built by ORVENA DIGITAL studio",

    services_eyebrow: "Services",
    services_h2: "What we do well",
    service1_tag: "01 / Launch sales",
    service1_h3: "Landing Page",
    service1_p: "A single-page site to quickly launch sales of a specific product or service. High conversion.",
    service1_price: "from $50",
    service1_unit: "/ per project",
    service2_tag: "02 / Brand image",
    service2_h3: "Corporate website",
    service2_p: "A full multi-page site to build your company's image and present your services in detail.",
    service2_price: "from $150",
    service2_unit: "/ per project",
    service3_tag: "03 / Online sales",
    service3_h3: "Online store",
    service3_p: "A powerful tool for online sales with a catalog, cart, customer account and payment processing.",
    service3_price: "from $500",
    service3_unit: "/ per project",

    portfolio_eyebrow: "Portfolio",
    portfolio_h2: "Our latest work",
    case1_type: "Online store",
    case1_title: "Website for MY CREATIVE STUDIO",
    case1_alt: "Website for MY CREATIVE STUDIO",
    case2_type: "One-pager",
    case2_title: "For NEXSU STUDIO",
    case2_alt: "Website for NEXSU STUDIO",

    cta_h2: "Ready to launch your project?",
    cta_p: "Take a short quiz to get an accurate estimate and a personal offer for your budget.",
    cta_btn: "Open the calculator",

    footer_tagline: "A web development studio for small and medium businesses.",
    footer_contacts_h: "Contacts",
    footer_info_h: "Info",
    footer_legal: "Legal information",
    footer_privacy: "Privacy policy",
    footer_rights: "All rights reserved.",

    contacts_eyebrow: "Get in touch",
    contacts_h1: "Contact us",
    contacts_lede: "Discuss your project with an expert or ask any question you have.",
    contacts_coords_h2: "Our contacts",
    contacts_coords_p: "We're always available on messengers and happy to take your call on weekdays.",
    contacts_hours: "Mon – Sat: 10:00 to 19:00",
    contacts_remote_p: "We work fully remotely — no office.<br>Telegram is the fastest way to reach us.",
    contacts_form_h2: "Write to us",
    contacts_form_p: "Leave a message and we'll reply within one business day.",
    field_name: "Name",
    field_method: "How should we reach you?",
    field_telegram_label: "Your Telegram username",
    field_telegram_placeholder: "username",
    field_whatsapp_label: "WhatsApp number",
    field_email_label: "Your email",
    field_message_label: "Message",
    btn_send_message: "Send message",

    calc_eyebrow: "Online estimate",
    calc_h1: "Get a quote for your future website",
    calc_lede: "Pick the options you need — the total recalculates instantly, no need to submit the form.",
    calc_step1_h3: "What type of website do you need?",
    calc_step2_h3: "What kind of design do you need?",
    calc_step3_h3: "What should we add to the site?",
    calc_step3_hint: "(choose any number)",
    calc_step4_h3: "Get a detailed quote",
    calc_btn_send: "Send request",
  },
};

function getCurrentLang() {
  const saved = localStorage.getItem(LANG_STORAGE_KEY);
  return saved === "en" ? "en" : "ru";
}

function applyLang(lang) {
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.ru;
  document.documentElement.lang = lang;

  document.querySelectorAll("[data-lang-toggle] .lang-btn").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.lang === lang);
    btn.setAttribute("aria-pressed", String(btn.dataset.lang === lang));
  });

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    if (dict[key] != null) el.textContent = dict[key];
  });
  document.querySelectorAll("[data-i18n-alt]").forEach((el) => {
    const key = el.dataset.i18nAlt;
    if (dict[key] != null) el.setAttribute("alt", dict[key]);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.dataset.i18nPlaceholder;
    if (dict[key] != null) el.setAttribute("placeholder", dict[key]);
  });
  document.querySelectorAll("[data-i18n-html]").forEach((el) => {
    const key = el.dataset.i18nHtml;
    if (dict[key] != null) el.innerHTML = dict[key];
  });
}

function initLangToggle() {
  applyLang(getCurrentLang());

  document.querySelectorAll("[data-lang-toggle] .lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const lang = btn.dataset.lang === "en" ? "en" : "ru";
      localStorage.setItem(LANG_STORAGE_KEY, lang);
      applyLang(lang);
    });
  });
}

/* ---------- VIP-кабинет ----------
   Вход через Google (Google Identity Services) или резервный вход по email,
   без пароля. Статус заявки и выбранный тариф хранятся в localStorage —
   на статическом сайте без сервера это единственный способ "запомнить"
   клиента в этом браузере. Письмо о новой заявке всё равно уходит вам
   на почту через тот же Formspree, что и форма контактов.
*/
const VIP_USER_KEY = "orvena-vip-user";
const VIP_STATUS_KEY = "orvena-vip-status";

// ⚠️ Подставьте свой Client ID из Google Cloud Console → APIs & Services →
// Credentials → OAuth client ID (тип "Web application"). Без него кнопка
// покажет аккуратное уведомление, что вход пока не настроен, а не молча сломается.
const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";

function getVipUser() {
  try {
    return JSON.parse(localStorage.getItem(VIP_USER_KEY) || "null");
  } catch (e) {
    return null;
  }
}

function setVipUser(user) {
  localStorage.setItem(VIP_USER_KEY, JSON.stringify(user));
}

function clearVipUser() {
  localStorage.removeItem(VIP_USER_KEY);
  localStorage.removeItem(VIP_STATUS_KEY);
}

function getVipStatus() {
  try {
    return JSON.parse(localStorage.getItem(VIP_STATUS_KEY) || "null") || { status: "none" };
  } catch (e) {
    return { status: "none" };
  }
}

function setVipStatus(data) {
  localStorage.setItem(VIP_STATUS_KEY, JSON.stringify(data));
}

function decodeJwt(token) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

function initVipPage() {
  const gate = document.querySelector("[data-vip-gate]");
  const dashboard = document.querySelector("[data-vip-dashboard]");
  if (!gate || !dashboard) return; // не на vip.html — выходим

  // VIP-цены вдвое выше обычного калькулятора (см. PRICES выше) —
  // взамен проект идёт без очереди и быстрее.
  const VIP_PRICES = {
    type: { landing: 100, corporate: 300, shop: 1000 },
    design: { template: 0, custom: 100 },
    addons: { seo: 100, multilang: 200, crm: 20 },
  };

  function applyStatus(status) {
    const badge = document.querySelector("[data-vip-status]");
    const submitBtn = document.querySelector("[data-vip-submit]");
    if (!badge) return;
    badge.dataset.status = status.status;
    if (status.status === "pending") {
      badge.textContent = "Заявка принята — ожидайте звонка";
      if (submitBtn) {
        submitBtn.textContent = "Заявка отправлена ✓";
        submitBtn.disabled = true;
      }
    } else if (status.status === "done") {
      badge.textContent = "В работе";
    } else {
      badge.textContent = "Не оформлена";
      if (submitBtn) {
        submitBtn.textContent = "Оформить VIP-заявку";
        submitBtn.disabled = false;
      }
    }
  }

  function restoreSelections(status) {
    if (status.type) {
      const el = dashboard.querySelector(`input[name="vip-site-type"][value="${status.type}"]`);
      if (el) el.checked = true;
    }
    if (status.design) {
      const el = dashboard.querySelector(`input[name="vip-design"][value="${status.design}"]`);
      if (el) el.checked = true;
    }
    (status.addons || []).forEach((value) => {
      const el = dashboard.querySelector(`input[name="vip-addon"][value="${value}"]`);
      if (el) el.checked = true;
    });
  }

  function recalcTotal() {
    const typeInput = dashboard.querySelector('input[name="vip-site-type"]:checked');
    const designInput = dashboard.querySelector('input[name="vip-design"]:checked');
    const addonInputs = dashboard.querySelectorAll('input[name="vip-addon"]:checked');

    let total = 0;
    if (typeInput) total += VIP_PRICES.type[typeInput.value] || 0;
    if (designInput) total += VIP_PRICES.design[designInput.value] || 0;
    addonInputs.forEach((el) => {
      total += VIP_PRICES.addons[el.value] || 0;
    });

    const amountEl = document.querySelector("[data-vip-total-amount]");
    const timeEl = document.querySelector("[data-vip-total-time]");
    const time = typeInput ? typeInput.dataset.time : "—";
    if (amountEl) amountEl.textContent = `$${total}`;
    if (timeEl) timeEl.textContent = `Срок: ${time}`;

    const snapshot = {
      total,
      type: typeInput ? typeInput.value : null,
      typeLabel: typeInput
        ? typeInput.closest(".vip-option-card").querySelector(".vip-opt-label").textContent
        : "",
      time,
      design: designInput ? designInput.value : null,
      addons: Array.from(addonInputs).map((el) => el.value),
    };

    const status = getVipStatus();
    Object.assign(status, snapshot);
    setVipStatus(status);

    return snapshot;
  }

  function renderDashboard(user) {
    const nameEl = document.querySelector("[data-vip-name]");
    const emailEl = document.querySelector("[data-vip-email]");
    const avatarEl = document.querySelector("[data-vip-avatar]");
    if (nameEl) nameEl.textContent = "Добро пожаловать, " + (user.name || "клиент") + "!";
    if (emailEl) emailEl.textContent = user.email || "";
    if (avatarEl) avatarEl.textContent = (user.name || user.email || "V").trim().charAt(0).toUpperCase();

    const status = getVipStatus();
    restoreSelections(status);
    recalcTotal();
    applyStatus(status);
  }

  function render() {
    const user = getVipUser();
    if (user) {
      gate.classList.add("is-hidden");
      dashboard.classList.add("is-active");
      renderDashboard(user);
    } else {
      gate.classList.remove("is-hidden");
      dashboard.classList.remove("is-active");
    }
  }

  function setGsiNote(text, isError) {
    const note = document.querySelector("[data-gsi-status]");
    if (!note) return;
    note.textContent = text;
    note.dataset.gsiStatus = isError ? "error" : "";
  }

  function googleReady() {
    return (
      GOOGLE_CLIENT_ID &&
      !GOOGLE_CLIENT_ID.startsWith("YOUR_") &&
      window.google &&
      window.google.accounts &&
      window.google.accounts.id
    );
  }

  function handleGoogleCredential(response) {
    const payload = decodeJwt(response.credential);
    if (!payload) return;
    setVipUser({ name: payload.name, email: payload.email, via: "google" });
    render();
  }

  if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.startsWith("YOUR_")) {
    setGsiNote("Google-вход появится здесь после подключения Client ID (см. инструкцию).", true);
  } else if (!window.google || !window.google.accounts || !window.google.accounts.id) {
    setGsiNote("Не удалось загрузить вход Google — проверьте соединение и обновите страницу.", true);
  } else {
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCredential,
    });
  }

  const googleBtn = document.querySelector("[data-google-btn]");
  if (googleBtn) {
    googleBtn.addEventListener("click", () => {
      if (googleReady()) {
        window.google.accounts.id.prompt();
      } else {
        setGsiNote("Google-вход появится здесь после подключения Client ID (см. инструкцию).", true);
      }
    });
  }

  const emailToggle = document.querySelector("[data-email-toggle]");
  const emailForm = document.querySelector("[data-vip-email-form]");
  if (emailToggle && emailForm) {
    emailToggle.addEventListener("click", () => emailForm.classList.toggle("is-open"));
    emailForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = emailForm.querySelector('input[name="email"]').value.trim();
      if (!email) return;
      setVipUser({ name: email.split("@")[0], email, via: "email" });
      render();
    });
  }

  dashboard.querySelectorAll('input[name="vip-site-type"], input[name="vip-design"], input[name="vip-addon"]').forEach((el) => {
    el.addEventListener("change", recalcTotal);
  });

  const submitBtn = document.querySelector("[data-vip-submit]");
  if (submitBtn) {
    submitBtn.addEventListener("click", () => {
      const user = getVipUser();
      const snapshot = recalcTotal();
      const status = getVipStatus();
      status.status = "pending";
      status.submittedAt = new Date().toISOString();
      setVipStatus(status);
      applyStatus(status);

      const data = new FormData();
      data.append("Источник", "VIP-кабинет");
      data.append("Имя", (user && user.name) || "");
      data.append("Email", (user && user.email) || "");
      data.append("Тип сайта", snapshot.typeLabel);
      data.append("Дизайн", snapshot.design === "custom" ? "Индивидуальный" : "Готовый шаблон");
      data.append("Дополнительно", snapshot.addons.join(", ") || "—");
      data.append("Итого", `$${snapshot.total}`);
      data.append("Срок", snapshot.time);
      fetch("https://formspree.io/f/mojojoqe", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: data,
      }).catch(() => {});
    });
  }

  const signoutBtn = document.querySelector("[data-vip-signout]");
  if (signoutBtn) {
    signoutBtn.addEventListener("click", () => {
      clearVipUser();
      window.location.href = "index.html";
    });
  }

  render();
}

/* Уже вошедшего VIP-клиента не задерживаем на общей главной —
   ведём прямо в его кабинет. */
function redirectVipFromHome() {
  if (!document.body.classList.contains("home-page")) return;
  if (getVipUser()) window.location.href = "vip.html";
}
