# Bygg otclient.data med dina filer

När du vill använda **dina egna** init.lua, data, mods, modules utan att ladda upp dem till GitHub:

1. **GitHub bygger** med standarddata – du kan ignorera artifact eller använda som backup.
2. **Lokalt med Docker** bygger du med dina filer – ~30 min första gången, ~2–5 min när bara data ändrats.

## Krav

- Docker
- Otclient-repot (C:\wasm\github\otclient) med **dina** init.lua, data, mods, modules (ersätt standardfilerna)

## Steg

1. Kopiera dina init.lua, data/, mods/, modules/ till repot (ersätt standardfilerna).
2. Kör:

```powershell
cd C:\wasm\github\otclient
.\browser\build-data-only.ps1 -SourceDir "C:\wasm\github\otclient"
```

**SourceDir** = sökväg till repot (med dina filer). Måste innehålla src/, cmake/, browser/, init.lua, data/, mods/, modules/.

## Utdata

- `build-emscripten-web/` med otclient.html, otclient.js, otclient.wasm, otclient.data
- otclient.data innehåller dina filer

Ladda upp hela mappen till servern.

## Tid

- **Första körningen:** ~15 min (bygga buildenv-image) + ~30 min (full build)
- **Senare körningar** (bara data ändrat): ~2–5 min
