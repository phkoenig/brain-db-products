-- Material Categories Database Setup
-- Führe dieses Skript in der Supabase SQL Editor aus

-- 1. Erstelle Tabelle für Material-Kategorien
CREATE TABLE IF NOT EXISTS material_categories (
  id TEXT PRIMARY KEY,
  main_category TEXT NOT NULL,
  sub_category TEXT NOT NULL,
  label TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Erstelle Index für bessere Performance
CREATE INDEX IF NOT EXISTS idx_material_categories_main ON material_categories(main_category);
CREATE INDEX IF NOT EXISTS idx_material_categories_sub ON material_categories(sub_category);

-- 3. Lösche bestehende Daten (falls vorhanden)
DELETE FROM material_categories;

-- 4. Füge Material-Kategorien aus der Hierarchie ein
INSERT INTO material_categories (id, main_category, sub_category, label) VALUES
-- Fußbodenbeläge (FB)
('FB.FL', 'Fußbodenbeläge', 'Fliesen', 'Fliesen'),
('FB.TE', 'Fußbodenbeläge', 'Teppiche', 'Teppiche'),
('FB.GU', 'Fußbodenbeläge', 'Gussböden', 'Gussböden'),
('FB.NS', 'Fußbodenbeläge', 'Naturstein', 'Naturstein'),
('FB.PA', 'Fußbodenbeläge', 'Parkett', 'Parkett'),
('FB.LA', 'Fußbodenbeläge', 'Laminat', 'Laminat'),

-- Wandbeläge (WB)
('WB.FL', 'Wandbeläge', 'Fliesen', 'Fliesen'),
('WB.PU', 'Wandbeläge', 'Putzsysteme', 'Putzsysteme'),
('WB.PV', 'Wandbeläge', 'Paneele & Verkleidungen', 'Paneele & Verkleidungen'),
('WB.TA', 'Wandbeläge', 'Tapeten', 'Tapeten'),
('WB.AN', 'Wandbeläge', 'Anstriche', 'Anstriche'),

-- Deckenverkleidungen (DV)
('DV.AD', 'Deckenverkleidungen', 'Abgehängte Decken', 'Abgehängte Decken'),
('DV.HV', 'Deckenverkleidungen', 'Holzverkleidungen', 'Holzverkleidungen'),
('DV.PA', 'Deckenverkleidungen', 'Putz & Anstrich', 'Putz & Anstrich'),

-- Sanitärobjekte (SA)
('SA.AR', 'Sanitärobjekte', 'Armaturen', 'Armaturen'),
('SA.WC', 'Sanitärobjekte', 'WC', 'WC'),
('SA.BW', 'Sanitärobjekte', 'Badewannen', 'Badewannen'),
('SA.WB', 'Sanitärobjekte', 'Waschbecken', 'Waschbecken'),
('SA.DU', 'Sanitärobjekte', 'Duschen', 'Duschen'),
('SA.WE', 'Sanitärobjekte', 'Weitere', 'Weitere'),

-- Möbel (MO)
('MO.ES', 'Möbel', 'Esstische', 'Esstische'),
('MO.ST', 'Möbel', 'Stühle', 'Stühle'),
('MO.BE', 'Möbel', 'Betten', 'Betten'),
('MO.SO', 'Möbel', 'Sofas & Sessel', 'Sofas & Sessel'),
('MO.RE', 'Möbel', 'Regalsysteme', 'Regalsysteme'),
('MO.WE', 'Möbel', 'Weitere', 'Weitere'),

-- Küchengeräte (KG)
('KG.BA', 'Küchengeräte', 'Backöfen', 'Backöfen'),
('KG.KO', 'Küchengeräte', 'Kochfelder', 'Kochfelder'),
('KG.KH', 'Küchengeräte', 'Kühlschränke', 'Kühlschränke'),
('KG.WK', 'Küchengeräte', 'Weinkühlschränke', 'Weinkühlschränke'),
('KG.KM', 'Küchengeräte', 'Kaffeemaschinen', 'Kaffeemaschinen'),
('KG.WE', 'Küchengeräte', 'Weitere', 'Weitere'),

-- Leuchten (LE)
('LE.DE', 'Leuchten', 'Deckenleuchten', 'Deckenleuchten'),
('LE.WA', 'Leuchten', 'Wandleuchten', 'Wandleuchten'),
('LE.ST', 'Leuchten', 'Steh- & Tischleuchten', 'Steh- & Tischleuchten'),

-- Türen & Fenster (TF)
('TF.TU', 'Türen & Fenster', 'Türen', 'Türen'),
('TF.FE', 'Türen & Fenster', 'Fenster', 'Fenster'),
('TF.BE', 'Türen & Fenster', 'Beschläge', 'Beschläge'),

-- Haustechnik (HT)
('HT.HE', 'Haustechnik', 'Heizung', 'Heizung'),
('HT.LU', 'Haustechnik', 'Lüftung', 'Lüftung'),
('HT.EL', 'Haustechnik', 'Elektro', 'Elektro'),

-- Fassadenmaterialien (FA)
('FA.PU', 'Fassadenmaterialien', 'Putz', 'Putz'),
('FA.VE', 'Fassadenmaterialien', 'Verkleidung', 'Verkleidung'),

-- Dämmstoffe (DS)
('DS.MI', 'Dämmstoffe', 'Mineralisch', 'Mineralisch'),
('DS.NA', 'Dämmstoffe', 'Natur', 'Natur'),
('DS.SY', 'Dämmstoffe', 'Synthetisch', 'Synthetisch'),

-- Gartenelemente (GA)
('GA.BE', 'Gartenelemente', 'Beläge', 'Beläge'),
('GA.BG', 'Gartenelemente', 'Begrünung', 'Begrünung'),
('GA.BA', 'Gartenelemente', 'Bauwerke', 'Bauwerke');

-- 5. Erstelle RLS (Row Level Security) Policies
ALTER TABLE material_categories ENABLE ROW LEVEL SECURITY;

-- Erlaube Lese-Zugriff für alle authentifizierten Benutzer
CREATE POLICY "Allow read access for authenticated users" ON material_categories
  FOR SELECT USING (auth.role() = 'authenticated');

-- Erlaube Schreib-Zugriff für authentifizierte Benutzer (für Admin-Funktionen)
CREATE POLICY "Allow write access for authenticated users" ON material_categories
  FOR ALL USING (auth.role() = 'authenticated');

-- 6. Erstelle Trigger für updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_material_categories_updated_at 
    BEFORE UPDATE ON material_categories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 