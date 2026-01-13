# Sidebar Legacy Cleanup Report

**Datum:** 2026-01-01
**Type:** Menu herstructurering en legacy labeling
**Impact:** Geen functionele wijzigingen, alleen zichtbaarheid en organisatie

---

## ✅ UITGEVOERD

### 1. Nieuwe Sidebar Structuur

De sidebar is gereorganiseerd met de volgende ACTIEVE secties:

#### **📦 Inventaris & Voorraad**
- Inventory Hub (NEW)
- Implantaten Voorraad
- Implantaten Gebruikt
- Biomaterialen Voorraad
- Biomaterialen Gebruikt
- Leveranciers

#### **🎫 Tickets & Orders**
- Bestellingen / Orders

#### **📁 LEGACY (verouderd)**
- Apparatuur Inventaris (oud) - LEGACY badge
- Onderhoud & Keuringen (oud) - LEGACY badge
- Storingen & Logboek (oud) - LEGACY badge
- Ticket Enquiry (placeholder) - LEGACY badge

### 2. Wijzigingen in Bestaande Secties

**CARE+ sectie:**
- Verwijderd: "Geplaatste Implantaten" (nu in Inventaris & Voorraad)
- Verwijderd: "Gebruikte Biomaterialen" (nu in Inventaris & Voorraad)

**Verwijderde secties:**
- Oude "Ticket+" sectie (vervangen door "Tickets & Orders")

### 3. Legacy Banners Toegevoegd

Alle legacy pagina's hebben nu een duidelijke banner met:
- Waarschuwing dat de module verouderd is
- Link(s) naar de vervangende module(s)
- Oranje accent voor zichtbaarheid

**Aangepaste pagina's:**
- `/src/pages/Inventaris.tsx` → wijst naar Inventory Hub
- `/src/pages/Onderhoud.tsx` → wijst naar Inventory Hub
- `/src/pages/Storingen.tsx` → wijst naar Orders
- `/src/pages/TicketEnquiry.tsx` → wijst naar Orders

### 4. Nieuwe Component

**LegacyBanner Component** (`/src/components/LegacyBanner.tsx`)
- Herbruikbare banner voor legacy pagina's
- Accepteert custom message en vervangings-links
- Consistent design met oranje accent

---

## 🚫 NIET UITGEVOERD

- ❌ Geen database wijzigingen
- ❌ Geen migraties
- ❌ Geen code verwijderd (alles blijft bereikbaar via directe URL)
- ❌ Geen nieuwe features toegevoegd
- ❌ Geen business-logica gewijzigd
- ❌ Geen nieuwe tabellen of data

---

## 🎯 RESULTAAT

### Sidebar zichtbaarheid:
1. **Inventaris & Voorraad** - volledig zichtbaar, moderne modules
2. **Tickets & Orders** - volledig zichtbaar, moderne modules
3. **LEGACY (verouderd)** - zichtbaar maar duidelijk gemarkeerd als oud

### Routes:
- Alle routes blijven bestaan en werkend
- Legacy routes zijn bereikbaar via directe URL
- Legacy routes tonen een banner met verwijzing naar nieuwe modules

### Gebruikerservaring:
- Duidelijke scheiding tussen actieve en verouderde modules
- Gebruikers worden automatisch doorverwezen naar moderne alternatieven
- Geen breaking changes voor bestaande workflows

---

## 📋 VERIFICATIE CHECKLIST

- [x] Sidebar toont "Inventaris & Voorraad" sectie
- [x] Sidebar toont "Tickets & Orders" sectie
- [x] Sidebar toont "LEGACY (verouderd)" sectie
- [x] Legacy items hebben LEGACY badges
- [x] Legacy pagina's tonen waarschuwingsbanner
- [x] Banner linkt naar correcte vervangende modules
- [x] Geen nieuwe files/tabellen/business-logica
- [x] Routes blijven werkend

---

## 🔜 TOEKOMSTIGE OPSCHONING (NIET NU)

Voor een latere fase:
- Legacy modules volledig verplaatsen naar apart submenu
- Mogelijke datamigratie equipment → assets
- Unified ticket UI consolidatie
- Verwijdering van legacy code na bevestigde adoptie

**Status:** Sidebar opgeschoond en legacy gelabeld zonder functionele wijzigingen.
