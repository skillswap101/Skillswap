import { SwapContract } from '../types';

export const calendarExport = {
  /**
   * Generates a standard .ics string for Apple Calendar, Outlook, and other calendar apps
   */
  generateIcsFile(swap: SwapContract): string {
    const startDate = new Date(swap.scheduledDate);
    const endDate = new Date(startDate.getTime() + (swap.hours || 1) * 60 * 60 * 1000);

    const formatIcsDate = (date: Date): string => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const startIcs = formatIcsDate(startDate);
    const endIcs = formatIcsDate(endDate);
    const nowIcs = formatIcsDate(new Date());

    const description = `SkillSwap 5.0 Peer Learning Session\\n\\nTopic: ${swap.skillTitle}\\nCategory: ${swap.category}\\nMentor: ${swap.providerName}\\nLearner: ${swap.requesterName}\\nEscrow Locked: ${swap.totalCredits} Time Credits\\n\\nRoom Link: https://skillswap.app/studio/${swap.id}`;

    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//SkillSwap 5.0//Peer Skill Exchange//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:swap-${swap.id}@skillswap.app`,
      `DTSTAMP:${nowIcs}`,
      `DTSTART:${startIcs}`,
      `DTEND:${endIcs}`,
      `SUMMARY:SkillSwap: ${swap.skillTitle} (${swap.providerName} & ${swap.requesterName})`,
      `DESCRIPTION:${description}`,
      `LOCATION:SkillSwap Live Studio (https://skillswap.app/studio/${swap.id})`,
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      'BEGIN:VALARM',
      'TRIGGER:-PT15M',
      'ACTION:DISPLAY',
      'DESCRIPTION:SkillSwap session starts in 15 minutes!',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
  },

  /**
   * Downloads the .ics file directly in browser
   */
  downloadIcs(swap: SwapContract) {
    const icsContent = this.generateIcsFile(swap);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SkillSwap_${swap.skillTitle.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Generates a direct Google Calendar web URL
   */
  getGoogleCalendarUrl(swap: SwapContract): string {
    const startDate = new Date(swap.scheduledDate);
    const endDate = new Date(startDate.getTime() + (swap.hours || 1) * 60 * 60 * 1000);

    const formatGDate = (date: Date): string => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const text = encodeURIComponent(`SkillSwap: ${swap.skillTitle}`);
    const details = encodeURIComponent(
      `Peer Skill Exchange on SkillSwap 5.0\nMentor: ${swap.providerName}\nLearner: ${swap.requesterName}\nCredits in Escrow: ${swap.totalCredits} hrs\n\nJoin Live Studio: https://skillswap.app/studio/${swap.id}`
    );
    const location = encodeURIComponent(`SkillSwap Studio (Virtual Room: ${swap.id})`);
    const dates = `${formatGDate(startDate)}/${formatGDate(endDate)}`;

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}&location=${location}`;
  },
};
