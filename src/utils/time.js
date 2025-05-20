function formatMillisToHMS(ms) {
  if (typeof ms !== 'number' || isNaN(ms)) return '00:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return (
    (hours < 10 ? '0' + hours : hours) + ':' +
    (minutes < 10 ? '0' + minutes : minutes) + ':' +
    (seconds < 10 ? '0' + seconds : seconds)
  );
}
module.exports = { formatMillisToHMS };
