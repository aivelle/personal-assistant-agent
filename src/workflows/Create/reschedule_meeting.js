export default async function rescheduleMeeting(input) {
  // input: { meetingId, newDate, newTime, participants, etc. }
  console.log("📆 Reschedule Meeting triggered with input:", input);

  const {
    googleToken,
    calendarId,
    eventId,
    newDate,
    newTime,
    newEndTime,
  } = input;

  const startDateTime = `${newDate}T${newTime}`;
  const endDateTime = newEndTime || `${newDate}T23:59:00Z`;

  const freebusyRes = await fetch(
    "https://www.googleapis.com/calendar/v3/freeBusy",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${googleToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        timeMin: startDateTime,
        timeMax: endDateTime,
        items: [{ id: calendarId }],
      }),
    }
  );
  const busyData = await freebusyRes.json();
  if (busyData.calendars?.[calendarId]?.busy?.length) {
    return {
      status: "failed",
      message: "Time slot is busy",
      busy: busyData.calendars[calendarId].busy,
    };
  }

  const patchRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${googleToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        start: { dateTime: startDateTime },
        end: { dateTime: endDateTime },
      }),
    }
  );
  const eventData = await patchRes.json();

  return {
    status: "success",
    message: "Meeting rescheduled",
    event: eventData,
  };
}

