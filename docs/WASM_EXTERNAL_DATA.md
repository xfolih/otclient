# WASM: Extern data – GitHub bygger, du bygger .data lokalt

När **WASM_EXTERNAL_DATA=ON** packas inte `init.lua`, `data/`, `mods/` eller `modules/` in i bygget. Istället laddas **otclient.data** vid start via **otclient.data.loader.js**.

- **GitHub** bygger html, js, wasm (inga privata filer)
- **Du** bygger otclient.data + otclient.data.loader.js lokalt med dina filer
- **Deploy** – ladda upp bygget + din .data + .loader.js

## Steg 1: Ladda ner GitHub-build

1. Gå till **Actions** → **Build Browser** → senaste körning
2. Ladda ner artifact
3. Packa upp t.ex. till `C:\path\to\deploy\`

## Steg 2: Bygg otclient.data lokalt

Din mapp med init.lua, data/, mods/, modules/ (och ev. otclientrc.lua, config.ini):

```powershell
cd C:\wasm\github\otclient
.\browser\build-otclient-data.ps1 -SourceDir "C:\path\to\din\otclient\med\dina\filer"
```

Med egen output-mapp:

```powershell
.\browser\build-otclient-data.ps1 -SourceDir "C:\din\data" -OutputDir "C:\path\to\deploy"
```

Detta skapar **otclient.data** och **otclient.data.loader.js**.

## Steg 3: Deploy

Lägg i samma mapp som otclient.html:

- otclient.html, otclient.js, otclient.wasm (från GitHub)
- **otclient.data** (från ditt lokala bygge)
- **otclient.data.loader.js** (från ditt lokala bygge)

## Krav

- **Docker** (för build-otclient-data.ps1)
- Eller: emsdk med `file_packager.py` i PATH – scriptet kan anpassas

## Filordning

`otclient.data.loader.js` laddar innehållet i `otclient.data` innan spelet startar. Båda filerna måste finnas i samma mapp som `otclient.html`.
