const express = require('express');
const app = express();
const Creds = require('./db/creds.js');
const Cal = require('./api/google-calendar.js');

app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

credobj = Creds.getInstance();
calapi = Cal.getInstance();

// example: curl "http://127.0.0.1:3000/getHelpText"
app.get('/getHelpText', (req, res) => {
    console.log('Received request for help text');
    try {
        const helpText = JSON.stringify(calapi.getHelpText());
        console.log('Help text:', helpText);
        res.status(200).json({ help_text: helpText });
    } catch (error) {
        console.error('Error getting help text:', error);
        res.status(500).json({ error: 'Error getting help text' });
    }
});

// example: curl -X POST -H "Content-Type: application/json" -d '{"gmailId":"x@gmail.com"}' http://localhost:3000/accesscalendar 
app.post('/accesscalendar', async (req, res) => {
    const data = req.body;
    console.log('Accessing calendar for...', data);
    const jsonData = JSON.parse(JSON.stringify(req.body));


    if (!jsonData.gmailId) {
        console.log('Please provide a valid Gmail ID.');
        return res.status(400).json({ error: 'Please provide a valid Gmail ID' });
    }

    console.log('Received data:', jsonData.gmailId);
    // Check if the provided Gmail ID is valid
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!regex.test(jsonData.gmailId)) {
        console.log('Please provide a valid Gmail ID.');
        return res.status(400).json({ error: 'Please provide a valid Gmail ID' });
    }
    console.log('Valid Gmail ID:', jsonData.gmailId);

    try {
        console.log('before authorize:', jsonData.gmailId);
        const OAuth2Client = await credobj.authorize();
        console.log('Accessing calendar for...', jsonData.gmailId);
        return res.status(200).json({ message: `Access granted to calendar of ${jsonData.gmailId}` });
    } catch (error) {
        console.error('Failed to access calendar:', error.message);
        return res.status(500).json({ error: `Failed to access calendar: ${error.message}` });
    }

});

// example: curl -X POST -H "Content-Type: application/json" -d '{"when":"today"}' http://localhost:3000/listevents
app.post('/listevents', async (req, res) => {
    const data = req.body;
    console.log('Listing events for...', data);
    const jsonData = JSON.parse(JSON.stringify(req.body));

    if (!jsonData.when) {
        console.log('Please provide a valid when parameter.');
        return res.status(400).json({ error: 'Please provide a valid when parameter' });
    }

    try {
        const auth = await credobj.authorize();
        console.log('Listing events for...', jsonData.when);
        let jsonevents = await calapi.listEvents(auth, jsonData.when);
        return res.status(200).json({Events: jsonevents});
    } catch (error) {
        console.error('Failed to list events:', error.message);
        return res.status(500).json({ error: `Failed to list events: ${error.message}` });
    }
});


// example: curl -X POST -H "Content-Type: application/json" -d '{"eventTitle":"Meeting","when":"2023-10-01T10:00:00Z"}' http://localhost:3000/addevent
app.post('/addevent', async (req, res) => {
    const data = req.body;
    console.log('Adding event for...', data);
    const jsonData = JSON.parse(JSON.stringify(req.body));

    if (!jsonData.eventTitle || !jsonData.when) {
        console.log('Please provide a valid event title and when parameter.');
        return res.status(400).json({ error: 'Please provide a valid event title and when parameter' });
    }
    // Set default reminder time to 30 minutes if not provided
    if (!jsonData.reminder) {
        jsonData.reminder = 30;
    }
    try {
        const auth = await credobj.authorize();
        console.log('Adding event for...', jsonData.eventTitle, jsonData.when);
        let retstr = await calapi.addEvent(auth, jsonData.eventTitle, jsonData.when, jsonData.reminder);
        return res.status(200).json({ addevent: retstr });
    } catch (error) {
        console.error('Failed to add event:', error.message);
        return res.status(500).json({ error: `Failed to add event: ${error.message}` });
    }
});

// example: curl -X POST -H "Content-Type: application/json" -d '{"eventId":"12345"}' http://localhost:3000/deleteevent
app.post('/deleteevent', async (req, res) => {
    const data = req.body;
    console.log('Deleting event for...', data);
    const jsonData = JSON.parse(JSON.stringify(req.body));

    if (!jsonData.eventId) {
        console.log('Please provide a valid event ID.');
        return res.status(400).json({ error: 'Please provide a valid event ID' });
    }

    try {
        const auth = await credobj.authorize();
        console.log('Deleting event with ID...', jsonData.eventId);
        isdeleted = await calapi.deleteEvent(auth, jsonData.eventId);
        if (!isdeleted) {
            return res.status(404).json({ error: `Event with ID ${jsonData.eventId} not found or event couldn't be deleted` });
        }
        return res.status(200).json({ message: `Successfully deleted event with ID ${jsonData.eventId}` });
    } catch (error) {
        console.error('Failed to delete event:', error.message);
        return res.status(500).json({ error: `Failed to delete event: ${error.message}` });
    }
});

// Start the server
const port = 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});