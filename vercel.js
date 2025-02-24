import express from 'express';
import { launch } from 'puppeteer';

let screenshotCounter = 0;

async function captureScreenshot(page, description) {
  // Увеличиваем счетчик на каждом шаге
  screenshotCounter++;

  // Генерируем имя файла с текущей меткой времени и шагом
  const filename = `screenshot_step_${screenshotCounter}_${description}.png`;

  // Логируем информацию о скриншоте с порядковым номером
  console.log(`0${screenshotCounter}. Сохраняем скриншот: ${filename}`);

  // Делаем скриншот
  await page.screenshot({ path: filename, fullPage: true });
}

async function loginAndCapture() {
  try {
    console.log('01. Инициализация браузера...');

    const browser = await launch({ headless: false });
    const page = await browser.newPage();

    await page.setViewport({ width: 1280, height: 1024 });

    // Открытие страницы
    console.log('02. Открываем страницу Strava...');
    await page.goto('https://www.strava.com/login', { waitUntil: 'networkidle2' });

    // Сохранение первого скриншота
    await captureScreenshot(page, 'page_loaded');

    // Ожидание появления поля для ввода email
    console.log('03. Ожидаем появления поля для ввода email...');
    await page.waitForSelector('input#desktop-email', { visible: true, timeout: 10000 });

    // Сохранение второго скриншота
    await captureScreenshot(page, 'email_field_visible');

    // Вводим email
    console.log('04. Вводим email...');
    await page.type('input#desktop-email', 'your_email@example.com');

    // Сохранение третьего скриншота
    await captureScreenshot(page, 'email_entered');

    // Ожидание появления кнопки Вход
    console.log('05. Ожидаем появления кнопки Вход...');
    await page.waitForSelector('button[type="submit"]:not([disabled])', { visible: true, timeout: 10000 });

    // Проверка кнопки и клик
    const buttonEnabled = await page.evaluate(() => {
      const button = document.querySelector('button[type="submit"]');
      return button && !button.disabled;
    });

    if (buttonEnabled) {
      console.log('06. Кнопка Вход активна! Нажимаем на нее...');
      await page.click('button[type="submit"]');
    }

    // Сохранение четвертого скриншота
    await captureScreenshot(page, 'login_button_clicked');

    // Ожидание загрузки страницы после логина
    console.log('07. Ожидаем загрузки страницы после логина...');
    await page.waitForNavigation();

    // Сохранение пятого скриншота
    await captureScreenshot(page, 'post_login_page_loaded');

    // Закрытие браузера
    console.log('08. Закрытие браузера...');
    await browser.close();

    // Возвращаем данные CloudFront
    return {
      'CloudFront-Policy': 'your_cloudfront_policy_here',
      'CloudFront-Signature': 'your_cloudfront_signature_here'
    };
  } catch (error) {
    console.error('09. Ошибка при выполнении: ', error);
    throw error; // Пробрасываем ошибку дальше
  }
}

// Создаем Express сервер
const app = express();
const port = 3000;

// Создаем эндпоинт для получения CloudFront-Policy и CloudFront-Signature
app.get('/get-cloudfront-signature', async (req, res) => {
  try {
    console.log('01. Запуск логина и получения данных CloudFront...');

    // Выполняем логин и получаем данные
    const cloudFrontData = await loginAndCapture();

    // Отправляем данные в ответ
    res.json(cloudFrontData);
  } catch (error) {
    console.error('Ошибка при обработке запроса:', error);

    // Отправляем ошибку в ответе
    res.status(500).json({
      error: {
        message: error.message || 'Произошла ошибка при выполнении операции.',
        stack: error.stack || 'Нет информации о стеке.'
      }
    });
  }
});

// Запускаем сервер
app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});
