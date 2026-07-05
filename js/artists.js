/* artists.js — full artists listing page */
(async function () {
  await Player.loadData();
  const artists = await fetch('data/artists.json').then(r => r.json());

  const root = document.getElementById('artistsGrid');
  root.innerHTML = artists.map(a => `
    <div class="card artist" data-id="${a.id}">
      <div class="cover"><img src="${a.image}" alt="${a.name}"></div>
      <div class="card-title">${a.name}</div>
      <div class="card-sub">${(a.genres || []).join(', ')}</div>
    </div>`).join('');

  root.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', () => { window.location.href = `artist.html?id=${card.dataset.id}`; });
  });
})();
