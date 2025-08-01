let guest = null; // Global guest object for use in RSVP

// Load wedding details from details.json
fetch('details.json')
  .then(res => res.json())
  .then(data => {
    // Set names
    document.getElementById('names').textContent = data.names;
    document.getElementById('footerNames').textContent = data.names;

    // Populate Akad
    document.getElementById('akad').innerHTML = `
      <h3>${data.akad.title}</h3>
      <p>${data.akad.date}<br>${data.akad.time}</p>
      <p>${data.akad.location}</p>
    `;

    // Populate Resepsi
    document.getElementById('reception').innerHTML = `
      <h3>${data.reception.title}</h3>
      <p>${data.reception.date}<br>${data.reception.time}</p>
      <p>${data.reception.location}</p>
    `;

    // Countdown
    const countdownEl = document.getElementById('countdown');
    const eventDate = new Date(data.weddingDate);

    function updateCountdown() {
      const now = new Date();
      const diff = eventDate - now;

      if (diff <= 0) {
        countdownEl.textContent = "Hari Bahagia Telah Tiba!";
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(diff / (1000 * 60 * 60)) % 24;
      const mins = Math.floor(diff / (1000 * 60)) % 60;
      const secs = Math.floor(diff / 1000) % 60;

      countdownEl.textContent = `${days} hari ${hours} jam ${mins} menit ${secs} detik`;
    }

    setInterval(updateCountdown, 1000);
    updateCountdown();
  });

// Extract guest slug from URL
function getGuestSlug() {
  const url = new URL(window.location.href);
  const params = new URLSearchParams(url.search);
  if (params.has('guest')) return params.get('guest').toLowerCase();
  const path = url.pathname.split('/').filter(Boolean);
  return path.length > 0 ? path[path.length - 1].toLowerCase() : null;
}

// Load guest info from invites.json and personalize the page
function showGuestName(slug) {
  fetch('invites.json')
    .then(res => res.json())
    .then(guests => {
      guest = guests[slug];
      if (guest) {
        document.getElementById('guestName').innerHTML = `<strong>Untuk: ${guest.name}</strong>`;

        // Conditionally hide Akad/Resepsi sections
        if (!guest.akad) document.getElementById('akad').style.display = 'none';
        if (!guest.reception) document.getElementById('reception').style.display = 'none';

        // Pax display
        const paxContainer = document.getElementById('paxDropdownContainer');
        paxContainer.innerHTML = '';

        if (guest.maxPax === 1) {
          paxContainer.innerHTML = `<div class="pax-fixed">1 Orang</div>`;
        } else if (guest.maxPax > 1) {
          const select = document.createElement('select');
          select.id = 'paxDropdown';
          select.name = 'pax';

          for (let i = 1; i <= guest.maxPax; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.text = `${i} Orang`;
            select.appendChild(option);
          }

          paxContainer.appendChild(select);
        }
      } else {
        document.getElementById('guestName').innerHTML = `<strong>Tamu tidak dikenal.</strong>`;
        document.querySelector('.rsvp-btn').disabled = true;
      }
    });
}

// Get guest slug and render their section
const guestSlug = getGuestSlug();
if (guestSlug) {
  showGuestName(guestSlug);
}

// Submit RSVP to Google Apps Script
function submitRSVP(guest, paxValue) {
  const body = {
    name: guest.name,
    pax: paxValue,
    akad: guest.akad,
    resepsi: guest.reception
  };

  fetch('https://script.google.com/macros/s/AKfycbwNgd8jGmM0jHnJgyXJb6IvaqVC4c5Ox_3EJhmusM1m00FlMKJ3Y4T-Hpvy_fCSq-9TUg/exec', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })
    .then(res => res.json())
    .then(data => {
      if (data.status === "success") {
        alert("Terima kasih! Kehadiran Anda telah tercatat.");
        document.querySelector('.rsvp-btn').disabled = true;
        document.querySelector('.rsvp-btn').textContent = "Sudah Dikonfirmasi";
      } else {
        alert("Gagal mengirim RSVP. Silakan coba lagi.");
      }
    })
    .catch(err => {
      console.error("RSVP error:", err);
      alert("Terjadi kesalahan. Silakan coba lagi.");
    });
}

// RSVP button click handler
document.querySelector('.rsvp-btn').onclick = function () {
  if (!guest) {
    alert("Data tamu tidak ditemukan.");
    return;
  }

  const pax = document.getElementById('paxDropdown')?.value || "1";
  submitRSVP(guest, pax);
};
