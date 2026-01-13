# UPT Learning System - AI voor Behandelcode Suggesties

## 📚 Overzicht

Het UPT Learning System is een intelligente module die **automatisch leert** welke UPT codes bij welke behandelingen horen. Dit maakt het maken van begrotingen veel sneller en nauwkeuriger!

## 🎯 Wat doet het?

### 1. **Automatisch Leren** 🧠
- Wanneer je een begroting opslaat, worden de behandeling + UPT codes vastgelegd
- Het systeem analyseert patronen: "Voor implantaat op element 46 worden meestal codes M46, J70, en E33 gebruikt"
- Hoe vaker een combinatie gebruikt wordt, hoe hoger de betrouwbaarheidsscore

### 2. **Intelligente Suggesties** ✨
- Bij nieuwe begrotingen krijg je automatisch UPT code suggesties
- Gebaseerd op vergelijkbare behandelingen die eerder zijn gemaakt
- Inclusief geschatte bedragen (honorarium, techniek, materiaal)

### 3. **Continue Verbetering** 📈
- Door feedback te geven wordt de AI steeds slimmer
- Automatische berekening van succespercentages
- Patronen met hoge betrouwbaarheid krijgen voorrang

## 🗄️ Database Structuur

### `upt_treatment_patterns`
Geleerde behandelpatronen met metadata:
- Pattern naam (bijv. "Implantologie - Implantaat plaatsing (1 tooth)")
- Categorie (Implantologie, Prothetiek, etc.)
- Element type (tooth, quadrant, jaw, full_mouth)
- Confidence score (0-100)
- Usage count
- Success rate
- Gemiddeld totaalbedrag

### `upt_treatment_pattern_codes`
UPT codes per patroon:
- Welke UPT code
- Aantal (meestal 1, soms meerdere)
- Is het verplicht?
- Frequency (hoe vaak wordt deze gebruikt in dit patroon)
- Typische bedragen per component

### `upt_learning_data`
Ruwe training data van echte begrotingen:
- Begroting ID (bron)
- Behandeling beschrijving
- Gebruikte elementen
- Gebruikte UPT codes met bedragen
- Was het goedgekeurd door patiënt?
- Optionele kwaliteitsbeoordeling

### `upt_prediction_feedback`
Feedback op voorspellingen:
- Werd de suggestie geaccepteerd?
- Werd het aangepast?
- Gebruikersbeoordeling (1-5 sterren)
- Opmerkingen voor verbetering

## 💻 Functionaliteit

### Learning Service (`uptLearningEngine.ts`)

#### Data Vastleggen
```typescript
await captureBegrotingForLearning({
  begroting_id: 'uuid',
  behandeling_description: 'Implantaat plaatsing element 46',
  categorie: 'Implantologie',
  elementen: ['46'],
  upt_codes_used: [
    { upt_code: 'M46', aantal: 1, honorarium: 1200, techniek: 0, materiaal: 150 }
  ],
  totaal_bedrag: 1350
});
```

Dit gebeurt automatisch bij het opslaan van een begroting!

#### UPT Code Voorspellingen
```typescript
const predictions = await predictUptCodes({
  categorie: 'Implantologie',
  behandeling_description: 'Implantaat plaatsing',
  elementen: ['46', '47']
});
```

Geeft top 3 matches met:
- Patroon naam
- Confidence score
- Voorgestelde UPT codes met bedragen
- Aantal vergelijkbare cases

#### Feedback Geven
```typescript
await submitPredictionFeedback(
  pattern_id,
  begroting_id,
  wasAccepted: true,
  wasModified: false,
  userRating: 5,
  feedbackNotes: 'Perfect! Exacte codes die ik nodig had'
);
```

### UI Components

#### 1. **UptCodePredictions Component**
Toont AI suggesties in de begroting composer:
- Meerdere voorspellingen met confidence scores
- Click "Gebruik deze" om codes toe te voegen
- Feedback formulier voor continue verbetering

#### 2. **UptLearningDashboard Page**
Management pagina voor geleerde patronen:
- Overzicht van alle patronen
- Statistieken (totaal patronen, gemiddelde betrouwbaarheid)
- Zoeken en filteren op categorie
- Detailweergave van patronen met UPT codes

## 🚀 Hoe te gebruiken

### Voor Behandelaars

1. **Maak een begroting zoals gewoonlijk**
   - Open Begrotingen 2.0
   - Voer behandeling en elementen in

2. **Bekijk AI suggesties** (als beschikbaar)
   - Systeem toont automatisch voorspellingen
   - Bekijk confidence score en vergelijkbare cases
   - Click "Gebruik deze" om codes toe te passen

3. **Geef feedback** (optioneel maar waardevol!)
   - Was de suggestie perfect? → "Perfect gebruikt"
   - Moest je iets aanpassen? → "Aangepast"
   - Geef sterren en opmerkingen

4. **Het systeem leert automatisch**
   - Bij opslaan wordt alles vastgelegd
   - Patronen worden bijgewerkt
   - Volgende keer nog betere suggesties!

### Voor Managers

1. **Open UPT AI Learning Dashboard**
   - Zie hoeveel patronen zijn geleerd
   - Bekijk statistieken en trends
   - Analyseer welke behandelingen het meest voorkomen

2. **Review individuele patronen**
   - Click op patroon voor details
   - Zie welke UPT codes worden gebruikt
   - Check betrouwbaarheid en succespercentage

