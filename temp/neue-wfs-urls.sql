-- Neue WFS-URLs für Gebäudeumrisse pro Bundesland
-- Diese sollen in die wfs_streams Tabelle eingefügt werden

INSERT INTO wfs_streams (
  url, 
  land_name, 
  bundesland_oder_region, 
  anbieter, 
  inhalt, 
  service_title,
  ist_aktiv,
  inspire_konform,
  zuletzt_geprueft
) VALUES 
-- Baden-Württemberg
('https://www.geoportal-bw.de/geodienste/INSPIRE/Building?service=WFS&request=GetCapabilities', 
 'Deutschland', 'Baden-Württemberg', 'Geoportal Baden-Württemberg', 'INSPIRE Gebäude', 
 'INSPIRE Buildings Baden-Württemberg', true, true, NOW()),

-- Berlin  
('https://fbinter.stadt-berlin.de/fb/berlin/service.jsp?id=re_hausumringe@senstadt&type=WFS&themeType=spatial', 
 'Deutschland', 'Berlin', 'FIS-Broker Berlin', 'Hausumringe', 
 'Berlin Hausumringe WFS', true, false, NOW()),

-- Brandenburg
('https://geoportal.brandenburg.de/gs-json/xml?fileid=919ca8dc-a153-47e0-81f9-479dea978338', 
 'Deutschland', 'Brandenburg', 'Geoportal Brandenburg', 'Gebäude', 
 'Brandenburg Gebäude WFS', true, false, NOW()),

-- Bremen
('https://geodienste.bremen.de/wfs_alkis_hausumringe?REQUEST=GetCapabilities&SERVICE=WFS', 
 'Deutschland', 'Bremen', 'Geodienste Bremen', 'ALKIS Hausumringe', 
 'Bremen ALKIS Hausumringe WFS', true, false, NOW()),

-- Hamburg
('https://geoinfo.hamburg.de/INSPIRE/Buildings_WFS?service=WFS&request=GetCapabilities', 
 'Deutschland', 'Hamburg', 'Geoinfo Hamburg', 'INSPIRE Gebäude', 
 'Hamburg INSPIRE Buildings WFS', true, true, NOW()),

-- Hessen
('https://www.geoportal.hessen.de/mapbender/php/wfs.php?INSPIRE=1&FEATURETYPE_ID=5580&REQUEST=GetCapabilities&SERVICE=WFS', 
 'Deutschland', 'Hessen', 'Geoportal Hessen', 'INSPIRE Gebäude', 
 'Hessen INSPIRE Buildings WFS', true, true, NOW()),

-- Mecklenburg-Vorpommern
('https://www.geoportal-mv.de/inspire/buildings/wfs?service=WFS&request=GetCapabilities', 
 'Deutschland', 'Mecklenburg-Vorpommern', 'Geoportal MV', 'INSPIRE Gebäude', 
 'MV INSPIRE Buildings WFS', true, true, NOW()),

-- Niedersachsen (Verwaltungsgrenzen - nicht Gebäude, aber trotzdem wertvoll)
('https://opendata.lgln.niedersachsen.de/doorman/noauth/verwaltungsgrenzen_wfs?REQUEST=GetCapabilities&SERVICE=WFS', 
 'Deutschland', 'Niedersachsen', 'LGLN Niedersachsen', 'Verwaltungsgrenzen', 
 'Niedersachsen Verwaltungsgrenzen WFS', true, false, NOW()),

-- Nordrhein-Westfalen
('https://www.wfs.nrw.de/geobasis/wfs_nw_alkis_vereinfacht?REQUEST=GetCapabilities&SERVICE=WFS', 
 'Deutschland', 'Nordrhein-Westfalen', 'Geobasis NRW', 'ALKIS vereinfacht', 
 'NRW ALKIS vereinfacht WFS', true, false, NOW()),

-- Rheinland-Pfalz (Portal-Link - wird automatisch korrigiert)
('https://www.geoportal.rlp.de/spatial-objects/519?service=WFS&request=GetCapabilities', 
 'Deutschland', 'Rheinland-Pfalz', 'Geoportal RLP', 'Spatial Objects', 
 'RLP Spatial Objects WFS', true, false, NOW()),

-- Saarland
('https://geoportal.saarland.de/WFS_SA_BUILDINGS?service=WFS&request=GetCapabilities', 
 'Deutschland', 'Saarland', 'Geoportal Saarland', 'Gebäude', 
 'Saarland Buildings WFS', true, false, NOW()),

-- Sachsen-Anhalt (Portal-Link - wird automatisch korrigiert)
('https://metaver.de/trefferanzeige?docuuid=1C649F0E-5369-4E7C-A699-55577C2226BC', 
 'Deutschland', 'Sachsen-Anhalt', 'Metaver', 'Gebäudedaten', 
 'Sachsen-Anhalt Gebäude via Metaver', true, false, NOW())

ON CONFLICT (url) DO NOTHING;
