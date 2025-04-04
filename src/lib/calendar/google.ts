import { google } from "googleapis";

export const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export async function getGoogleAuthUrl(userId: string) {
  const state = Buffer.from(JSON.stringify({ userId })).toString("base64");

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/calendar"],
    state,
  });
}

export async function syncBookingToCalendar(booking: any, tokens: any) {
  oauth2Client.setCredentials(tokens);

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const event = {
    summary: `${booking.service_type} with ${booking.client_name}`,
    description: booking.notes,
    start: {
      dateTime: booking.booking_date,
      timeZone: "UTC",
    },
    end: {
      dateTime: new Date(
        new Date(booking.booking_date).getTime() +
          booking.duration_minutes * 60000
      ).toISOString(),
      timeZone: "UTC",
    },
    attendees: [{ email: booking.client_email }],
    reminders: {
      useDefault: false,
      overrides: [
        { method: "email", minutes: 24 * 60 },
        { method: "popup", minutes: 30 },
      ],
    },
  };

  return calendar.events.insert({
    calendarId: "primary",
    requestBody: event,
    sendUpdates: "all",
  });
}
