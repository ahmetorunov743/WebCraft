// Ждем, пока вся страница полностью загрузится в браузере
document.addEventListener("DOMContentLoaded", function () {
    
    // 1. НАХОДИМ НУЖНЫЕ ЭЛЕМЕНТЫ НА СТРАНИЦЕ
    const calcForm = document.getElementById("site-calculator");
    const totalCostEl = document.getElementById("total-cost");

    // Если мы находимся не на странице калькулятора (например, на главной), 
    // то этот скрипт просто не будет выполняться дальше, чтобы не было ошибок.
    if (!calcForm || !totalCostEl) return;

    // 2. ФУНКЦИЯ РАСЧЕТА СТОИМОСТИ
    function calculatePrice() {
        let currentTotal = 0;

        // Находим выбранный тип сайта (радиокнопка)
        const selectedType = calcForm.querySelector('input[name="site-type"]:checked');
        if (selectedType) {
            // Превращаем текст "300" в число и прибавляем к сумме
            currentTotal += parseFloat(selectedType.getAttribute('data-price'));
        }

        // Находим выбранный тип дизайна (радиокнопка)
        const selectedDesign = calcForm.querySelector('input[name="design-type"]:checked');
        if (selectedDesign) {
            currentTotal += parseFloat(selectedDesign.getAttribute('data-price'));
        }

        // Находим ВСЕ выбранные чекбоксы дополнительных услуг
        const selectedAddons = calcForm.querySelectorAll('input[name="addons"]:checked');
        selectedAddons.forEach(function (addon) {
            currentTotal += parseFloat(addon.getAttribute('data-price'));
        });

        // 3. ВЫВОДИМ РЕЗУЛЬТАТ НА ЭКРАН
        // Анимация смены цифр (плавное появление)
        totalCostEl.style.opacity = 0;
        setTimeout(() => {
            totalCostEl.textContent = currentTotal;
            totalCostEl.style.opacity = 1;
        }, 150);
    }

    // 4. СЛУШАЕМ КЛИКИ ПОЛЬЗОВАТЕЛЯ
    // Каждый раз, когда пользователь меняет что-то в форме (input), запускаем расчет цены
    calcForm.addEventListener("input", calculatePrice);

    // 5. ОТПРАВКА ФОРМЫ (Имитация)
    calcForm.addEventListener("submit", function (event) {
        event.preventDefault(); // Запрещаем странице перезагружаться при отправке

        // Собираем данные из полей ввода
        const name = calcForm.querySelector('input[name="client-name"]').value;
        const phone = calcForm.querySelector('input[name="client-phone"]').value;
        const email = calcForm.querySelector('input[name="client-email"]').value;
        const finalPrice = totalCostEl.textContent;

        // Здесь в будущем будет код отправки данных на ваш Email или в Telegram-бота
        // А пока просто покажем красивое уведомление клиенту
        alert(`Спасибо, ${name}! Ваша заявка на расчет проекта ($${finalPrice}) принята. Мы свяжемся с вами по номеру ${phone} или email ${email} в ближайшее время.`);
        
        calcForm.reset(); // Очищаем форму после успешной отправки
        calculatePrice(); // Сбрасываем цену до базовой
    });

    // Запускаем расчет один раз при старте, чтобы отобразить начальную цену
    calculatePrice();
});