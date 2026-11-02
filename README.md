# Genga Studio

A free 2D anime studio that runs in the browser. Open `index.html` in Chrome or Edge. There's nothing to install.

## Features

- **Rigging:** bones with FK and IK, pinned bones, smooth mesh binding, weight painting, keyframed mesh deform, image swaps and lip-sync from audio
- **Art import:** layered PSDs become rig parts, and the lasso cuts flat images into parts
- **Drawing:** frame-by-frame layers with a pressure-sensitive brush, fill, shapes and onion skin
- **Timeline:** keyframes, easing curves, cuts with transitions, and animating on ones, twos or threes
- **Camera:** pan, zoom, roll, shake and multiplane parallax
- **Effects:** impact frames, speed lines, petals, snow, rain, sparkles, light rays, bloom, colour fringe, colour grading, film grain and letterbox
- **Output:** MP4 export with sound, PNG stills, and project files that embed all images and audio

Press **Guide** in the app for the workflow and shortcuts.

## Development

The source is in `src/`. Run `python3 build.py` to combine it into `index.html`.

Fonts, the MP4 muxer and the PSD reader load from CDNs, so the app needs an internet connection.
