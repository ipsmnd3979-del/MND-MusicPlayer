/* search.js — live search across songs, albums, artists */
(async function () {
  await Player.loadData();
  const songs = Player.songs;
  const [albums, artists] = await Promise.all([
    fetch('data/albums.json').then(r => r.json()),
    fetch('data/artists.json').then(r => r.json())
  ]);

  const input = document.getElementById('searchInput');
  const resultsEl = document.getElementById('searchResults');
  const chips = document.querySelectorAll('.chip');
  let activeFilter = 'all';

  function matches(text, q) { return text.toLowerCase().includes(q); }

  function songRow(song) {
    return `
      <div class="track-item" data-id="${song.id}">
        <div class="thumb"><img src="${song.cover}" alt="${song.title}"></div>
        <div class="info">
          <div class="title">${song.title}</div>
          <div class="artist">${song.artist} · ${song.album}</div>
        </div>
        <span class="duration">${Utils.formatTime(song.duration)}</span>
        <i class="fas fa-heart fav-btn ${Store.isFavorite(song.id) ? 'active' : ''}"></i>
      </div>`;
  }

  function cardRow(item, kind) {
    const cover = kind === 'artist' ? item.image : item.cover;
    const sub = kind === 'artist' ? (item.genres || []).join(', ') : item.artist;
    const href = kind === 'artist' ? `artist.html?id=${item.id}` : `album.html?id=${item.id}`;
    return `
      <a class="track-item" href="${href}">
        <div class="thumb" style="${kind === 'artist' ? 'border-radius:50%;' : ''}"><img src="${cover}" alt="${item.title || item.name}"></div>
        <div class="info">
          <div class="title">${item.title || item.name}</div>
          <div class="artist">${sub}</div>
        </div>
        <i class="fas fa-chevron-right" style="color:#5e6877;font-size:0.75rem;"></i>
      </a>`;
  }

  function render() {
    const q = input.value.trim().toLowerCase();
    let html = '';

    if (!q) {
      resultsEl.innerHTML = `<div class="empty-state"><i class="fas fa-magnifying-glass"></i><span>Search your entire library by track, artist or album</span></div>`;
      return;
    }

    const songMatches = songs.filter(s => matches(s.title, q) || matches(s.artist, q) || matches(s.album, q));
    const albumMatches = albums.filter(a => matches(a.title, q) || matches(a.artist, q));
    const artistMatches = artists.filter(a => matches(a.name, q));

    if (activeFilter === 'all' || activeFilter === 'songs') {
      if (songMatches.length) html += `<div class="section-title" style="margin-top:6px;">Songs</div>` + songMatches.map(songRow).join('');
    }
    if (activeFilter === 'all' || activeFilter === 'albums') {
      if (albumMatches.length) html += `<div class="section-title">Albums</div>` + albumMatches.map(a => cardRow(a, 'album')).join('');
    }
    if (activeFilter === 'all' || activeFilter === 'artists') {
      if (artistMatches.length) html += `<div class="section-title">Artists</div>` + artistMatches.map(a => cardRow(a, 'artist')).join('');
    }

    if (!html) {
      html = `<div class="empty-state"><i class="fas fa-circle-xmark"></i><span>No results for "${input.value}"</span></div>`;
    }
    resultsEl.innerHTML = html;

    resultsEl.querySelectorAll('.track-item[data-id]').forEach(item => {
      const id = Number(item.dataset.id);
      item.addEventListener('click', (e) => {
        if (e.target.closest('.fav-btn')) return;
        Player.playSongId(id, songMatches.map(s => s.id));
      });
      const favBtn = item.querySelector('.fav-btn');
      if (favBtn) {
        favBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const active = Store.toggleFavorite(id);
          favBtn.classList.toggle('active', active);
        });
      }
    });
  }

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeFilter = chip.dataset.filter;
      render();
    });
  });

  input.addEventListener('input', render);
  render();
  input.focus();
})();