3. **Monitor kwaliteit**
   - Hoge confidence scores = betrouwbare patronen
   - Hoog succespercentage = nuttige suggesties
   - Veel usage = veelvoorkomende behandeling

## 🎓 Hoe de AI Leert

### Pattern Matching Algorithm

1. **Categorie Match** (20 punten)
   - Exacte match van behandelcategorie

2. **Beschrijving Similarity** (30 punten)
   - Vergelijkt woorden in behandeling beschrijving
   - "Implantaat plaatsing" matcht met "Implantaat + botaugmentatie"

3. **Element Count Similarity** (30 punten)
   - Vergelijkt aantal elementen
   - 1 element vs 2 elementen = goede match
   - 1 element vs 8 elementen = matige match

4. **Context Tags Match** (20 punten)
   - Extra tags zoals "met_botaugmentatie", "met_sinuslift"
   - Zorgt voor nog preciezere matches

**Totale Score** = Similarity (0-100) + Confidence Score (0-100)
- Patronen worden gesorteerd op gecombineerde score
- Top 3 worden getoond aan gebruiker

### Confidence Score Berekening

```
Confidence = 50 (basis)
           + (usage_count × 2)
           + (success_rate / 2)
```

Voorbeelden:
- Nieuw patroon: 50% (start waarde)
- Na 10x gebruik, 90% success: 50 + 20 + 45 = **115% (max 100)**
- Na 5x gebruik, 60% success: 50 + 10 + 30 = **90%**

## 📊 Statistieken & Monitoring

De learning engine houdt bij:
- **Total Patterns**: Aantal geleerde patronen
- **Total Learning Data**: Aantal begrotingen als training data
- **Average Confidence**: Gemiddelde betrouwbaarheid
- **Most Used Patterns**: Top 10 meest gebruikte patronen

## ⚙️ Technische Details

### Auto-Update Mechanisme

Bij feedback wordt `update_pattern_statistics()` functie aangeroepen:
```sql
UPDATE upt_treatment_patterns
SET
  usage_count = (SELECT COUNT(*) FROM feedback...),
  success_rate = (SELECT % accepted FROM feedback...),
  confidence_score = LEAST(100, 50 + usage_count*2 + success_rate/2)
WHERE id = pattern_id;
```

### Database Indexen

Geoptimaliseerd voor snelle queries:
- `idx_upt_patterns_categorie`: Zoek op categorie
- `idx_upt_patterns_confidence`: Sort op betrouwbaarheid
- `idx_upt_pattern_codes_upt_code`: Zoek patronen per UPT code

### Row Level Security

- Authenticated users: kunnen lezen en feedback geven
- System: kan automatisch learning data toevoegen
- Admin/Management: kan patronen beheren

## 🔮 Toekomst Uitbreidingen

Mogelijke verbeteringen:
1. **Seizoenspatronen**: Leren dat bepaalde behandelingen vaker voorkomen in bepaalde maanden
2. **Locatie-specifiek**: Verschillende patronen per locatie (Almelo vs Raalte)
3. **Behandelaar-specifiek**: Persoonlijke voorkeuren per behandelaar
4. **Bulk Training**: Import van oude begrotingen om sneller te leren
5. **AI Model Upgrading**: Van rule-based naar machine learning model

## 🎉 Voordelen

### Voor Behandelaars
- ⚡ **Sneller**: Geen handmatig zoeken naar UPT codes
- 🎯 **Nauwkeuriger**: Gebaseerd op echte data
- 📚 **Leren**: Zie hoe collega's soortgelijke behandelingen coderen

### Voor Praktijk
- 📊 **Consistentie**: Standaardisatie van codes
- 💰 **Minder fouten**: Vermindert codeerfouten
- 📈 **Inzicht**: Zie welke behandelingen het meest voorkomen

### Voor Patiënten
- ⏱️ **Snellere service**: Begrotingen worden sneller gemaakt
- 💯 **Hogere kwaliteit**: Minder fouten in prijsopgave
- 🤝 **Transparantie**: Consistent coderen betekent eerlijke prijzen

## 📝 Stappenplan Eerste Gebruik

### Week 1: Bootstrap Fase
1. Bestaande begrotingen blijven werken zoals altijd
2. Systeem begint automatisch te leren van nieuwe begrotingen
3. Nog geen suggesties (te weinig data)

### Week 2-4: Learning Fase
1. Eerste patronen worden herkend
2. Begin met suggesties voor veelvoorkomende behandelingen
3. Confidence scores stijgen geleidelijk

### Week 5+: Productie Fase
1. AI geeft betrouwbare suggesties voor meeste behandelingen
2. Gebruikers geven feedback
3. Continue verbetering!

## 🛠️ Troubleshooting

### "Geen suggesties beschikbaar"
- **Normaal** voor nieuwe/zeldzame behandelingen
- Systeem moet eerst voorbeelden zien
- Maak de begroting handmatig, systeem leert ervan

### "Lage betrouwbaarheid"
- Patroon is nog nieuw (weinig voorbeelden)
- Behandeling varieert veel per case
- Gebruik suggestie als basis, pas aan indien nodig

### "Suggestie past niet helemaal"
- Geef feedback "Aangepast"
- Voeg opmerkingen toe
- Helpt AI om te leren wanneer wel/niet toepasbaar

---

**Status**: ✅ Productie Klaar
**Versie**: 1.0
**Laatste Update**: 4 december 2025
