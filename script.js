// ==========================================================================
// WebCraft — общий скрипт сайта
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
  initNavToggle();
  initFooterYear();
  initCalculator();
  initForms();
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

/* ---------- Отправка форм (контакты / калькулятор) ----------

   Заявки уходят прямо в Telegram-бота — без открытия почты у посетителя.
   Как настроить (один раз, 5 минут):

   1. Открой Telegram, найди @BotFather, отправь команду /newbot,
      придумай имя боту — в ответ придёт TOKEN вида
      "123456789:AAExampleTokenLetters". Вставь его в TELEGRAM_BOT_TOKEN ниже.

   2. Напиши своему новому боту в Telegram что угодно (например "привет"),
      чтобы он "увидел" тебя.

   3. В браузере открой:
      https://api.telegram.org/bot<ТВОЙ_TOKEN>/getUpdates
      (вставь свой токен вместо <ТВОЙ_TOKEN>). В ответе найди число
      "chat":{"id": 123456789 — это твой CHAT_ID. Вставь его в
      TELEGRAM_CHAT_ID ниже (можно как число или как строку).

   4. Сохрани файл, обнови script.js в репозитории на GitHub — готово,
      заявки начнут падать в чат с ботом.

   ⚠️ Важно: токен бота будет виден любому, кто откроет исходный код
   страницы (это особенность статического сайта без backend). Максимум,
   что может сделать злоумышленник, зная только токен, — слать сообщения
   в этот же чат с ботом (спам). Доступа к твоему личному Telegram-аккаунту,
   другим чатам или твоим данным это не даёт. Если это всё же беспокоит —
   можно завести отдельного бота только под формы сайта и не использовать
   его для других задач.

   Если Telegram не настроен (поля ниже пустые) — форма отправляется через
   Formspree (FORMSPREE_ENDPOINT, уже подключён). Если и это не сработает —
   в самом крайнем случае откроется почтовый клиент (mailto).
*/
const TELEGRAM_BOT_TOKEN = ""; // например: "123456789:AAExampleTokenLetters"
const TELEGRAM_CHAT_ID = "";   // например: "123456789"

// Formspree — заявки прилетают на почту, привязанную к этой форме на formspree.io
const FORMSPREE_ENDPOINT = "https://formspree.io/f/mojojoqe";

function initForms() {
  document.querySelectorAll("form[data-mailto]").forEach((form) => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const status = form.querySelector("[data-form-status]");
      const submitBtn = form.querySelector('button[type="submit"]');
      const data = new FormData(form);

      const requiredOk = Array.from(form.querySelectorAll("[required]")).every(
        (field) => field.value.trim() !== ""
      );
      if (!requiredOk) {
        if (status) {
          status.textContent = "Заполните, пожалуйста, обязательные поля.";
          status.className = "form-status err";
        }
        return;
      }

      const bodyLines = [];
      data.forEach((value, key) => {
        if (value) bodyLines.push(`${key}: ${value}`);
      });
      const title = form.dataset.subject || "Заявка с сайта WebCraft";
      const messageText = `📩 ${title}\n\n${bodyLines.join("\n")}`;

      if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
        if (submitBtn) submitBtn.disabled = true;
        try {
          const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: messageText }),
          });
          if (!res.ok) throw new Error("Telegram API error");

          form.reset();
          if (status) {
            status.textContent = "Заявка отправлена! Мы свяжемся с вами в ближайшее время.";
            status.className = "form-status ok";
          }
          return;
        } catch (err) {
          console.error("Не удалось отправить в Telegram, пробуем Formspree:", err);
        } finally {
          if (submitBtn) submitBtn.disabled = false;
        }
      }

      if (FORMSPREE_ENDPOINT) {
        if (submitBtn) submitBtn.disabled = true;
        try {
          const res = await fetch(FORMSPREE_ENDPOINT, {
            method: "POST",
            headers: { Accept: "application/json" },
            body: data,
          });
          if (!res.ok) throw new Error("Formspree error");

          form.reset();
          if (status) {
            status.textContent = "Заявка отправлена! Мы свяжемся с вами в ближайшее время.";
            status.className = "form-status ok";
          }
          return;
        } catch (err) {
          console.error("Не удалось отправить через Formspree, используем mailto:", err);
        } finally {
          if (submitBtn) submitBtn.disabled = false;
        }
      }

      // Запасной вариант: mailto (если ничего из вышеперечисленного не настроено/не сработало)
      const to = form.dataset.mailto;
      const subject = encodeURIComponent(title);
      const body = encodeURIComponent(bodyLines.join("\n"));
      window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;

      if (status) {
        status.textContent = "Откроется ваш почтовый клиент с готовым письмом — просто нажмите «Отправить».";
        status.className = "form-status ok";
      }
    });
  });
}
