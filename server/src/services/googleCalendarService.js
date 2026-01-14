const { google } = require('googleapis');
require('dotenv').config();

const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:6000/api/auth/google/callback';

// Helper to create a NEW client instance to avoid race conditions
const createOAuthClient = () => {
    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        redirectUri
    );
};

if (!process.env.GOOGLE_CLIENT_ID) {
    console.warn('⚠️ GOOGLE_CLIENT_ID is missing from .env. Google Calendar features will not work.');
}

if (!process.env.GOOGLE_REDIRECT_URI && process.env.NODE_ENV === 'production') {
    console.error('❌ CRITICAL: GOOGLE_REDIRECT_URI is not set in production!');
}

const SCOPES = ['https://www.googleapis.com/auth/calendar.events', 'https://www.googleapis.com/auth/calendar.readonly'];

exports.getAuthUrl = (state) => {
    const oauth2Client = createOAuthClient();
    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent',
        state: state
    });
};

exports.getTokens = async (code) => {
    const oauth2Client = createOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
};

exports.createEvent = async (refreshToken, reminder) => {
    const oauth2Client = createOAuthClient();
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const event = {
        summary: reminder.title,
        description: reminder.description || 'Reminder from ReminderApp',
        start: {
            dateTime: new Date(reminder.due_date).toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
            dateTime: new Date(new Date(reminder.due_date).getTime() + 30 * 60000).toISOString(), // 30 mins later
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        reminders: {
            useDefault: false,
            overrides: [
                { method: 'popup', minutes: 10 },
                { method: 'email', minutes: 60 }
            ],
        },
    };

    try {
        const response = await calendar.events.insert({
            calendarId: 'primary',
            resource: event,
        });
        return response.data;
    } catch (error) {
        console.error('Error creating Google Calendar event:', error);
        throw error; // Rethrow to let controller handle it
    }
};

exports.deleteEvent = async (refreshToken, eventId) => {
    const oauth2Client = createOAuthClient();
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    try {
        await calendar.events.delete({
            calendarId: 'primary',
            eventId: eventId,
        });
        return true;
    } catch (error) {
        console.error('Error deleting Google Calendar event:', error);
        return false;
    }
};
