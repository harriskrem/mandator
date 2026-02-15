# mandator

A privacy-centric file transfer web application using the WebRTC protocol (**WIP**). 

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

## Environment Variables

Create `.env` from `.env.example` and set:

- `VITE_SIGNAL_SERVER_URL`: public URL of the signal server (for example `https://backend.mandator.xyz`)
- `VITE_SHARE_BASE_URL`: public URL of the frontend (for example `https://mandator.xyz`)
- `VITE_TURN_USERNAME`, `VITE_TURN_CREDENTIAL`: TURN credentials (optional, but recommended for NAT traversal)
