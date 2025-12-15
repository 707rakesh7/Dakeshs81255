const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

// Environment variable से token लें (Render के लिए)
// Local testing के लिए यहाँ token paste करें
const TOKEN = process.env.BOT_TOKEN || '8591086357:AAEwO-XGGTyyUKT7cV2zU-anaQsO3O2Ivss';

const bot = new TelegramBot(TOKEN, { polling: true });
const userStates = {};

console.log('✅ Bot शुरू हो गया है!');
console.log('⏰ Time:', new Date().toLocaleString());

// /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const welcomeMsg = `🎉 *HTML File Bot में स्वागत है!*

📝 *कैसे इस्तेमाल करें:*
1️⃣ /new लिखें
2️⃣ अपना HTML code भेजें
3️⃣ तुरंत HTML file मिल जाएगी!

💡 *Commands:*
/new - नया HTML file बनाएं
/help - Help देखें

बस /new लिखकर शुरू करें! 🚀`;
  
  bot.sendMessage(chatId, welcomeMsg, { parse_mode: 'Markdown' });
});

// /new command
bot.onText(/\/new/, (msg) => {
  const chatId = msg.chat.id;
  userStates[chatId] = 'waiting_for_html';
  
  const requestMsg = `📝 *HTML Code भेजें*

अपना HTML code यहाँ paste करें।
मैं तुरंत एक file बनाकर भेज दूंगा! ⚡

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

// /help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const helpMsg = `📚 *Help & Commands*

/start - Bot को शुरू करें
/new - नया HTML file बनाएं
/help - यह help message

*कैसे use करें?*
1. /new command भेजें
2. अपना HTML code paste करें
3. File तुरंत मिल जाएगी!

Bot 24/7 online है! 🌐`;
  
  bot.sendMessage(chatId, helpMsg, { parse_mode: 'Markdown' });
});

// सभी messages को handle करें
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  
  // Commands को ignore करें
  if (!text || text.startsWith('/')) return;
  
  // Check करें कि user HTML भेजने के लिए ready है
  if (userStates[chatId] === 'waiting_for_html') {
    // Processing message भेजें
    bot.sendMessage(chatId, '⏳ HTML file बना रहा हूं...');
    
    try {
      // Unique filename बनाएं
      const timestamp = Date.now();
      const fileName = `webpage_${timestamp}.html`;
      const filePath = path.join(__dirname, fileName);
      
      // HTML content को file में लिखें
      fs.writeFileSync(filePath, text, 'utf8');
      
      // File को Telegram पर भेजें
      bot.sendDocument(chatId, filePath, {
        caption: '✅ *आपकी HTML file तैयार है!*\n\n📱 इसे Telegram से खोलें या download करें।\n\n💡 Tip: /new से नई file बनाएं!',
        parse_mode: 'Markdown'
      }).then(() => {
        // File भेजने के बाद delete करें
        fs.unlinkSync(filePath);
        console.log(`✅ File भेजी गई: ${fileName} to user ${chatId}`);
      }).catch(err => {
        console.error('❌ Error sending file:', err);
        bot.sendMessage(chatId, '❌ File भेजने में problem हुई। फिर से /new से try करें।');
      });
      
      // User state reset करें
      delete userStates[chatId];
      
    } catch (error) {
      console.error('❌ Error:', error);
      bot.sendMessage(chatId, '❌ कुछ गलत हुआ। Please /new से फिर शुरू करें।');
      delete userStates[chatId];
    }
  }
});

// Error handling
bot.on('polling_error', (error) => {
  console.error('❌ Polling error:', error.code, error.message);
});

// Health check (हर 5 minute में status print करें)
setInterval(() => {
  console.log('🟢 Bot चल रहा है! Time:', new Date().toLocaleString());
}, 300000);
