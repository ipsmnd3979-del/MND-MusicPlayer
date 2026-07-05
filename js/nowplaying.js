/* nowplaying.js — full-screen player page */
(async function () {
  await Player.loadData();

  const artContainer = document.getElementById('npArtContainer');
  const albumArt = document.getElementById('npAlbumArt');
  const trackTitle = document.getElementById('npTrackTitle');
  const trackArtist = document.getElementById('npTrackArtist');
  const favBtn = document.getElementById('npFav');
  const progressFill = document.getElementById('npProgressFill');
  const progressBar = document.getElementById('npProgressBar');
  const currentTimeSpan = document.getElementById('npCurrentTime');
  const totalTimeSpan = document.getElementById('npTotalTime');
  const playBtn = document.getElementById('npPlayBtn');
  const playIcon = document.getElementById('npPlayIcon');
  const prevBtn = document.getElementById('npPrevBtn');
  const nextBtn = document.getElementById('npNextBtn');
  const shuffleBtn = document.getElementById('npShuffleBtn');
  const repeatBtn = document.getElementById('npRepeatBtn');
  const volumeSlider = document.getElementById('npVolume');
  const queueList = document.getElementById('npQueueList');

  let isDragging = false;

  function render(state, song, audio) {
    if (!song) {
      trackTitle.textContent = 'Nothing playing';
      trackArtist.textContent = 'Go pick a song from Home or Search';
      renderQueue(state, null);
      return;
    }
    albumArt.src = song.cover;
    albumArt.alt = song.title;
    trackTitle.textContent = song.title;
    trackArtist.textContent = song.artist;
    favBtn.classList.toggle('active', Store.isFavorite(song.id));

    const duration = audio.duration || song.duration || 0;
    if (!isDragging) {
      const pct = duration ? (audio.currentTime / duration) * 100 : 0;
      progressFill.style.width = `${Math.min(pct, 100)}%`;
      currentTimeSpan.textContent = Utils.formatTime(audio.currentTime);
    }
    totalTimeSpan.textContent = Utils.formatTime(duration);

    playIcon.className = state.isPlaying ? 'fas fa-pause' : 'fas fa-play';
    artContainer.classList.toggle('playing', state.isPlaying);
    shuffleBtn.classList.toggle('toggled', state.shuffle);
    repeatBtn.classList.toggle('toggled', state.repeat !== 'off');
    repeatBtn.innerHTML = state.repeat === 'one'
      ? '<i class="fas fa-1"></i>'
      : '<i class="fas fa-repeat"></i>';

    renderQueue(state, song);
  }

  function renderQueue(state, currentSong) {
    if (!state.queue.length) {
      queueList.innerHTML = `<div class="empty-state"><i class="fas fa-list"></i><span>Queue is empty</span></div>`;
      return;
    }
    queueList.innerHTML = state.queue.map((id, idx) => {
      const s = Player.getSongById(id);
      if (!s) return '';
      const active = currentSong && s.id === currentSong.id;
      return `
        <div class="track-item ${active ? 'active' : ''}" data-idx="${idx}">
          <span class="idx">${idx + 1}</span>
          <div class="thumb"><img src="${s.cover}" alt="${s.title}"></div>
          <div class="info">
            <div class="title">${s.title}</div>
            <div class="artist">${s.artist}</div>
          </div>
          <span class="duration">${Utils.formatTime(s.duration)}</span>
          ${active ? '<i class="fas fa-volume-low play-indicator"></i>' : ''}
        </div>`;
    }).join('');
    queueList.querySelectorAll('.track-item').forEach(item => {
      item.addEventListener('click', () => {
        Player.playQueue(Player.state.queue, Number(item.dataset.idx), true);
      });
    });
  }

  function seekFromEvent(e) {
    const rect = progressBar.getBoundingClientRect();
    let x = (e.clientX - rect.left) / rect.width;
    x = Math.min(Math.max(x, 0), 1);
    progressFill.style.width = `${x * 100}%`;
    const audio = Player.audio;
    const song = Player.currentSong();
    const duration = audio.duration || (song && song.duration) || 0;
    currentTimeSpan.textContent = Utils.formatTime(x * duration);
    return x;
  }

  progressBar.addEventListener('mousedown', (e) => { isDragging = true; seekFromEvent(e); });
  window.addEventListener('mousemove', (e) => { if (isDragging) seekFromEvent(e); });
  window.addEventListener('mouseup', (e) => {
    if (isDragging) { const pct = seekFromEvent(e); Player.seekPercent(pct); isDragging = false; }
  });
  progressBar.addEventListener('touchstart', (e) => { isDragging = true; seekFromEvent(e.touches[0]); });
  window.addEventListener('touchmove', (e) => { if (isDragging) seekFromEvent(e.touches[0]); });
  window.addEventListener('touchend', (e) => {
    if (isDragging) { const pct = seekFromEvent(e.changedTouches[0]); Player.seekPercent(pct); isDragging = false; }
  });

  playBtn.addEventListener('click', () => Player.toggle());
  prevBtn.addEventListener('click', () => Player.prev());
  nextBtn.addEventListener('click', () => Player.next(false));
  shuffleBtn.addEventListener('click', () => Player.toggleShuffle());
  repeatBtn.addEventListener('click', () => Player.cycleRepeat());
  favBtn.addEventListener('click', () => {
    const song = Player.currentSong();
    if (!song) return;
    const active = Store.toggleFavorite(song.id);
    favBtn.classList.toggle('active', active);
  });
  volumeSlider.addEventListener('input', (e) => Player.setVolume(Number(e.target.value)));
  volumeSlider.value = Store.getVolume();

  Player.onChange(render);
  render(Player.state, Player.currentSong(), Player.audio);
})();
