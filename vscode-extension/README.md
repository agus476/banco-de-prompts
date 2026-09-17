# Extensión — Banco de prompts

Importa chats reales a tu bitácora desde:

- **Codex** → `%USERPROFILE%\.codex\sessions`
- **Visual Studio Code** (Copilot Chat) → `%APPDATA%\Code\User\workspaceStorage\*\chatSessions`
- **Cursor** → `%USERPROFILE%\.cursor\projects\*\agent-transcripts`

## Instalación fija (sin F5)

1. Empaquetar (si hace falta):

```bash
cd vscode-extension
npm run compile
npx @vscode/vsce package --no-dependencies --allow-missing-repository
```

2. En VS Code: Extensions → `…` → **Install from VSIX…**  
   Archivo: `banco-de-prompts-0.2.0.vsix`

3. Settings → `banco.apiUrl` = `http://localhost:3000` (o tu URL)

## Uso diario

1. App corriendo (`npm run dev`) o desplegada
2. En cualquier proyecto: `Ctrl+Shift+P`
3. **Banco: Importar chat de Codex** (o **Banco: Importar chat** y elegí la fuente)
4. Elegí chat → turnos → proyecto de bitácora

Si actualizás la extensión, reinstalá el `.vsix` nuevo (pisa la versión anterior).
