import { google, calendar_v3 } from "googleapis"

const LEISH_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || "f3dfc683544c8fe680f42802dc3a2bed43892b342550c0e5701ba370a8dac7a0@group.calendar.google.com"

type CalendarEvent = {
  summary: string
  description?: string
  start: string
  end: string
  attendees?: string[]
}

let auth: any

function getAuth() {
  if (auth) return auth

  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  if (!key) throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY not set")

  const credentials = JSON.parse(
    Buffer.from(key, "base64").toString("utf-8"),
  )

  auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  })

  return auth
}

export async function createEvent(
  event: CalendarEvent,
): Promise<string> {
  const response = await google.calendar("v3").events.insert({
    auth: getAuth(),
    calendarId: LEISH_CALENDAR_ID,
    requestBody: {
      summary: event.summary,
      description: event.description,
      start: { dateTime: event.start, timeZone: "Asia/Kuala_Lumpur" },
      end: { dateTime: event.end, timeZone: "Asia/Kuala_Lumpur" },
      attendees: event.attendees?.map((email) => ({ email })),
    },
  })
  return response.data.id!
}

export async function updateEvent(
  eventId: string,
  event: Partial<CalendarEvent>,
): Promise<void> {
  await google.calendar("v3").events.update({
    auth: getAuth(),
    calendarId: LEISH_CALENDAR_ID,
    eventId,
    requestBody: {
      summary: event.summary,
      description: event.description,
      start: event.start
        ? { dateTime: event.start, timeZone: "Asia/Kuala_Lumpur" }
        : undefined,
      end: event.end
        ? { dateTime: event.end, timeZone: "Asia/Kuala_Lumpur" }
        : undefined,
      attendees: event.attendees?.map((email) => ({ email })),
    },
  })
}

export async function deleteEvent(
  eventId: string,
): Promise<void> {
  await google.calendar("v3").events.delete({
    auth: getAuth(),
    calendarId: LEISH_CALENDAR_ID,
    eventId,
  })
}

export async function listEvents(
  timeMin: string,
  timeMax: string,
): Promise<calendar_v3.Schema$Event[]> {
  const response = await google.calendar("v3").events.list({
    auth: getAuth(),
    calendarId: LEISH_CALENDAR_ID,
    timeMin,
    timeMax,
    timeZone: "Asia/Kuala_Lumpur",
    singleEvents: true,
    orderBy: "startTime",
  })
  return response.data.items || []
}
