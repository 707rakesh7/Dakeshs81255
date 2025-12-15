const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

// ✅ TOKEN ONLY from Render Environment
const TOKEN = process.env.BOT_TOKEN;

// ❌ Token नहीं मिला तो clear error
if (!TOKEN) {
  console.error('❌ BOT_TOKEN missing! Render Environment में token add करो.');
  process.exit(1);
}

// ✅ Bot start (Polling)
const bot = new TelegramBot(TOKEN, { polling: true });

// 🔥 409 Conflict / Webhook issue FIX
bot.deleteWebHook(true);

// Safety handlers
process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);

const userStates = {};

console.log('✅ Bot शुरू हो गया है!');
console.log('⏰ Time:', new Date().toLocaleString());

/* ================= COMMANDS ================= */

// /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const welcomeMsg = `🎉 *HTML File Bot में स्वागत है!*

📝 *कैसे इस्तेमाल करें:*
1️⃣ /new लिखें
2️⃣ अपना HTML code भेजें
3️⃣ तुरंत HTML file मिल जाएगी

💡 *Commands:*
/new - नया HTML file बनाएं
/help - Help देखें

🚀 /new से शुरू करें!`;

  bot.sendMessage(chatId, welcomeMsg, { parse_mode: 'Markdown' });
});

// /new
bot.onText(/\/new/, (msg) => {
  const chatId = msg.chat.id;
  userStates[chatId] = 'waiting_for_html';

  const requestMsg = `📝 *HTML Code भेजें*

अपना पूरा HTML code paste करें।
मैं तुरंत file बना कर भेज दूँगा ⚡

*Example:*
\`\`\`html
<!DOCTYPE html>
<html>
<head>
  <title>My Page</title>
</head>
<body>
  <h1>Hello World!</h1>
</body>
</html>
\`\`\``;

  bot.sendMessage(chatId, requestMsg, { parse_mode: 'Markdown' });
});

// /help
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const helpMsg = `📚 *Help*

/start - Bot start करें
/new - HTML file बनाएं
/help - Help देखें

👉 /new भेजकर HTML paste करें`;

  bot.sendMessage(chatId, helpMsg, { parse_mode: 'Markdown' });
});

/* ================= MESSAGE HANDLER ================= */

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text || text.startsWith('/')) return;

  if (userStates[chatId] === 'waiting_for_html') {
    bot.sendMessage(chatId, '⏳ HTML file बना रहा हूँ...');

    try {
      const fileName = `webpage_${Date.now()}.html`;
      const filePath = path.join(__dirname, fileName);

      fs.writeFileSync(filePath, text, 'utf8');

      bot.sendDocument(chatId, filePath, {
        caption: '✅ *आपकी HTML file तैयार है!*\n\n/new से नई file बनाएं',
        parse_mode: 'Markdown'
      }).then(() => {
        fs.unlinkSync(filePath);
        console.log(`✅ File भेजी गई: ${fileName} to user ${chatId}`);
      });

      delete userStates[chatId];
    } catch (err) {
      console.error('❌ Error:', err);
      bot.sendMessage(chatId, '❌ Error हुआ, /new से फिर try करें');
      delete userStates[chatId];
    }
  }
});

// Polling error log
bot.on('polling_error', (error) => {
  console.error('❌ Polling error:', error.code, error.message);
});

// Health log
setInterval(() => {
  console.log('🟢 Bot चल रहा है!', new Date().toLocaleString());
}, 300000);
