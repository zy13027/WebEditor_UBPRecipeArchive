# Pallet Pattern Editor

Web-based pallet pattern editor that communicates with a SIMATIC S7 PLC (or PLCSIM Advanced) at `192.168.0.10` via the SIMATIC S7 WebServer API.

## PLC / PLCSIM-Advanced Setup

Before running the editor, ensure your PLC or PLCSIM Advanced instance is configured correctly:

1. **Reachability**: The PLC must be reachable at `192.168.0.10` from your development machine. Verify with:
   ```bash
   ping 192.168.0.10
   ```

2. **Web Server**: In TIA Portal, enable the **Web Server** and **Web API** for the PLC project:
   - Open the PLC device properties
   - Enable "Web server" and "Web API" features

3. **User Credentials**: Create a user (e.g. `Admin` / `12345678`) in the PLC web server configuration. The app uses these defaults; change them in `src/services/auth.services.ts` if needed.

4. **Browser Access**: Open `https://192.168.0.10` in a browser and accept the self-signed certificate. This helps avoid TLS warnings when the editor connects.

5. **Data Block**: The PLC program must define a data block `DB_WebPalletEditor` with the structure expected by the editor (header, boxes array, command flags). See `src/services/pallet-editor.services.ts` for the PLC path mappings.

## Development

```bash
npm install
npm run dev
```

The app runs at `http://localhost:5173`. In development, a Vite proxy forwards `/api` requests to the PLC to avoid CORS. Set `VITE_PLC_TARGET` to a different IP if needed:
```bash
VITE_PLC_TARGET=192.168.8.10 npm run dev
```

## Build and Deploy

```bash
npm run build
```

Output goes to `dist/palletEditor/`. Deploy this folder to your PLC web server or any static host.

## Manual Testing with PLCSIM-Advanced

1. Start PLCSIM Advanced and load your TIA Portal project.
2. Run the PLC (ensure `DB_WebPalletEditor` is present and the Web API is enabled).
3. Run `npm run dev` and open `http://localhost:5173`.
4. **Connect**: The status bar should show "Connected" after login.
5. **Load**: Click "Load" to read the current pattern from the PLC.
6. **Edit**: Move, rotate, add, or delete boxes. Status shows "Unsaved".
7. **Save**: Click "Save" to write the pattern to the PLC. Status should show "Saved".
8. **Error cases**: Stop the PLC or use a wrong IP to verify error messages appear in the status line.
