/* artist.js — artist detail page */
(async function () {
  await Player.loadData();
  const id = new URLSearchParams(window.location.search).get('id');
  const [artists, albums] = await Promise.all([
    fetch('data/artists.json').then(r => r.json()),
    fetch('data/albums.json').then(r => r.json())
  ]);
  const artist = artists.find(a => a.id === id);

  if (!artist) {
    document.getElementById('artistRoot').innerHTML = `<div class="empty-state"><i class="fas fa-circle-xmark"></i><span>Artist not found</span></div>`;
    return;
  }

  const artistAlbums = albums.filter(a => a.artistId === id);
  const songs = Player.songs.filter(s => s.artistId === id);

  document.getElementById('artistImage').src = artist.image;
  document.getElementById('artistName').textContent = artist.name;
  document.getElementById('artistBio').textContent = artist.bio;
  document.getElementById('artistGenres').textContent = (artist.genres || []).join(' · ');

  document.getElementById('artistAlbumRow').innerHTML = artistAlbums.map(a => `
    <div class="card" data-id="${a.id}">
      <div class="cover"><img src="${a.cover}" alt="${a.title}"></div>
      <div class="card-title">${a.title}</div>
      <div class="card-sub">${a.year}</div>
    </div>`).join('');
  document.querySelectorAll('#artistAlbumRow .card').forEach(card => {
    card.addEventListener('click', () => { window.location.href = `album.html?id=${card.dataset.id}`; });
  });

  const listEl = document.getElementById('artistSongList');
  listEl.innerHTML = songs.map(s => `
    <div class="track-item" data-id="${s.id}">
      <div class="thumb"><img src="${s.cover}" alt="${s.title}"></div>
      <div class="info">
        <div class="title">${s.title}</div>
        <div class="artist">${s.album}</div>
      </div>
      <span class="duration">${Utils.formatTime(s.duration)}</span>
      <i class="fas fa-heart fav-btn ${Store.isFavorite(s.id) ? 'active' : ''}"></i>
    </div>`).join('');

  listEl.querySelectorAll('.track-item').forEach(item => {
    const sid = Number(item.dataset.id);
    item.addEventListener('click', (e) => {
      if (e.target.closest('.fav-btn')) return;
      Player.playSongId(sid, songs.map(s => s.id));
    });
    const favBtn = item.querySelector('.fav-btn');
    favBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const active = Store.toggleFavorite(sid);
      favBtn.classList.toggle('active', active);
    });
  });

  document.getElementById('playArtistBtn').addEventListener('click', () => {
    Player.playQueue(songs.map(s => s.id), 0, true);
  });

  Player.onChange(() => {
    const current = Player.currentSong();
    listEl.querySelectorAll('.track-item').forEach(el => {
      el.classList.toggle('active', !!current && current.id === Number(el.dataset.id));
    });
  });
})();
