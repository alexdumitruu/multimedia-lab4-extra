document.addEventListener('DOMContentLoaded', () => {

    let allAlbums = [];
    let currentSort = 'default';
    let currentFilter = '';

    const albumGrid = document.getElementById('album-grid');
    const albumModal = document.getElementById('albumModal');
    const searchInput = document.getElementById('searchInput');
    const sortButtonGroup = document.querySelector('.btn-group');

    function init() {
        fetchAlbums();
        setupEventListeners();
    }

    async function fetchAlbums() {
        try {
            const response = await fetch('assets/data/library.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            allAlbums = await response.json();
            renderAlbums();
        } catch (error) {
            console.error("Could not fetch albums:", error);
            albumGrid.innerHTML = `<p class="text-danger">Error loading albums. Please check console.</p>`;
        }
    }

    function setupEventListeners() {
        searchInput.addEventListener('input', (e) => {
            currentFilter = e.target.value.toLowerCase();
            renderAlbums();
        });

        sortButtonGroup.addEventListener('click', (e) => {
            if (e.target.matches('[data-sort]')) {
                currentSort = e.target.getAttribute('data-sort');
                renderAlbums();
            }
        });

        albumModal.addEventListener('show.bs.modal', (event) => {
            const button = event.relatedTarget;
            const albumId = button.getAttribute('data-album-id');
            const album = allAlbums.find(a => a.id == albumId);

            if (album) {
                populateModal(album);
            }
        });
    }

    function renderAlbums() {
        let albumsToDisplay = [...allAlbums];

        if (currentFilter) {
            albumsToDisplay = albumsToDisplay.filter(album =>
                album.artist.toLowerCase().includes(currentFilter) ||
                album.album.toLowerCase().includes(currentFilter)
            );
        }

        if (currentSort === 'artist') {
            albumsToDisplay.sort((a, b) => a.artist.localeCompare(b.artist));
        } else if (currentSort === 'album') {
            albumsToDisplay.sort((a, b) => a.album.localeCompare(b.album));
        } else if (currentSort === 'tracks') {
            albumsToDisplay.sort((a, b) => a.tracklist.length - b.tracklist.length);
        }

        displayAlbums(albumsToDisplay);
    }

    function displayAlbums(albums) {
        albumGrid.innerHTML = '';
        if (albums.length === 0) {
            albumGrid.innerHTML = `<p class="text-center">No albums found matching your criteria.</p>`;
            return;
        }

        albums.forEach(album => {
            const cardHtml = `
                        <div class="col-xl-2 col-md-3 col-sm-6 col-12 mb-4 d-flex">
                            <div class="card shadow-sm">
                                <img src="assets/img/${album.thumbnail}" class="card-img-top" alt="${album.album} cover">
                                <div class="card-body">
                                    <h5 class="card-title">${album.artist}</h5>
                                    <p class="card-text">${album.album}</p>
                                </div>
                                <div class="card-footer">
                                    <button type="button" class="btn btn-primary w-100" data-bs-toggle="modal" 
                                            data-bs-target="#albumModal" data-album-id="${album.id}">
                                        View Tracklist
                                    </button>
                                </div>
                            </div>
                        </div>`;
            albumGrid.insertAdjacentHTML('beforeend', cardHtml);
        });
    }

    function populateModal(album) {
        const modalTitle = albumModal.querySelector('.modal-title');
        const modalBody = albumModal.querySelector('.modal-body');
        const spotifyBtn = albumModal.querySelector('#modal-spotify-btn');

        modalTitle.textContent = `${album.artist} - ${album.album}`;

        let totalTracks = album.tracklist.length;
        let totalDurationMs = 0;
        let longestTrack = { title: '', lengthMs: 0 };
        let shortestTrack = { title: 'N/A', lengthMs: Infinity };
        let tracklistHtml = '<ul class="list-group list-group-flush">';

        album.tracklist.forEach(track => {
            const durationMs = parseDuration(track.length);
            totalDurationMs += durationMs;

            if (durationMs > longestTrack.lengthMs) {
                longestTrack = { title: track.title, lengthMs: durationMs };
            }
            if (durationMs < shortestTrack.lengthMs) {
                shortestTrack = { title: track.title, lengthMs: durationMs };
            }

            tracklistHtml += `
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            <span>${track.number}. 
                                <a href="${track.url}" target="_blank" class="text-decoration-none">${track.title}</a>
                            </span>
                            <span class="badge bg-secondary rounded-pill">${track.length}</span>
                        </li>`;
        });

        tracklistHtml += '</ul>';

        const avgDurationMs = totalDurationMs / totalTracks;

        const statsHtml = `
                    <h6 class="border-bottom pb-2">Album Stats</h6>
                    <div class="row">
                        <div class="col-6"><strong>Total Tracks:</strong></div>
                        <div class="col-6">${totalTracks}</div>
                        <div class="col-6"><strong>Total Duration:</strong></div>
                        <div class="col-6">${formatDuration(totalDurationMs)}</div>
                        <div class="col-6"><strong>Average Track:</strong></div>
                        <div class="col-6">${formatDuration(avgDurationMs)}</div>
                        <div class="col-6"><strong>Longest Track:</strong></div>
                        <div class="col-6">${longestTrack.title} (${formatDuration(longestTrack.lengthMs)})</div>
                        <div class="col-6"><strong>Shortest Track:</strong></div>
                        <div class="col-6">${shortestTrack.title} (${formatDuration(shortestTrack.lengthMs)})</div>
                    </div>
                    <h6 class="mt-4 border-bottom pb-2">Tracklist</h6>
                `;

        modalBody.innerHTML = statsHtml + tracklistHtml;
        spotifyBtn.href = album.tracklist[0]?.url || '#';
    }

    function parseDuration(length) {
        const parts = length.split(':').map(Number);
        if (parts.length === 2) {
            return (parts[0] * 60 + parts[1]) * 1000;
        }
        return 0;
    }

    function formatDuration(ms) {
        if (isNaN(ms) || ms === 0) return '0:00';
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }

    init();
});