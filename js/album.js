/* album.js — album detail page */
(async function () {
  await Player.loadData();
  const id = new URLSearchParams(window.location.search).get('id');
  const albums = await fetch('data/albums.json').then(r => r.json());
  const album = albums.find(a => a.id === id);

  if (!album) {
    document.getElementById('albumRoot').innerHTML = `<div class="empty-state"><i class="fas fa-circle-xmark"></i><span>Album not found</span></div>`;
    return;
  }

  const songs = album.songIds.map(Player.getSongById).filter(Boolean);
  const totalSeconds = songs.reduce((sum, s) => sum + s.duration, 0);

  document.getElementById('albumCover').src = album.cover;
  document.getElementById('albumTitle').textContent = album.title;
  document.getElementById('albumMeta').innerHTML =
    `<a href="artist.html?id=${album.artistId}">${album.artist}</a> · ${album.year} · ${songs.length} songs · ${Math.round(totalSeconds / 60)} min`;

  const listEl = document.getElementById('albumSongList');
  listEl.innerHTML = songs.map((s, idx) => `
    <div class="track-item" data-id="${s.id}">
      <span class="idx">${idx + 1}</span>
      <div class="info">
        <div class="title">${s.title}</div>
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

  document.getElementById('playAlbumBtn').addEventListener('click', () => {
    Player.playQueue(songs.map(s => s.id), 0, true);
  });

  Player.onChange(() => {
    const current = Player.currentSong();
    listEl.querySelectorAll('.track-item').forEach(el => {
      el.classList.toggle('active', !!current && current.id === Number(el.dataset.id));
    });
  });
})();
