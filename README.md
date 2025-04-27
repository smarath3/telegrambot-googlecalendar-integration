# telegrambot-googlecalendar-integration

**Summary**:

Simple js app to access, add and delete google calendar events, reminders via (1) telegram bot (tgbot) commands (2) web apis/curl (test_server)

**Setup**:
1. Install (npm) deps like  node-telegram-bot-api and express
2. Create .env with Telegram bot token (TELEGRAM_BOT_TOKEN) obtained when you create telegram bot and client credentials secret from google (CLIENT_CREDENTIALS_FILE)
3. Create a Google calendar account and new project to provide access to to app. Setup auth(oauth2) and finally download, copy the created credentials json (that has auth_uri, project_id, token_uri) into root directory
4. For telegram commands (typing / will show commands), run node main.js and for curl commands run node test_server.js
 
**Commands**:
1. /help - Help message that shows all commands their usage
2. /accessCalendar with your gmail id.  token.json is auto created first time /accesscalendar is involved (autodirects to browser sign-in to your account ) This has the client tokens thats used for future access of your calendar APIs.
3. /listevents - shows all your calendar events for provided time frame (today, tomorrow, week, month). Also shows eventid that can be used for deleteid
4. /addevent - adds a new calendar event, you can also optionally set reminder. 
5. /deleteevent -  deletes event with provided eventid 

**Todos**:
1. Possible bugs and no full fledged input validations.
2. Database instead of storing creds in file. DB can also be used for extending for multi account support, event related manipulations..you know it.
3. More commands like update existing events, add quick reminders, note etc. leverging full capabilities of Google APIs
 
