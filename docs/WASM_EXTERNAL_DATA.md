# WASM: Extern data (init.lua, data, mods, modules)

När **WASM_EXTERNAL_DATA=ON** packas inte `init.lua`, `data/`, `mods/` eller `modules/` in i bygget. De laddas istället från servern vid start via `manifest.json`. Då kan du:

- Bygga på GitHub utan att lägga privata filer i repot
- Deploya bygget en gång och uppdatera init.lua/data/mods/modules på servern utan ombyggnad

## Var körs bygget?

- **På din GitHub:** Om du pushar detta repo till **ditt eget** konto (fork eller nytt repo) körs **Build Browser**-workflowen på **din** GitHub. Du laddar ner artifact därifrån.
- **På officiella mehah/otclient:** Bygget körs på **deras** GitHub när de mergar till main. Då får du artifact från deras Actions.

För att använda extern data med **dina** privata filer: pusha denna kod till **ditt** repo, låt GitHub bygga, ladda ner artifact, och deploya tillsammans med din egen manifest.json + init.lua/data/mods/modules på din server.

## Bygg med extern data

### På GitHub (Actions)

Workflow **Build Browser** (`.github/workflows/build-browser.yml`) körs vid push/PR. Dockerfile.browser är satt med `-DWASM_EXTERNAL_DATA=ON`, så artifact blir en build **utan** inbakad data.

1. Pusha till ditt repo (eller öppna PR mot main).
2. Gå till **Actions** → **Build Browser** → senaste körning.
3. Ladda ner artifact **otclient-browser-&lt;sha&gt;**.
4. Packa upp → använd innehållet i `build-emscripten-web/` (otclient.html, otclient.js, otclient.wasm, etc.).

### Lokalt med Docker

```bash
cd /path/to/otclient
bash Dockerfile.browser.sh
```

Utdata i `build-emscripten-web/`.

## Generera manifest.json (lokalt, med dina filer)

På din dator där du har **dina** init.lua, data/, mods/, modules/ (inkl. privata):

```bash
cd C:\wasm\github\otclient
node browser/generate-manifest.js > manifest.json
```

Det skapar en `manifest.json` med alla filer under `data/`, `mods/`, `modules/` samt `init.lua`, `otclientrc.lua`, `config.ini` om de finns. Du kan ange andra mappar/filer:

```bash
node browser/generate-manifest.js data mods modules init.lua otclientrc.lua config.ini > manifest.json
```

## Deploy

1. **Byggfiler** (från GitHub artifact eller Docker): otclient.html, otclient.js, otclient.wasm, och övriga filer från `build-emscripten-web/`.
2. **Din privata data** (samma sökväg som otclient.html):
   - `manifest.json` (genererad ovan)
   - `init.lua`
   - `otclientrc.lua`, `config.ini` om du använder dem
   - Mapparna `data/`, `mods/`, `modules/` med alla filer som listas i manifest.json

Exempel: om otclient ligger på `https://xnovaot.se/otclient/otclient.html`, ska `manifest.json`, `init.lua`, `data/`, `mods/`, `modules/` finnas under `https://xnovaot.se/otclient/` (samma origin). Klienten laddar då dessa från servern vid start.

## Säkerhet

- init.lua och övriga filer serveras från **samma origin** som otclient.html (samma domän/sökväg). De exponeras inte i GitHub-repot.
- Skydda känsliga sökvägar med serverns behörigheter (t.ex. .htaccess eller serverconfig) om du vill begränsa vem som får ladda ner dem.
