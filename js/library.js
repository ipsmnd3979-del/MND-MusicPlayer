/* library.js — favorites, playlists, recently played */
(async function () {
  await Player.loadData();
  const songs = Player.songs;

  const tabs = document.querySelectorAll('.tab-row .tab');
  const panelFavorites = document.getElementById('panelFavorites');
  const panelPlaylists = document.getElementById('panelPlaylists');
  const panelRecents = document.getElementById('panelRecents');
  const panels = { favorites: panelFavorites, playlists: panelPlaylists, recents: panelRecents };

  function songRow(song, opts = {}) {
    return `
      <div class="track-item" data-id="${song.id}">
        <div class="thumb"><img src="${song.cover}" alt="${song.title}"></div>
        <div class="info">
          <div class="title">${song.title}</div>
          <div class="artist">${song.artist}</div>
        </div>
        <span class="duration">${Utils.formatTime(song.duration)}</span>
        ${opts.playlistId
          ? `<i class="fas fa-xmark fav-btn remove-btn" data-playlist="${opts.playlistId}"></i>`
          : `<i class="fas fa-heart fav-btn ${Store.isFavorite(song.id) ? 'active' : ''}"></i>`}
      </div>`;
  }

  function wireRows(root, queueIds, opts = {}) {
    root.querySelectorAll('.track-item').forEach(item => {
      const id = Number(item.dataset.id);
      item.addEventListener('click', (e) => {
        if (e.target.closest('.fav-btn')) return;
        Player.playSongId(id, queueIds);
      });
      const removeBtn = item.querySelector('.remove-btn');
      if (removeBtn) {
        removeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          Store.removeFromPlaylist(opts.playlistId, id);
          renderPlaylistDetail(opts.playlistId);
        });
      } else {
        const favBtn = item.querySelector('.fav-btn');
        favBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const active = Store.toggleFavorite(id);
          favBtn.classList.toggle('active', active);
          if (!active && root === panelFavorites.querySelector('.track-list')) renderFavorites();
        });
      }
    });
  }

  function renderFavorites() {
    const ids = Store.getFavorites();
    if (!ids.length) {
      panelFavorites.innerHTML = `<div class="empty-state"><i class="fas fa-heart"></i><span>No favorites yet — tap the heart on any track</span></div>`;
      return;
    }
    const list = ids.map(Player.getSongById).filter(Boolean);
    panelFavorites.innerHTML = `<div class="track-list">${list.map(s => songRow(s)).join('')}</div>`;
    wireRows(panelFavorites.querySelector('.track-list'), ids);
  }

  function renderRecents() {
    const ids = Store.getRecents();
    if (!ids.length) {
      panelRecents.innerHTML = `<div class="empty-state"><i class="fas fa-clock-rotate-left"></i><span>Nothing played yet</span></div>`;
      return;
    }
    const list = ids.map(Player.getSongById).filter(Boolean);
    panelRecents.innerHTML = `<div class="track-list">${list.map(s => songRow(s)).join('')}</div>`;
    wireRows(panelRecents.querySelector('.track-list'), ids);
  }

  function renderPlaylists() {
    const playlists = Store.getPlaylists();
    let html = `
      <div style="display:flex;gap:8px;margin-bottom:14px;">
        <input id="newPlaylistName" type="text" placeholder="New playlist name" style="flex:1;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:10px 12px;color:#fff;outline:none;">
        <button class="btn btn-primary" id="createPlaylistBtn"><i class="fas fa-plus"></i></button>
      </div>
      <div id="playlistCards"></div>
      <div id="playlistDetail"></div>`;
    panelPlaylists.innerHTML = html;

    document.getElementById('createPlaylistBtn').addEventListener('click', () => {
      const input = document.getElementById('newPlaylistName');
      const name = input.value.trim();
      if (!name) return;
      Store.createPlaylist(name);
      input.value = '';
      renderPlaylists();
    });

    const cardsRoot = document.getElementById('playlistCards');
    if (!playlists.length) {
      cardsRoot.innerHTML = `<div class="empty-state"><i class="fas fa-list-ul"></i><span>Create your first playlist above</span></div>`;
      return;
    }
    cardsRoot.innerHTML = playlists.map(p => `
      <div class="track-item playlist-card" data-id="${p.id}">
        <div class="thumb" style="display:flex;align-items:center;justify-content:center;background:rgba(124,58,237,0.15);"><i class="fas fa-list-ul" style="color:#7C3AED;"></i></div>
        <div class="info">
          <div class="title">${p.name}</div>
          <div class="artist">${p.songIds.length} track${p.songIds.length === 1 ? '' : 's'}</div>
        </div>
        <i class="fas fa-trash fav-btn" data-delete="${p.id}"></i>
      </div>`).join('');

    cardsRoot.querySelectorAll('.playlist-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('[data-delete]')) return;
        renderPlaylistDetail(card.dataset.id);
      });
    });
    cardsRoot.querySelectorAll('[data-delete]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        Store.deletePlaylist(btn.dataset.delete);
        renderPlaylists();
      });
    });
  }

  function renderPlaylistDetail(playlistId) {
    const playlist = Store.getPlaylists().find(p => p.id === playlistId);
    const detailRoot = document.getElementById('playlistDetail');
    if (!playlist) { detailRoot.innerHTML = ''; return; }
    const list = playlist.songIds.map(Player.getSongById).filter(Boolean);
    detailRoot.innerHTML = `
      <div class="section-title" style="margin-top:16px;">${playlist.name}<span class="link" id="closeDetailBtn">close</span></div>
      ${list.length ? `<div class="track-list">${list.map(s => songRow(s, { playlistId })).join('')}</div>`
        : `<div class="empty-state" style="padding:20px 4px;"><span>No tracks yet. Add songs from any track list.</span></div>`}`;
    document.getElementById('closeDetailBtn').addEventListener('click', () => { detailRoot.innerHTML = ''; });
    if (list.length) wireRows(detailRoot.querySelector('.track-list'), playlist.songIds, { playlistId });
  }

  function switchTab(name) {
    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === name));
    Object.entries(panels).forEach(([key, el]) => { el.style.display = key === name ? 'block' : 'none'; });
    if (name === 'favorites') renderFavorites();
    if (name === 'recents') renderRecents();
    if (name === 'playlists') renderPlaylists();
  }

  tabs.forEach(tab => tab.addEventListener('click', () => switchTab(tab.dataset.tab)));

  const urlTab = new URLSearchParams(window.location.search).get('tab') || 'favorites';
  switchTab(urlTab);
})();
