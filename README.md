# HearYourAlbum

HearYourAlbum is a retro-themed front-end web application designed to help musicians, producers, and audiophiles test out album track sequencing. Built with a nostalgic Windows 95 aesthetic, this tool lets you upload your audio files locally, visualize their waveforms, and drag-and-drop them to find the perfect album flow.

## Features

* **Drag-and-Drop Sequencing:** Easily rearrange your tracklist by clicking and dragging track boxes.

* **In-Browser Audio Playback:** Upload `.mp3` files directly into the browser.

* **Waveform Visualization:** See your music come to life with dynamic waveforms powered by WaveSurfer.js.

* **Smart Playback:** Automatically pauses other tracks when a new one is played, ensuring you only hear one song at a time.

* **Retro UI:** A meticulously crafted Windows 95 interface, complete with 3D borders, classic teal desktop backgrounds, and system toolbars.

* **Privacy First:** 100% front-end. Your audio files never leave your browser or get uploaded to any external server.

## Tech Stack

* **HTML5:** Semantic structure and HTML `<template>` tags for dynamic element creation.

* **Vanilla JavaScript:** No heavy frameworks, just pure, lightweight DOM manipulation and event handling.

* **CSS & Tailwind CSS:** Custom CSS for the pixel-perfect Win95 UI, combined with Tailwind CSS (via CDN) for rapid layout structuring.

* **WaveSurfer.js:** Used for rendering responsive audio waveforms.

## How to Use

Since this is a completely front-end application, there is no build step or backend server required.

1. Clone or download this repository to your local machine.

2. Ensure you have the three main files in the same directory:

   * `index.html`

   * `style.css`

   * `script.js`

3. Open `index.html` in any modern web browser (Chrome, Firefox, Safari, Edge).

## Notes

* The application currently supports up to 99 track boxes.

* For the best visual experience, keep the browser window maximized to enjoy the full desktop illusion.
