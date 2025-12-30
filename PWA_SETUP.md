# PWA Setup Guide for KhataX

## Overview
KhataX has been configured as a Progressive Web App (PWA), allowing users to install it on their devices and use it offline.

## Features Implemented

### ✅ Core PWA Features
- **Web App Manifest** - Defines app metadata, icons, and display mode
- **Service Worker** - Enables offline functionality and caching
- **Install Prompt** - Shows install button on supported browsers
- **Offline Support** - Caches static assets for offline access

### 📱 Installation
Users can install KhataX as a PWA on:
- **Android**: Chrome, Edge, Samsung Internet
- **iOS**: Safari (iOS 16.4+)
- **Desktop**: Chrome, Edge, Firefox

## Setup Instructions

### 1. Create PWA Icons
You need to create two icon files in the `/public` folder:

- `icon-192x192.png` (192x192 pixels)
- `icon-512x512.png` (512x512 pixels)

**Quick Options:**
1. Use [PWA Builder Image Generator](https://www.pwabuilder.com/imageGenerator)
2. Use your existing logo and resize it
3. Create simple icons with "KX" or "KhataX" text

See `/public/icon-generator.md` for detailed instructions.

### 2. Test PWA Features

#### Development Mode
```bash
npm run dev
```

#### Production Build (Required for Full PWA)
```bash
npm run build
npm start
```

**Note**: Service Worker works best in production mode. For testing, you can use production build locally.

### 3. Testing Installation

1. **Build and start the app**:
   ```bash
   npm run build
   npm start
   ```

2. **Open in browser**: `http://localhost:3000`

3. **Test installation**:
   - **Chrome/Edge**: Look for install icon in address bar or use menu
   - **Android**: Tap menu (3 dots) → "Add to Home Screen"
   - **iOS Safari**: Tap Share → "Add to Home Screen"

4. **Test offline mode**:
   - Install the app
   - Open it
   - Turn off internet
   - App should still work with cached content

## PWA Components

### Service Worker (`/public/sw.js`)
- Caches static assets on install
- Implements network-first strategy
- Falls back to cache when offline
- Automatically updates when new version is available

### Install Prompt (`/components/pwa/install-prompt.tsx`)
- Shows install prompt on user dashboard
- Handles browser install events
- Provides fallback instructions for manual installation

### Manifest (`/public/manifest.json`)
- Defines app name, icons, theme colors
- Defines display mode (standalone)
- Includes app shortcuts

## Configuration Files

- `app/layout.tsx` - PWA meta tags and viewport settings
- `app/sw-register.tsx` - Service worker registration
- `next.config.ts` - Service worker headers configuration
- `public/manifest.json` - PWA manifest
- `public/sw.js` - Service worker script

## Browser Support

| Feature | Chrome | Edge | Firefox | Safari | iOS Safari |
|---------|--------|------|---------|--------|------------|
| Install | ✅ | ✅ | ✅ | ✅ | ✅ (16.4+) |
| Offline | ✅ | ✅ | ✅ | ✅ | ✅ |
| Service Worker | ✅ | ✅ | ✅ | ✅ | ✅ |

## Troubleshooting

### Service Worker Not Registering
- Ensure you're running production build (`npm run build && npm start`)
- Check browser console for errors
- Verify `/sw.js` is accessible at `http://localhost:3000/sw.js`

### Install Prompt Not Showing
- Check if app is already installed
- Verify manifest.json is accessible
- Check browser support for PWA
- Clear browser cache and try again

### Icons Not Showing
- Ensure icon files exist in `/public` folder
- Verify icon paths in `manifest.json`
- Check icon file sizes match manifest
- Clear browser cache

## Next Steps

1. ✅ Create and add PWA icons
2. ✅ Test installation on different devices
3. ✅ Test offline functionality
4. ✅ Customize manifest.json with your branding
5. ✅ Add more offline features as needed

## Resources

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)

