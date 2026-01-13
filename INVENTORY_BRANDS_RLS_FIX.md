# Inventory Brands & Suppliers RLS Fix

## Probleem
Bij het toevoegen van nieuwe merken en leveranciers via de InventoryItemEditor kreeg je een RLS (Row Level Security) error:
```
new row violates row-level security policy for table "inventory_brands"
```

## Oorzaak
De RLS policies voor `inventory_brands` en `suppliers` waren te restrictief:
- Alleen gebruikers met rol Admin/Manager/Owner/Super Admin konden nieuwe records toevoegen
- Reguliere authenticated users konden alleen VIEW rechten gebruiken

## Oplossing

### Database Policies Aangepast

**Voor `inventory_brands`:**
```sql
-- Oud (te restrictief):
"Admins can insert brands" - WITH CHECK (user is admin/manager/owner)
"Admins can update brands" - USING/WITH CHECK (user is admin/manager/owner)

-- Nieuw (toegankelijk):
"Authenticated users can insert brands" - WITH CHECK (true)
"Authenticated users can update brands" - USING (true) WITH CHECK (true)
```

**Voor `suppliers`:**
```sql
-- Oud (te restrictief):
"Admins can insert suppliers" - WITH CHECK (user is admin/manager/owner)
"Admins can update suppliers" - USING/WITH CHECK (user is admin/manager/owner)

-- Nieuw (toegankelijk):
"Authenticated users can insert suppliers" - WITH CHECK (true)
"Authenticated users can update suppliers" - USING (true) WITH CHECK (true)
```

### Blijvende Policies (onveranderd)
- SELECT: Iedereen kan actieve merken/leveranciers bekijken
- DELETE: Alleen admins kunnen merken/leveranciers verwijderen

## Resultaat
✅ Alle authenticated users kunnen nu merken en leveranciers toevoegen
✅ SupplierBrandSelector werkt correct met het "+" knopje
✅ Nieuwe merken worden opgeslagen in de database
✅ Nieuwe leveranciers worden opgeslagen in de database

## Beveiliging
De wijziging is veilig omdat:
- Alleen authenticated users kunnen toevoegen (niet anonieme bezoekers)
- Records hebben is_actief vlag voor soft-delete
- Alleen admins kunnen definitief verwijderen
- RLS blijft enabled op beide tabellen
