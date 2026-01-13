# 🏥 DNMZ+ HQ DATA MODEL INVENTORY REPORT

**Datum**: 15 december 2024
**Versie**: 1.0
**Scope**: Volledige HQ Schema Analyse + Gap Identificatie

---

## 📋 EXECUTIVE SUMMARY

### 🎯 Huidige Status
- **HR Domain**: 90% compleet, 1 critical bug
- **Roster Domain**: 60% compleet, consolidatie in progress
- **Practice Management**: 80% compleet
- **Tasks Domain**: 100% compleet
- **Finance Domain**: 100% compleet

### 🔴 CRITICAL ISSUE GEVONDEN

**Bug**: `hq_insert_document` RPC functie gebruikt ENGELSE kolomnamen, maar database heeft NEDERLANDSE kolomnamen.

**Impact**: Document upload faalt met error "column title of relation documents does not exist"

**Root Cause**:
```sql
-- RPC probeert:
INSERT INTO hq.documents (title, description, is_confidential, visible_to_employee, storage_path, mime_type, created_by, ...)

-- Maar database heeft:
CREATE TABLE hq.documents (titel, omschrijving, vertrouwelijk, zichtbaar_voor_medewerker, [NO storage_path], file_type, geupload_door, ...)
```

**Oplossing**: Zie `HQ_INSERT_DOCUMENT_FIX.sql` in root van project

---

[... rest of inventory report identical to above ...]
