import React from 'react';

export default function LogsList(props: any) {
  const { success, fightName, timeStart, duration } = props;
  let dateParts = timeStart.split(' ');
  // let date = new Date(`${dateParts[0]} ${dateParts[1]}${dateParts[2]}`);
  let prettyStart = `${dateParts[0]} ${dateParts[1]}`;
  let durationRe = /((\d+)h )?((\d+)m )?(\d+)s (\d+)ms/;
  let durationParts = durationRe.exec(duration);
  let durPretty = duration;
  if (durationParts) {
    let durHours: string|number = parseInt(durationParts[2] || '0');
    let durMinutes: string|number = parseInt(durationParts[4] || '0');
    let durSeconds: string|number = parseInt(durationParts[5] || '0');
    let durMs: string = durationParts[6];
    if (durMinutes < 10 && durHours > 0) {
      durMinutes = `0${durMinutes}`;
    }
    if (durSeconds < 10 && (durMinutes > 0 || durHours > 0)) {
      durSeconds = `0${durSeconds}`;
    }
    durPretty = (durHours > 0 ? `${durHours}:` : ``) +
      `${durMinutes}:${durSeconds}.${durMs}`;
  }

  return (
    <tr>
      <td>
        {success ?
          <span className="icon has-text-success"><i className="fas fa-check"></i></span> :
          <span className="icon has-text-danger"><i className="fas fa-times"></i></span>
        }
      </td>
      <td>
        {fightName}
      </td>
      <td>
        {prettyStart}
      </td>
      <td>
        {durPretty}
      </td>
    </tr>
  );
}

