function generateUID() {
  const chars = 'DeRsStTuUvIjJVwbB10296583EfWxcCdXyYzFgkKlGZLmaAMnNoOpPqQe7hHi4';
  let uid = 'rGPT-';
  for (let i = 0; i < 8; i++) {
    uid += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return uid;
}


document.getElementById('copy-uid-btn').addEventListener('click', () => {
  const uidText = document.getElementById('payment-uid').textContent;
  navigator.clipboard.writeText(uidText).then(() => {
    alert('UID copied to clipboard!');
  });
});
