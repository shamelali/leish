export async function createEvent(_params: { summary: string; description: string; start: string; end: string; attendees?: string[] }): Promise<string> {
  return "mock-event-id"
}

export async function deleteEvent(_eventId: string): Promise<void> {
  // no-op
}
