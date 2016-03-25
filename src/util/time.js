function normalize(time) {
  const hoursInMinutePart = Math.floor(time.minutes / 60);

  const hours = ((time.hours + hoursInMinutePart) % 24 + 24) % 24;
  const minutes = time.minutes - hoursInMinutePart * 60;

  return {
    hours,
    minutes,
  };
}

function parse(timeString) {
  if (typeof timeString === 'string') {
    const match = timeString.match(/^(\d{2}):(\d{2})$/);
    if (match) {
      const hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);

      return normalize({
        hours,
        minutes,
      });
    }
  }
  return null;
}


export { parse, normalize };
