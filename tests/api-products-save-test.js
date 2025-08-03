/**
 * API Products Save Test
 * 
 * Testet die neue `/api/products/save` Route für:
 * - Spaltenweise Speicherung nach KI-Analyse
 * - On-Blur Updates bei User-Änderungen
 * - Inkrementelle Updates ohne kompletten Record-Overwrite
 */

const fetch = require('node-fetch');

// API Base URL (lokal)
const API_BASE = 'http://localhost:3000/api';

// Test-Daten für verschiedene Szenarien
const testScenarios = {
  // Neues Produkt erstellen
  createNew: {
    data: {
      produkt_kategorie: ['Test-Kategorie'],
      produkt_hersteller: 'Test-Hersteller',
      produkt_name_modell: 'Test-Produkt',
      source_type: 'reseller',
      source_url: 'https://test-url.de'
    },
    updateType: 'create',
    expectedOperation: 'create'
  },

  // Spaltenweise Update - PRODUKT
  columnUpdateProdukt: {
    productId: null, // Wird nach createNew gesetzt
    data: {
      produkt_kategorie: ['Dämmstoffe', 'Mineralwolle'],
      produkt_hersteller: 'Knauf Insulation',
      produkt_name_modell: 'Knauf Dämmplatte TC-040',
      produkt_produktlinie_serie: 'Thermo Comfort',
      produkt_code_id: 'TC-040',
      produkt_anwendungsbereich: 'Außendämmung',
      produkt_beschreibung: 'Hochwertige Dämmplatte aus Mineralwolle'
    },
    updateType: 'column_analysis',
    column: 'produkt',
    expectedOperation: 'update'
  },

  // Spaltenweise Update - PARAMETER
  columnUpdateParameter: {
    productId: null, // Wird nach createNew gesetzt
    data: {
      parameter_masse: '1200x600x40 mm',
      parameter_farbe: 'Grau',
      parameter_hauptmaterial: 'Mineralwolle',
      parameter_waermeleitfaehigkeit: '0.040 W/mK',
      parameter_u_wert: '0.25 W/m²K'
    },
    updateType: 'column_analysis',
    column: 'parameter',
    expectedOperation: 'update'
  },

  // On-Blur Update (User-Änderung)
  onBlurUpdate: {
    productId: null, // Wird nach createNew gesetzt
    data: {
      erfahrung_bewertung: 'Ausgezeichnet - übertrifft Erwartungen',
      erfahrung_bemerkungen_notizen: 'Sehr zufrieden mit der Qualität',
      manual_reviewed: true
    },
    updateType: 'user_edit',
    expectedOperation: 'update'
  }
};

let createdProductId = null;

async function runAPITests() {
  console.log('🧪 Starte API Products Save Tests...\n');

  try {
    // Test 1: Neues Produkt erstellen
    await testCreateNewProduct();
    
    // Test 2: Spaltenweise Update - PRODUKT
    await testColumnUpdate('columnUpdateProdukt');
    
    // Test 3: Spaltenweise Update - PARAMETER
    await testColumnUpdate('columnUpdateParameter');
    
    // Test 4: On-Blur Update
    await testOnBlurUpdate();
    
    // Test 5: GET Request zum Verifizieren
    await testGetProduct();
    
    console.log('\n✅ Alle API Products Save Tests erfolgreich abgeschlossen!');
    
  } catch (error) {
    console.error('\n❌ Test fehlgeschlagen:', error.message);
    console.error('Stack:', error.stack);
  }
}

