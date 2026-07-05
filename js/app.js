/* app.js — Home page logic */
(async function () {
  await Player.loadData();
  const songs = Player.songs;

  const [albums, artists] = await Promise.all([
    fetch('data/albums.json').then(r => r.json()),
    fetch('data/artists.json').then(r => r.json())
  ]);

  function songThumb(song) {
    return `
      <div class="track-item" data-id="${song.id}">
        <div class="thumb"><img src="${song.cover}" alt="${song.title}"></div>
        <div class="info">
          <div class="title">${song.title}</div>
          <div class="artist">${song.artist}</div>
        </div>
        <span class="duration">${Utils.formatTime(song.duration)}</span>
        <i class="fas fa-heart fav-btn ${Store.isFavorite(song.id) ? 'active' : ''}"></i>
      </div>`;
  }

  function renderRecents() {
    const root = document.getElementById('recentRow');
    const ids = Store.getRecents().slice(0, 8);
    if (!ids.length) {
      root.innerHTML = `<div class="empty-state" style="padding:16px 4px;"><span>No recently played tracks yet</span></div>`;
      return;
    }
    root.innerHTML = ids.map(id => {
      const s = Player.getSongById(id);
      if (!s) return '';
      return `
        <div class="card" data-id="${s.id}">
          <div class="cover"><img src="${s.cover}" alt="${s.title}"></div>
          <div class="card-title">${s.title}</div>
          <div class="card-sub">${s.artist}</div>
        </div>`;
    }).join('');
    root.querySelectorAll('.card').forEach(card => {
      card.addEventListener('click', () => {
        const id = Number(card.dataset.id);
        Player.playSongId(id, ids);
      });
    });
  }

  function renderAlbums() {
    const root = document.getElementById('albumRow');
    root.innerHTML = albums.slice(0, 10).map(a => `
      <div class="card" data-id="${a.id}">
        <div class="cover"><img src="${a.cover}" alt="${a.title}"></div>
        <div class="card-title">${a.title}</div>
        <div class="card-sub">${a.artist}</div>
      </div>`).join('');
    root.querySelectorAll('.card').forEach(card => {
      card.addEventListener('click', () => { window.location.href = `album.html?id=${card.dataset.id}`; });
    });
  }

  function renderArtists() {
    const root = document.getElementById('artistRow');
    root.innerHTML = artists.slice(0, 10).map(a => `
      <div class="card artist" data-id="${a.id}">
        <div class="cover"><img src="${a.image}" alt="${a.name}"></div>
        <div class="card-title">${a.name}</div>
        <div class="card-sub">${(a.genres || []).join(', ')}</div>
      </div>`).join('');
    root.querySelectorAll('.card').forEach(card => {
      card.addEventListener('click', () => { window.location.href = `artist.html?id=${card.dataset.id}`; });
    });
  }

  function renderAllSongs() {
    const root = document.getElementById('allSongsList');
    root.innerHTML = songs.map(songThumb).join('');
    wireTrackList(root, songs.map(s => s.id));
  }

  function wireTrackList(root, queueIds) {
    root.querySelectorAll('.track-item').forEach(item => {
      const id = Number(item.dataset.id);
      item.addEventListener('click', (e) => {
        if (e.target.closest('.fav-btn')) return;
        Player.playSongId(id, queueIds);
      });
      const favBtn = item.querySelector('.fav-btn');
      favBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const active = Store.toggleFavorite(id);
        favBtn.classList.toggle('active', active);
      });
    });
  }

  document.getElementById('homeSearchBox').addEventListener('click', () => {
    window.location.href = 'search.html';
  });

  renderRecents();
  renderAlbums();
  renderArtists();
  renderAllSongs();

  Player.onChange(() => {
    document.querySelectorAll('.track-item').forEach(el => {
      const id = Number(el.dataset.id);
      const song = Player.currentSong();
      el.classList.toggle('active', !!song && song.id === id);
    });
  });
})();
