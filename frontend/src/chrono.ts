export default function makePrettyChronology(timeStart: number, duration: string) {
  let dateParts = new Date(timeStart).toISOString().split('T');
  let prettyStart = `${dateParts[0]} ${dateParts[1].split('.')[0]}`;
  let durationRe = /((\d+)h )?((\d+)m )?(\d+)s (\d+)ms/;
  let durationParts = durationRe.exec(duration);
  let durPretty = duration;
  let durPrettyLong = duration;
  if (durationParts) {
    let durHours: string|number = parseInt(durationParts[2] || '0');
    let durMinutes: string|number = parseInt(durationParts[4] || '0');
    let durSeconds: string|number = parseInt(durationParts[5] || '0');
    let durMs: string = durationParts[6];
    if (durMinutes < 10 && durHours > 0) {
      durMinutes = `0${durMinutes}`;
    }
    if (durSeconds < 10) {
      durSeconds = `0${durSeconds}`;
    }
    durPretty = (durHours > 0 ? `${durHours}:` : ``) +
      `${durMinutes}:${durSeconds}`;
    durPrettyLong = `${durPretty}.${durMs}`;
  }
  return {prettyStart, durPretty, durPrettyLong};
}
