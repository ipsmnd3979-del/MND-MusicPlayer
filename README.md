# noir  — Music Player App

A dark, glassmorphism-styled multi-page music player built with plain HTML5, CSS3 and ES6. No build step, no login, runs directly from XAMPP or any static web server.

## Project Structure

```
MusicPlayer/
├── index.html       Home (recently played, albums, artists, all songs)
├── search.html       Live search across songs/albums/artists
├── library.html      Favorites, playlists, recently played
├── player.html        Full-screen now playing + queue
├── album.html          Album detail page
├── artist.html         Artist detail page
│
├── css/
│   ├── style.css      Shared design system (cards, lists, mini player, nav)
│   ├── responsive.css Mobile breakpoints
│   └── player.css      Full-screen player specific styles
│
├── js/
│   ├── storage.js     localStorage: favorites, playlists, recents, player state
│   ├── player.js      Shared audio engine + mini player (mounted on every page)
│   ├── app.js         Home page logic
│   ├── search.js      Search page logic
│   ├── library.js     Library page (tabs, playlists CRUD)
│   ├── nowplaying.js  Full player page logic
│   ├── album.js        Album page logic
│   └── artist.js       Artist page logic
│
├── data/
│   ├── songs.json     Demo track library (12 tracks, royalty-free streaming audio)
│   ├── albums.json    5 demo albums
│   └── artists.json   5 demo artists
│
└── assets/covers/     Local cover art (logo.png, noir 2.jpg, noir 3.png)
```

## Notes

- Playback uses royalty-free [SoundHelix](https://www.soundhelix.com) demo tracks streamed over HTTPS — an internet connection is required to actually hear audio. Swap the `src` field in `data/songs.json` for local files under `assets/songs/` to go fully offline.
- Playback state (current queue, track, position, shuffle/repeat, volume) persists in `localStorage` and is restored across page navigations, so the mini player keeps its place as you move between Home, Search, Library and Now Playing.
- Favorites, playlists and recently played are all stored client-side in `localStorage` — no backend or login required.

## Running

Drop the `MusicPlayer` folder anywhere under your XAMPP `htdocs` and open `index.html` via `http://localhost/.../MusicPlayer/index.html`. Opening the file directly (`file://`) also works since everything is relative-path and fetch-based, as long as your browser allows local `fetch()` of JSON (most do when served via XAMPP).
