// @ts-check'use strict';

const fs = require('fs').promises;
const TelegramBot = require('node-telegram-bot-api');
const process = require('process');
const Creds = require('../db/creds.js');
const Cal = require('../api/google-calendar.js');

credobj = Creds.getInstance();
calapi = Cal.getInstance();

class TGBot {
  instance = null;

  constructor() {
    if (TGBot.instance) {
      console.log('TGBot instance already exists. Returning the existing instance.');
      return TGBot.instance;
    }
    console.log('Creating a new TGBot instance.');
    // Load environment variables from .env file
    require('dotenv').config();
    this.bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
    TelegramBot.instance = this;
  } 

  static getInstance() {
    if (!TGBot.instance) {
      TGBot.instance = new TGBot();
    }
    console.log('Returning TGBot instance.');
    return TGBot.instance;
  }

  async start() {
    this.bot.onText(/\/help/, (msg) => {
      msg.chat.id && this.bot.sendMessage(msg.chat.id, calapi.getHelpText());
    });

    this.bot.onText(/\/accesscalendar (.+)/, async (msg, match) => {
      if (!match[1]) {
        msg.chat.id && this.bot.sendMessage(msg.chat.id, 'Please provide a valid Gmail ID.');
        return;
      }
      // Check if the provided Gmail ID is valid
      const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!regex.test(match[1])) {
        msg.chat.id && this.bot.sendMessage(msg.chat.id, 'Please provide a valid Gmail ID.');
        return;
      }
      console.log('Valid Gmail ID:', match[1]);

      const chatId = msg.chat.id;
      const gmailId = match[1];
      try {
        const OAuth2Client = await credobj.authorize();
        console.log('Accessing calendar for...', gmailId);
        const calendar = google.calendar({ version: 'v3', OAuth2Client });
        if (chatId) {
          this.bot.sendMessage(chatId, `Access granted to calendar of ${gmailId}`);
        }
      } catch (error) {
        if (chatId) {
          this.bot.sendMessage(chatId, `Failed to access calendar: ${error.message}`);
        }
      }
    });

    this.bot.onText(/\/listevents (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const when = match[1].toLowerCase();
      console.log('Listing events for 1 ...', when);

      try {
        const auth = await credobj.authorize();
        let jsonevt = "";
        jsonevt = await calapi.listEvents(auth, when);
        this.bot.sendMessage(chatId, `\n${jsonevt}`);
      } catch (error) {
        this.bot.sendMessage(chatId, `Failed to list events: ${error.message}`);
      }
    });

    this.bot.onText(/\/addevent ([^,]+),([^,]+),?([^,]*)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const eventTitle = match[1];
      const whenStr = match[2];
      const reminder = match[3] || '30';
      console.log('Adding event:', eventTitle, whenStr, reminder);
      try {
        const auth = await credobj.authorize();
        let jsonresult = "";
        jsonresult = await calapi.addEvent(auth, eventTitle, whenStr, reminder);
        this.bot.sendMessage(chatId, `\n${jsonresult}`);
      } catch (error) {
        this.bot.sendMessage(chatId, `Failed to add event: ${error.message}`);
      }
    });

    this.bot.onText(/\/deleteevent (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const eventId = match[1];
      console.log('Deleting event:', eventId);
      try {
        const auth = await credobj.authorize();
        console.log('Deleting event...');
        let isdeleted = await calapi.deleteEvent(auth, eventId);
        if (isdeleted) {
          this.bot.sendMessage(chatId, `Event with ID ${eventId} deleted successfully.`);
        } else {
          this.bot.sendMessage(chatId, `Event with ID ${eventId} not found or could not be deleted.`);
        }
      } catch (error) {
        this.bot.sendMessage(chatId, `Failed to delete event: ${error.message}`);
      }
    });

    this.bot.on('polling_error', (error) => {
      console.log(`[polling_error] ${error.code}: ${error.message}`);
    });
  }

} //end of TGBot class

module.exports = TGBot;
