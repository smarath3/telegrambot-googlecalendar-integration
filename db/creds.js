// @ts-check'use strict';

const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const { authenticate } = require('@google-cloud/local-auth');
const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');


// local path to token.json
// and credentials.json
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');


class Creds {
    instance = null;
  
    constructor() {
      if (Creds.instance) {
        console.log('TGBot instance already exists. Returning the existing instance.');
        return Creds.instance;
      }
      console.log('Creating a Creds instance.');
      // this is where you create new database connection or any other setup
    } 
  
    static getInstance() {
      if (!Creds.instance) {
        Creds.instance = new Creds();
      }
      console.log('Returning TGBot instance.');
      return Creds.instance;
    }
  
  /**
   * Reads previously authorized credentials from the save file.
   *
   * @return {Promise<OAuth2Client|null>}
   */
  async  loadSavedCredentialsIfExist() {
    try {
      console.log('Reading token file...');
      const content = await fs.readFile(TOKEN_PATH);
      const credentials = JSON.parse(content);
      console.log('Token file found');
      return google.auth.fromJSON(credentials);
    } catch (err) {
      console.log('Token file not found');
      return null;
    }
  }


  /**
   * Serializes credentials to a file compatible with GoogleAuth.fromJSON.
   *
   * @param {OAuth2Client} client
   * @return {Promise<void>}
   */
  async saveCredentials(client) {
    const content = await fs.readFile(CREDENTIALS_PATH);
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;
    const payload = JSON.stringify({
      type: 'authorized_user',
      client_id: key.client_id,
      client_secret: key.client_secret,
      refresh_token: client.credentials.refresh_token,
    });
    await fs.writeFile(TOKEN_PATH, payload);
  }

  async authorize() {
    let client = await this.loadSavedCredentialsIfExist();
    if (client) {
        console.log('Credentials found'); 
      return client;
    }

    client = await authenticate({
      scopes: SCOPES,
      keyfilePath: CREDENTIALS_PATH,
    });
    if (client.credentials) {
      await this.saveCredentials(client);
    }
  }

  async storeCalendarAccess(chatId, gmailId, calendar) {
    // Implement the logic to store calendar access information
    // This could involve storing the information in a database
  }
  
}

module.exports = Creds;