async function testCreateNewProduct() {
  console.log('🆕 Test 1: Neues Produkt erstellen...');
  
  const scenario = testScenarios.createNew;
  
  const response = await fetch(`${API_BASE}/products/save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(scenario)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const result = await response.json();
  
  if (!result.success) {
    throw new Error(`API Error: ${result.error}`);
  }

  if (result.operation !== scenario.expectedOperation) {
    throw new Error(`Expected operation '${scenario.expectedOperation}', got '${result.operation}'`);
  }

  createdProductId = result.productId;
  console.log(`✅ Neues Produkt erstellt: ${result.productId}`);
  console.log(`   Name: ${result.data.produkt_name_modell}`);
  console.log(`   Hersteller: ${result.data.produkt_hersteller}`);
  
  // Setze ProductId für nachfolgende Tests
  testScenarios.columnUpdateProdukt.productId = createdProductId;
  testScenarios.columnUpdateParameter.productId = createdProductId;
  testScenarios.onBlurUpdate.productId = createdProductId;
}

async function testColumnUpdate(scenarioKey) {
  console.log(`\n🔄 Test ${scenarioKey === 'columnUpdateProdukt' ? '2' : '3'}: Spaltenweise Update - ${scenarioKey === 'columnUpdateProdukt' ? 'PRODUKT' : 'PARAMETER'}...`);
  
  const scenario = testScenarios[scenarioKey];
  
  const response = await fetch(`${API_BASE}/products/save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(scenario)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const result = await response.json();
  
  if (!result.success) {
    throw new Error(`API Error: ${result.error}`);
  }

  if (result.operation !== scenario.expectedOperation) {
    throw new Error(`Expected operation '${scenario.expectedOperation}', got '${result.operation}'`);
  }

  console.log(`✅ Spaltenweise Update erfolgreich: ${scenario.column || 'unknown'}`);
  console.log(`   Updated fields: ${Object.keys(scenario.data).join(', ')}`);
  
  // Validiere, dass nur die Spalten-Felder aktualisiert wurden
  const updatedData = result.data;
  const expectedFields = Object.keys(scenario.data);
  
  console.log(`   Debug - Updated data:`, updatedData);
  console.log(`   Debug - Expected data:`, scenario.data);
  
  for (const field of expectedFields) {
    // Spezielle Behandlung für Arrays (werden als Arrays gespeichert)
    if (Array.isArray(scenario.data[field])) {
      console.log(`   Debug - Field ${field}: Expected [${scenario.data[field].join(',')}], Got [${updatedData[field]?.join(',') || 'null'}]`);
      if (!Array.isArray(updatedData[field]) || 
          updatedData[field].length !== scenario.data[field].length ||
          !scenario.data[field].every((item, index) => updatedData[field][index] === item)) {
        throw new Error(`Field ${field} not updated correctly. Expected: [${scenario.data[field].join(',')}], Got: [${updatedData[field]?.join(',') || 'null'}]`);
      }
    } else if (updatedData[field] !== scenario.data[field]) {
      console.log(`   Debug - Field ${field}: Expected "${scenario.data[field]}", Got "${updatedData[field]}"`);
      throw new Error(`Field ${field} not updated correctly. Expected: "${scenario.data[field]}", Got: "${updatedData[field]}"`);
    }
  }
  
  console.log(`   Validation: Alle ${expectedFields.length} Felder korrekt aktualisiert`);
}

async function testOnBlurUpdate() {
  console.log('\n✏️ Test 4: On-Blur Update (User-Änderung)...');
  
  const scenario = testScenarios.onBlurUpdate;
  
  const response = await fetch(`${API_BASE}/products/save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(scenario)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const result = await response.json();
  
  if (!result.success) {
    throw new Error(`API Error: ${result.error}`);
  }

  if (result.operation !== scenario.expectedOperation) {
    throw new Error(`Expected operation '${scenario.expectedOperation}', got '${result.operation}'`);
  }

  console.log(`✅ On-Blur Update erfolgreich`);
  console.log(`   Updated fields: ${Object.keys(scenario.data).join(', ')}`);
  console.log(`   Manual Reviewed: ${result.data.manual_reviewed}`);
  console.log(`   Bewertung: ${result.data.erfahrung_bewertung}`);
}

async function testGetProduct() {
  console.log('\n📖 Test 5: GET Request zum Verifizieren...');
  
  const response = await fetch(`${API_BASE}/products/save?id=${createdProductId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const result = await response.json();
  
  if (!result.success) {
    throw new Error(`API Error: ${result.error}`);
  }

  const product = result.data;
  
  console.log(`✅ GET Request erfolgreich`);
  console.log(`   Produkt: ${product.produkt_name_modell}`);
  console.log(`   Hersteller: ${product.produkt_hersteller}`);
  console.log(`   Wärmeleitfähigkeit: ${product.parameter_waermeleitfaehigkeit}`);
  console.log(`   Bewertung: ${product.erfahrung_bewertung}`);
  console.log(`   Manual Reviewed: ${product.manual_reviewed}`);
  
  // Validiere, dass alle Updates korrekt gespeichert wurden
  const validations = [
    { field: 'produkt_name_modell', expected: 'Knauf Dämmplatte TC-040' },
    { field: 'parameter_waermeleitfaehigkeit', expected: '0.040 W/mK' },
    { field: 'erfahrung_bewertung', expected: 'Ausgezeichnet - übertrifft Erwartungen' },
    { field: 'manual_reviewed', expected: true }
  ];
  
  for (const validation of validations) {
    if (product[validation.field] !== validation.expected) {
      throw new Error(`Validation failed for ${validation.field}: expected "${validation.expected}", got "${product[validation.field]}"`);
    }
  }
  
  console.log(`   Validation: Alle ${validations.length} Felder korrekt gespeichert`);
}

// Test ausführen
if (require.main === module) {
  console.log('⚠️  Hinweis: Stelle sicher, dass der Dev-Server läuft (npm run dev)');
  console.log('⚠️  API Base URL:', API_BASE);
  console.log('');
  
  runAPITests().catch(console.error);
}

module.exports = { runAPITests }; 