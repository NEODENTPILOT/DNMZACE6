# Opgelost: Conflict Popup Probleem

## Wat is er gedaan?

De volgende fixes zijn toegepast om de "overschrijven project" popup te voorkomen:

### 1. Vite Configuratie Verbeteringen
- **HMR timeout** verhoogd naar 30 seconden
- **File watching** geoptimaliseerd (geen polling)
- **Multiple connections** voorkomen via `host: true`
- **Chunk size warning** limiet verhoogd

### 2. Session Management
- **Unieke session IDs** per tab/browser session
- **Stale lock cleanup** bij opstarten (verwijdert locks ouder dan 5 minuten)
- **Tab visibility tracking** - pauzeert activiteit wanneer tab verborgen is
- **Automatic conflict cleanup** wanneer je terugkeert naar de tab

### 3. Storage Cleanup
- Automatisch verwijderen van oude `dnmz_lock_*` en `dnmz_editing_*` keys
- Cleanup van `conflict` en `dirty` markers bij tab focus

## Als je nog steeds de popup ziet:

### Optie 1: Browser Console (F12)
Voer dit uit in de browser console:

```javascript
// Clear all DNMZ locks and conflicts
Object.keys(localStorage).forEach(key => {
  if (key.startsWith('dnmz_') || key.includes('conflict') || key.includes('dirty')) {
    localStorage.removeItem(key);
    console.log('Removed:', key);
  }
});

// Clear session storage
sessionStorage.clear();

// Reload page
location.reload();
```

### Optie 2: Browser Developer Tools
1. Open Developer Tools (F12)
2. Ga naar "Application" of "Storage" tab
3. Klik op "Local Storage" en je domain
4. Delete alle keys die beginnen met `dnmz_`
5. Ververs de pagina

### Optie 3: Hard Refresh
- **Windows/Linux**: `Ctrl + Shift + R` of `Ctrl + F5`
- **Mac**: `Cmd + Shift + R`

### Optie 4: Private/Incognito Venster
Open de preview in een private/incognito venster voor een volledig schone state.

## Preventie Tips

1. **Sluit andere tabs** met dezelfde Bolt.new project
2. **Gebruik één browser** voor dit project tegelijkertijd
3. **Ververs niet te vaak** - geef de HMR tijd om updates door te voeren
4. **Check de console** voor debug informatie over session state

## Debug Info

Als je nog steeds problemen hebt, check de browser console voor:
- `[DNMZ] Session ID:` - moet uniek zijn per tab
- `[DNMZ] Removed stale lock:` - toont cleanup van oude locks
- `[DNMZ] Tab hidden/visible` - toont activity pausing

## Contact

Als dit niet helpt, deel dan:
1. De browser console output (alles met `[DNMZ]`)
2. Een screenshot van de popup
3. Welke browser en versie je gebruikt
