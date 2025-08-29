const fs = require('fs');
const path = require('path');

console.log('🔧 Test: .env.local Datei auslesen');
console.log('=====================================');

// Verschiedene Pfade testen
const possiblePaths = [
  '.env.local',
  path.resolve(__dirname, '../.env.local'),
  path.resolve(__dirname, '../../.env.local'),
  path.resolve(__dirname, '../../../.env.local'),
  path.resolve(__dirname, '../../../../.env.local'),
  path.resolve(__dirname, '../../../../../.env.local'),
  path.resolve(__dirname, '../../../../../../.env.local')
];

console.log('📁 Aktuelles Verzeichnis:', process.cwd());
console.log('🔍 Suche .env.local Datei...\n');

let foundPath = null;
for (const envPath of possiblePaths) {
  console.log(`Prüfe: ${envPath}`);
  if (fs.existsSync(envPath)) {
    console.log(`✅ GEFUNDEN: ${envPath}`);
    foundPath = envPath;
    break;
  } else {
    console.log(`❌ Nicht gefunden`);
  }
}

if (foundPath) {
  console.log('\n📖 Lese .env.local Datei...');
  try {
    const envContent = fs.readFileSync(foundPath, 'utf8');
    console.log('✅ Datei erfolgreich gelesen!');
    console.log('\n📋 Inhalt der .env.local Datei:');
    console.log('=====================================');
    console.log(envContent);
    
    // Parse und zeige die wichtigsten Keys
    console.log('\n🔑 Wichtige Umgebungsvariablen:');
    console.log('=====================================');
    const lines = envContent.split('\n');
    lines.forEach(line => {
      if (line.trim() && !line.startsWith('#')) {
        const [key, value] = line.split('=');
        if (key && value) {
          const displayValue = key.includes('KEY') || key.includes('SECRET') 
            ? value.substring(0, 10) + '...' 
            : value;
          console.log(`${key.trim()}: ${displayValue}`);
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Fehler beim Lesen der Datei:', error.message);
  }
} else {
  console.log('\n❌ .env.local Datei nicht gefunden!');
  console.log('Mögliche Gründe:');
  console.log('- Datei existiert nicht');
  console.log('- Falscher Pfad');
  console.log('- Berechtigungsprobleme');
}

console.log('\n🏁 Test abgeschlossen');