const e = require('express');
const { google } = require('googleapis');
const moment = require('moment-timezone');
moment.tz.setDefault('America/Los_Angeles');

const dtformatstring = "YYYY-MM-DD HH:mm"

class GCalendar {
    instance = null;
  
    constructor() {
      if (GCalendar.instance) {
        console.log('GCalendar instance already exists. Returning the existing instance.');
        return GCalendar.instance;
      }
    } 
  
    static getInstance() {
      if (!GCalendar.instance) {
        GCalendar.instance = new GCalendar();
      }
      console.log('Returning GCalendar instance.');
      return GCalendar.instance;
    }

    getHelpText() {
        return `Access your calendar by sending a message to the bot by following these rules:
        /accesscalendar <gmail-id> - Access the calendar for the given gmail id (one time only unless you would like to switch to different calendar)
        /addevent <event-title>,<when>,<reminder>[optional]
        /listevents today|tomorrow|week|month (Note: This will list all events for the given time period. event-id is printed in brackets)
        /deleteevent <event-id> (Note: This will delete event with provided event-id, if invalid, this will be a no-op)
        /help - Show this message`;
    }    
    
    async listEvents(auth, when) {
        const calendar = google.calendar({version: 'v3', auth});        
        // Calculate time range based on user input
        const timeMin = new Date();
        let timeMax = new Date();
        
        switch (when) {
        case 'today':
            console.log('today');
            timeMax.setHours(23, 59, 59, 999);
            break;
        case 'tomorrow':
            console.log('tomorrow');
            timeMin.setDate(timeMin.getDate() + 1);
            timeMin.setHours(0, 0, 0, 0);
            timeMax.setDate(timeMax.getDate() + 1);
            timeMax.setHours(23, 59, 59, 999);
            break;
        case 'week':
            console.log('week');
            timeMax.setDate(timeMax.getDate() + 7);
            break;
        case 'month':
            console.log('month');
            timeMax.setMonth(timeMax.getMonth() + 1);
            break;
        default:
            return 'Invalid time range. Please use: today, tomorrow, week, or month';
        }

        const res = await calendar.events.list({
        calendarId: 'primary',
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        });

        const events = res.data.items;
        if (!events || events.length === 0) {
        return `No events found for ${when}`;
        }

        let resultString = `Events for ${when}:\n`;
        events.forEach((event, i) => {
        const start = event.start.dateTime || event.start.date;
        const formattedDate = moment(start).format('MMMM Do YYYY, h:mm a');
        resultString += `${i + 1}. ${formattedDate} - ${event.summary} (ID: ${event.id})\n`;
        });
        return resultString;
    }
    
    async addEvent(auth, title, whenStr, reminder) {
        const calendar = google.calendar({version: 'v3', auth});
        try {
        let startDateTime = moment(whenStr, [dtformatstring], true);
        
        if (!startDateTime.isValid()) {
            return 'Invalid date format. Check for space or please use "YYYY-MM-DD HH:mm" or "tomorrow HH:mm"';
        }

        // Convert startDateTime string to moment object and add 1 hour
        const endDateTime = moment(startDateTime, dtformatstring).add(1, 'hour');

        //TODO - Hardcoded tz. Change the time zone to be set from an input param
        const event = {
            summary: title,
            start: {
              dateTime: startDateTime.toISOString(),
              timeZone: 'America/Los_Angeles',
            },
            end: {
              dateTime: endDateTime.toISOString(),
              timeZone: 'America/Los_Angeles',
            },
            reminders: {
              useDefault: false,
              overrides: [
                { method: 'popup', minutes: parseInt(reminder) },
              ],
            },
          };

        const response = await calendar.events.insert({
            calendarId: 'primary',
            resource: event,
        });
        console.log('Event created:', response.data);

         return `Event created successfully!\n${title}\nWhen: ${startDateTime.format('MMMM Do YYYY, h:mm a')}\nReminder: ${reminder} minutes before`;
        } catch (error) {
        return `Failed to create event: ${error.message}`;
        }
    }

    async deleteEvent(auth, eventId) {
        const calendar = google.calendar({version: 'v3', auth});        
        try {
            // Delete the event by its ID
            await calendar.events.delete({
                calendarId: 'primary',
                eventId: eventId,
            });
            console.log(`Event with ID ${eventId} deleted successfully.`);
            return true;
        } catch (error) {
            console.error(`Failed to delete event: ${error.message}`);
            return false;
        }
    }
}

module.exports = GCalendar;
