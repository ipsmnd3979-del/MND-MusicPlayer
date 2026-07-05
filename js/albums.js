/* albums.js — full albums listing page */
(async function () {
  await Player.loadData();
  const albums = await fetch('data/albums.json').then(r => r.json());

  const root = document.getElementById('albumsGrid');
  root.innerHTML = albums.map(a => `
    <div class="card" data-id="${a.id}">
      <div class="cover"><img src="${a.cover}" alt="${a.title}"></div>
      <div class="card-title">${a.title}</div>
      <div class="card-sub">${a.artist}</div>
    </div>`).join('');

  root.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', () => { window.location.href = `album.html?id=${card.dataset.id}`; });
  });
})();
