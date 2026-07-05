/* player.js — shared audio engine + mini player, used on every page */
const Utils = {
  formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  },
  placeholderCover(seed) {
    return `https://picsum.photos/seed/${encodeURIComponent(seed)}/400/400`;
  }
};

const Player = (() => {
  let songs = [];
  let dataLoaded = false;
  const audio = new Audio();
  let state = Store.getPlayerState();
  const listeners = [];

  async function loadData() {
    if (dataLoaded) return songs;
    const res = await fetch('data/songs.json');
    songs = await res.json();
    dataLoaded = true;
    return songs;
  }

  function getSongById(id) { return songs.find(s => s.id === id); }
  function currentSong() { return getSongById(state.queue[state.index]); }

  function persist() {
    Store.setPlayerState({ ...state, currentTime: audio.currentTime || 0 });
  }

  function notify() { listeners.forEach(fn => fn(state, currentSong(), audio)); }
  function onChange(fn) { listeners.push(fn); }

  function loadCurrent(autoplay) {
    const song = currentSong();
    if (!song) return;
    audio.src = song.src;
    audio.currentTime = 0;
    Store.addRecent(song.id);
    notify();
    if (autoplay) {
      audio.play().then(() => { state.isPlaying = true; notify(); persist(); })
        .catch(() => { state.isPlaying = false; notify(); });
    } else {
      state.isPlaying = false;
    }
    persist();
  }

  function playQueue(queueIds, startIndex, autoplay = true) {
    state.queue = queueIds;
    state.index = startIndex;
    loadCurrent(autoplay);
  }

  function playSongId(id, contextIds) {
    const queue = contextIds && contextIds.length ? contextIds : songs.map(s => s.id);
    const idx = queue.indexOf(id);
    playQueue(queue, idx === -1 ? 0 : idx, true);
  }

  function toggle() {
    if (!currentSong()) return;
    if (audio.paused) {
      audio.play().then(() => { state.isPlaying = true; notify(); persist(); }).catch(() => {});
    } else {
      audio.pause();
      state.isPlaying = false;
      notify(); persist();
    }
  }

  function next(auto) {
    if (!state.queue.length) return;
    if (state.repeat === 'one' && auto) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
      return;
    }
    if (state.shuffle) {
      let idx = state.index;
      if (state.queue.length > 1) {
        do { idx = Math.floor(Math.random() * state.queue.length); } while (idx === state.index);
      }
      state.index = idx;
    } else {
      state.index += 1;
      if (state.index >= state.queue.length) {
        if (state.repeat === 'all') state.index = 0;
        else { state.index = state.queue.length - 1; audio.pause(); state.isPlaying = false; notify(); persist(); return; }
      }
    }
    loadCurrent(true);
  }

  function prev() {
    if (!state.queue.length) return;
    if (audio.currentTime > 3) { audio.currentTime = 0; return; }
    state.index -= 1;
    if (state.index < 0) state.index = state.shuffle ? Math.floor(Math.random() * state.queue.length) : 0;
    loadCurrent(true);
  }

  function seekPercent(pct) {
    const song = currentSong();
    const duration = audio.duration || (song && song.duration) || 0;
    if (!duration) return;
    audio.currentTime = pct * duration;
    notify();
  }

  function setVolume(v) {
    audio.volume = v;
    Store.setVolume(v);
  }

  function toggleShuffle() { state.shuffle = !state.shuffle; notify(); persist(); }
  function cycleRepeat() {
    state.repeat = state.repeat === 'off' ? 'all' : state.repeat === 'all' ? 'one' : 'off';
    notify(); persist();
  }

  audio.addEventListener('timeupdate', notify);
  audio.addEventListener('ended', () => next(true));
  audio.addEventListener('play', () => { state.isPlaying = true; notify(); });
  audio.addEventListener('pause', () => { state.isPlaying = false; notify(); });
  window.addEventListener('beforeunload', persist);
  setInterval(persist, 4000);

  async function init() {
    await loadData();
    audio.volume = Store.getVolume();
    if (state.queue && state.queue.length && currentSong()) {
      const song = currentSong();
      audio.src = song.src;
      audio.currentTime = state.currentTime || 0;
      if (state.isPlaying) {
        audio.play().catch(() => { state.isPlaying = false; notify(); });
      }
    }
    notify();
  }

  return {
    init, loadData, onChange,
    playSongId, playQueue, toggle, next, prev, seekPercent, setVolume,
    toggleShuffle, cycleRepeat, currentSong, getSongById,
    get audio() { return audio; },
    get state() { return state; },
    get songs() { return songs; }
  };
})();

/* ---- Mini player: mounted on every page in a #miniPlayerRoot container ---- */
const MiniPlayer = (() => {
  function mount() {
    const root = document.getElementById('miniPlayerRoot');
    if (!root) return;
    root.innerHTML = `
      <div class="mini-player" id="miniPlayer">
        <div class="mini-cover"><img id="miniArt" alt="cover"></div>
        <div class="mini-info">
          <div class="mini-title" id="miniTitle">Nothing playing</div>
          <div class="mini-artist" id="miniArtist">Pick a song to start</div>
        </div>
        <div class="mini-actions">
          <i class="fas fa-heart" id="miniFav"></i>
          <i class="fas fa-play" id="miniPlayIcon"></i>
          <i class="fas fa-forward" id="miniNext"></i>
        </div>
      </div>`;

    const miniArt = document.getElementById('miniArt');
    const miniTitle = document.getElementById('miniTitle');
    const miniArtist = document.getElementById('miniArtist');
    const miniPlayIcon = document.getElementById('miniPlayIcon');
    const miniFav = document.getElementById('miniFav');
    const miniNext = document.getElementById('miniNext');
    const miniPlayer = document.getElementById('miniPlayer');

    miniPlayIcon.addEventListener('click', (e) => { e.stopPropagation(); Player.toggle(); });
    miniNext.addEventListener('click', (e) => { e.stopPropagation(); Player.next(false); });
    miniFav.addEventListener('click', (e) => {
      e.stopPropagation();
      const song = Player.currentSong();
      if (!song) return;
      const fav = Store.toggleFavorite(song.id);
      miniFav.style.color = fav ? '#7C3AED' : '#d0d8e4';
    });
    miniPlayer.addEventListener('click', () => { window.location.href = 'player.html'; });

    Player.onChange((state, song) => {
      if (!song) {
        miniTitle.textContent = 'Nothing playing';
        miniArtist.textContent = 'Pick a song to start';
        return;
      }
      miniArt.src = song.cover;
      miniTitle.textContent = song.title;
      miniArtist.textContent = song.artist;
      miniPlayIcon.className = state.isPlaying ? 'fas fa-pause' : 'fas fa-play';
      miniFav.style.color = Store.isFavorite(song.id) ? '#7C3AED' : '#d0d8e4';
    });
  }
  return { mount };
})();

/* ---- Bottom nav: highlights the active tab based on current filename ---- */
function initBottomNav() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.bottom-nav .nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === page);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  await Player.init();
  MiniPlayer.mount();
  initBottomNav();
});
