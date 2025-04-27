'use strict';

const TGBot = require('./bots/tgbot.js');


// Instantiate and start the bot
console.log('Starting Telegram Bot...\n');
TGBot.getInstance().start();
