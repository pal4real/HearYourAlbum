/* ============================================================
   HearYourAlbum — script.js
   Vanilla JavaScript — no frameworks
   ============================================================ */

(() => {
  'use strict';

  // ── Constants ─────────────────────────────────────────────
  const MAX_BOXES = 99;

  // ── State ─────────────────────────────────────────────────
  let boxCount = 0;         // total ever added (used for unique IDs)
  let boxes = [];           // ordered array of box DOM elements

  // Tracks currently-playing WaveSurfer instance
  let currentlyPlaying = null;
  let currentlyPlayingBtn = null;

  // ── DOM refs ──────────────────────────────────────────────
  const container      = document.getElementById('boxes-container');
  const btnAdd         = document.getElementById('btn-add-box');
  const boxCountLabel  = document.getElementById('box-count-label');
  const emptyState     = document.getElementById('empty-state');
  const footerCount    = document.getElementById('footer-box-count');
  const footerPlaying  = document.getElementById('footer-playing');
  const statusBarTop   = document.getElementById('status-bar-top');
  const statusText     = document.getElementById('status-text');
  const template       = document.getElementById('track-box-template');

  // ── Helpers ───────────────────────────────────────────────

  function updateUI() {
    const count = boxes.length;

    boxCountLabel.textContent = `Boxes: ${count} / ${MAX_BOXES}`;
    footerCount.textContent   = `${count} track(s)`;

    btnAdd.disabled = count >= MAX_BOXES;
    btnAdd.style.opacity = count >= MAX_BOXES ? '0.5' : '1';
    btnAdd.title = count >= MAX_BOXES ? 'Maximum 99 boxes reached' : '';

    emptyState.classList.toggle('hidden', count > 0);

    // Re-number sequence labels
    boxes.forEach((box, i) => {
      const seqEl = box.querySelector('.seq-num');
      if (seqEl) seqEl.textContent = i + 1;
    });
  }

  function setStatus(msg, autoHide = true) {
    statusText.textContent = msg;
    statusBarTop.classList.remove('hidden');
    if (autoHide) {
      clearTimeout(setStatus._timer);
      setStatus._timer = setTimeout(() => {
        statusBarTop.classList.add('hidden');
      }, 3000);
    }
  }

  function setFooterPlaying(name) {
    footerPlaying.textContent = name ? `Playing: ${name}` : 'No track playing';
  }

  // ── Drag-and-Drop Reorder ─────────────────────────────────

  let dragSrcEl = null;

  function onDragStart(e) {
    dragSrcEl = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', ''); // required for Firefox
  }

  function onDragEnd() {
    this.classList.remove('dragging');
    // Clear all drag-over highlights
    document.querySelectorAll('.win95-track-box').forEach(el => {
      el.classList.remove('drag-over');
    });
    updateUI();
  }

  function onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (this === dragSrcEl) return;
    this.classList.add('drag-over');
  }

  function onDragLeave() {
    this.classList.remove('drag-over');
  }

  function onDrop(e) {
    e.stopPropagation();
    e.preventDefault();
    this.classList.remove('drag-over');

    if (dragSrcEl && dragSrcEl !== this) {
      const srcIdx  = boxes.indexOf(dragSrcEl);
      const destIdx = boxes.indexOf(this);

      if (srcIdx === -1 || destIdx === -1) return;

      // Swap the two entries in the array
      boxes[srcIdx]  = this;
      boxes[destIdx] = dragSrcEl;

      // Rebuild DOM order to match array order
      boxes.forEach(b => container.appendChild(b));
      updateUI();
      setStatus(`Track ${destIdx + 1} and Track ${srcIdx + 1} swapped.`);
    }
  }

  function attachDragListeners(box) {
    box.addEventListener('dragstart',  onDragStart);
    box.addEventListener('dragend',    onDragEnd);
    box.addEventListener('dragover',   onDragOver);
    box.addEventListener('dragleave',  onDragLeave);
    box.addEventListener('drop',       onDrop);
  }

  // ── Box Creation ──────────────────────────────────────────

  function createBox() {
    if (boxes.length >= MAX_BOXES) return;

    boxCount++;
    const id = `track-box-${boxCount}`;

    // Clone template
    const clone = template.content.cloneNode(true);
    const box = clone.querySelector('.win95-track-box');
    box.dataset.id = id;

    // ── Upload area ───────────────────────────────────────
    const uploadArea  = box.querySelector('.upload-area');
    const fileInput   = box.querySelector('.file-input');
    const playerArea  = box.querySelector('.player-area');
    const trackName   = box.querySelector('.track-name');
    const waveformDiv = box.querySelector('.waveform');
    const btnPlay     = box.querySelector('.btn-play-pause');
    const btnRemove   = box.querySelector('.btn-remove-box');

    let wavesurfer = null;
    let currentFile = null;

    // Click upload area → trigger file input
    uploadArea.addEventListener('click', () => fileInput.click());

    // Drag-over file into upload area (visual feedback)
    // Guard: if a box reorder drag is in progress, don't interfere
    uploadArea.addEventListener('dragover', (e) => {
      if (dragSrcEl) return; // box reorder drag — let the box handle it
      e.preventDefault();
      e.stopPropagation();
      uploadArea.style.backgroundColor = '#d4d0c8';
    });
    uploadArea.addEventListener('dragleave', () => {
      uploadArea.style.backgroundColor = '';
    });
    uploadArea.addEventListener('drop', (e) => {
      if (dragSrcEl) return; // box reorder drag — let the box handle it
      e.preventDefault();
      e.stopPropagation();
      uploadArea.style.backgroundColor = '';
      const file = e.dataTransfer.files[0];
      if (file) handleFileLoad(file);
    });

    // File selected via input
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) handleFileLoad(file);
    });

    function handleFileLoad(file) {
      // Validate MP3
      if (!file.type.includes('audio/mpeg') && !file.name.toLowerCase().endsWith('.mp3')) {
        setStatus('⚠ Only MP3 files are supported. Please choose an .mp3 file.');
        return;
      }

      currentFile = file;
      const url = URL.createObjectURL(file);

      // Stop & destroy old instance if re-uploading
      if (wavesurfer) {
        if (currentlyPlaying === wavesurfer) {
          wavesurfer.stop();
          currentlyPlaying = null;
          currentlyPlayingBtn = null;
          setFooterPlaying(null);
        }
        wavesurfer.destroy();
        wavesurfer = null;
        // Reset waveform div (WaveSurfer leaves canvas children)
        waveformDiv.innerHTML = '';
      }

      // Show player, hide upload area
      uploadArea.classList.add('hidden');
      playerArea.classList.remove('hidden');

      // Sanitize display name
      const displayName = file.name.replace(/\.mp3$/i, '');
      trackName.textContent = displayName;

      // Disable play while loading
      btnPlay.disabled = true;
      btnPlay.textContent = '⏳ Loading…';

      // Create WaveSurfer instance
      wavesurfer = WaveSurfer.create({
        container:     waveformDiv,
        waveColor:     '#00ff00',
        progressColor: '#007700',
        cursorColor:   '#ffffff',
        height:        52,
        barWidth:      2,
        barGap:        1,
        barRadius:     2,
        normalize:     true,
        url:           url,
      });

      wavesurfer.on('ready', () => {
        btnPlay.disabled = false;
        btnPlay.textContent = '▶ Play';
        setStatus(`✔ "${displayName}" loaded successfully.`);
      });

      wavesurfer.on('play', () => {
        // Pause any other playing instance
        if (currentlyPlaying && currentlyPlaying !== wavesurfer) {
          currentlyPlaying.pause();
          if (currentlyPlayingBtn) {
            currentlyPlayingBtn.textContent = '▶ Play';
            currentlyPlayingBtn.classList.remove('active');
          }
        }
        currentlyPlaying    = wavesurfer;
        currentlyPlayingBtn = btnPlay;
        btnPlay.textContent = '⏸ Pause';
        btnPlay.classList.add('active');
        setFooterPlaying(displayName);
      });

      wavesurfer.on('pause', () => {
        btnPlay.textContent = '▶ Play';
        btnPlay.classList.remove('active');
        if (currentlyPlaying === wavesurfer) {
          setFooterPlaying(null);
        }
      });

      wavesurfer.on('finish', () => {
        btnPlay.textContent = '▶ Play';
        btnPlay.classList.remove('active');
        currentlyPlaying    = null;
        currentlyPlayingBtn = null;
        setFooterPlaying(null);
      });

      wavesurfer.on('error', (err) => {
        console.error('WaveSurfer error:', err);
        setStatus('⚠ Error loading audio. Please try another file.');
        btnPlay.disabled = true;
        btnPlay.textContent = '⚠ Error';
      });
    }

    // Play / Pause button
    btnPlay.addEventListener('click', () => {
      if (!wavesurfer) return;
      wavesurfer.playPause();
    });

    // Re-upload: clicking the track name area cycles back to upload
    trackName.title = 'Click to re-upload';
    trackName.style.cursor = 'pointer';
    trackName.addEventListener('click', () => {
      // Show upload area again; keep player hidden
      if (wavesurfer) {
        if (currentlyPlaying === wavesurfer) {
          wavesurfer.stop();
          currentlyPlaying    = null;
          currentlyPlayingBtn = null;
          setFooterPlaying(null);
        }
        wavesurfer.destroy();
        wavesurfer = null;
        waveformDiv.innerHTML = '';
      }
      playerArea.classList.add('hidden');
      uploadArea.classList.remove('hidden');
      fileInput.value = '';
      setStatus('Upload cleared. You can upload a new MP3.');
    });

    // Remove box
    btnRemove.addEventListener('click', () => {
      // Stop audio if this box is playing
      if (wavesurfer) {
        if (currentlyPlaying === wavesurfer) {
          wavesurfer.stop();
          currentlyPlaying    = null;
          currentlyPlayingBtn = null;
          setFooterPlaying(null);
        }
        wavesurfer.destroy();
        wavesurfer = null;
      }

      const idx = boxes.indexOf(box);
      if (idx !== -1) boxes.splice(idx, 1);
      container.removeChild(box);
      updateUI();
      setStatus(`Track removed. ${boxes.length} track(s) remaining.`);
    });

    // Attach drag-and-drop
    attachDragListeners(box);

    // Add to DOM & state
    container.appendChild(box);
    boxes.push(box);
    updateUI();
    setStatus(`Track #${boxes.length} added.`);
  }

  // ── Event: Add Box button ─────────────────────────────────
  btnAdd.addEventListener('click', createBox);

  // ── Init ──────────────────────────────────────────────────
  updateUI();

})();
