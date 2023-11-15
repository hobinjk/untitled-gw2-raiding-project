// stealth applied
// revealed applied
// windows of 10 second or w/e

const window = 10000;

function addStateEvent(events, uptimeEvent) {
  for (let event of events) {
    if (Math.abs(event.time - uptimeEvent.time) > window) {
      continue;
    }
    event.events.push(uptimeEvent);
    return;
  }
  events.push({
    time: uptimeEvent.time,
    events: [uptimeEvent],
  });
}

function addStateEvents(events, player, uptime) {
  const name = player.account.split('.')[0];
  for (let stateData of uptime.states) {
    let time = stateData[0];
    let active = stateData[1] > 0.5;
    if (!active) {
      continue;
    }
    addStateEvent(events, {
      name,
      time,
    });
  }
}

export function getRevealIncidentReport(log) {
  let out = '';

  const stealthEvents = [];
  const revealEvents = [];

  const stealthBuff = 10269;
  const revealedBuff = 890;

  for (let player of log.players) {
    for (let uptime of player.buffUptimes) {
      if (uptime.id === revealedBuff) {
        addStateEvents(revealEvents, player, uptime);
      } else if (uptime.id === stealthBuff) {
        addStateEvents(stealthEvents, player, uptime);
      }
    }
  }

  for (const stealthEvent of stealthEvents) {
    if (stealthEvent.events.length < 10 && stealthEvent.events.length > 1) {
      out += 'Stealth missed someone' + JSON.stringify(stealthEvent) + '\n';
    }
  }
  for (const revealEvent of revealEvents) {
    revealEvent.events.sort((a, b) => a.time - b.time);
    let closestStealth = null;
    let closestDist = window;
    for (const stealthEvent of stealthEvents) {
      let dist = Math.abs(revealEvent.time - stealthEvent.time);
      if (!closestStealth || dist < closestDist) {
        closestStealth = stealthEvent;
        closestDist = dist;
      }
    }
    if (!closestStealth || closestDist > 3000) {
      continue;
    }
    out += 'Reveal: ' + JSON.stringify(revealEvent) + '\n';
    out += 'Closest stealth: ' + closestDist + ' ' + JSON.stringify(closestStealth) + '\n';
  }

  return out;
}
