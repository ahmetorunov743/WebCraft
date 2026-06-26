// ==========================================================================
// WebCraft — общий скрипт сайта
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
  initNavToggle();
  initFooterYear();
  initCalculator();
  initContactMethodToggle();
  initCountrySelect();
  initWhatsAppCombine();
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
