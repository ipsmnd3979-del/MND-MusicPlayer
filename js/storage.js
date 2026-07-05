/* storage.js — localStorage persistence layer (favorites, playlists, recents, player state) */
const Store = (() => {
  const KEYS = {
    favorites: 'noir _favorites',
    recents: 'noir _recents',
    playlists: 'noir _playlists',
    playerState: 'noir _player_state',
    volume: 'noir _volume'
  };

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) { /* storage unavailable, fail silently */ }
  }

  // ---- favorites ----
  function getFavorites() { return read(KEYS.favorites, []); }
  function isFavorite(id) { return getFavorites().includes(id); }
  function toggleFavorite(id) {
    const favs = getFavorites();
    const idx = favs.indexOf(id);
    if (idx === -1) favs.push(id); else favs.splice(idx, 1);
    write(KEYS.favorites, favs);
    return favs.includes(id);
  }

  // ---- recently played ----
  function getRecents() { return read(KEYS.recents, []); }
  function addRecent(id) {
    let recents = getRecents().filter(x => x !== id);
    recents.unshift(id);
    recents = recents.slice(0, 20);
    write(KEYS.recents, recents);
  }

  // ---- playlists: [{ id, name, songIds: [] }] ----
  function getPlaylists() { return read(KEYS.playlists, []); }
  function savePlaylists(playlists) { write(KEYS.playlists, playlists); }
  function createPlaylist(name) {
    const playlists = getPlaylists();
    const playlist = { id: 'pl_' + Date.now(), name, songIds: [] };
    playlists.push(playlist);
    savePlaylists(playlists);
    return playlist;
  }
  function deletePlaylist(id) {
    savePlaylists(getPlaylists().filter(p => p.id !== id));
  }
  function addToPlaylist(playlistId, songId) {
    const playlists = getPlaylists();
    const pl = playlists.find(p => p.id === playlistId);
    if (pl && !pl.songIds.includes(songId)) pl.songIds.push(songId);
    savePlaylists(playlists);
  }
  function removeFromPlaylist(playlistId, songId) {
    const playlists = getPlaylists();
    const pl = playlists.find(p => p.id === playlistId);
    if (pl) pl.songIds = pl.songIds.filter(id => id !== songId);
    savePlaylists(playlists);
  }

  // ---- player state (persisted across page navigations) ----
  function getPlayerState() {
    return read(KEYS.playerState, {
      queue: [], index: 0, currentTime: 0, isPlaying: false, shuffle: false, repeat: 'off'
    });
  }
  function setPlayerState(state) {
    write(KEYS.playerState, state);
  }

  // ---- volume ----
  function getVolume() { return read(KEYS.volume, 0.85); }
  function setVolume(v) { write(KEYS.volume, v); }

  return {
    getFavorites, isFavorite, toggleFavorite,
    getRecents, addRecent,
    getPlaylists, createPlaylist, deletePlaylist, addToPlaylist, removeFromPlaylist,
    getPlayerState, setPlayerState,
    getVolume, setVolume
  };
})();
