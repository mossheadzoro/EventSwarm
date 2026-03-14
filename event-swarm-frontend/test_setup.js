const url = 'https://bjpbbx0r-9000.inc1.devtunnels.ms/api/setup';
const fd = new FormData();
fd.append('event_name', 'Hackathon 2026');
fd.append('event_date', '2026-03-24');
fd.append('event_type', 'Tech Conference');
fd.append('thread_id', `thread_${Date.now()}`);

fetch(url, {
  method: 'POST',
  body: fd,
})
  .then((res) => res.json())
  .then(console.log)
  .catch(console.error);
