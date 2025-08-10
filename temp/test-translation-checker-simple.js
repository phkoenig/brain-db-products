/**
 * Simple Test Script for TranslationChecker Logic
 * Tests the core functionality without TypeScript dependencies
 */

// Mock fetch for testing
global.fetch = async (url, options) => {
  console.log(`🔍 Test: Mock fetch called for: ${url}`);
  
  // Simulate manifest response
  if (url.includes('/manifest')) {
    return {
      ok: true,
      json: async () => ({
        status: 'success',
        derivatives: [
          {
            outputType: 'svf2',
            urn: 'dXJuOmFkc2sud2lwcHJvZDpmcy5maWxlOnZmLlRFU1RfREVSSVZBVElWRV9VUk4=',
            status: 'success',
            children: [
              {
                outputType: 'svf2',
                urn: 'dXJuOmFkc2sud2lwcHJvZDpmcy5maWxlOnZmLlRFU1RfQ0hJTERfVVJO=',
                status: 'success'
              }
            ]
          },
          {
            outputType: 'thumbnail',
            urn: 'dXJuOmFkc2sud2lwcHJvZDpmcy5maWxlOnZmLlRFU1RfVEhVTUJOQUlMX1VSTg==',
            status: 'success'
          }
        ]
      })
    };
  }
  
  return {
    ok: false,
    status: 404,
    text: async () => 'Not found'
  };
};

// Test functions
function normalizeStatus(status) {
  switch (status?.toLowerCase()) {
    case 'success': return 'success';
    case 'pending': return 'pending';
    case 'failed': return 'failed';
    case 'not_found': return 'not_found';
    default: return 'unknown';
  }
}

function normalizeDerivativeStatus(status) {
  switch (status?.toLowerCase()) {
    case 'success': return 'success';
    case 'pending': return 'pending';
    case 'failed': return 'failed';
    default: return 'unknown';
  }
}

function extractDerivativesFromManifest(manifestData) {
  const derivatives = [];
  
  console.log(`🔍 Test: Extracting derivatives from manifest...`);
  
  if (manifestData.derivatives && Array.isArray(manifestData.derivatives)) {
    for (const derivative of manifestData.derivatives) {
      console.log(`🔍 Test: Processing derivative:`, derivative);
      
      if (derivative.outputType && derivative.urn) {
        derivatives.push({
          urn: derivative.urn,
          type: derivative.outputType,
          status: normalizeDerivativeStatus(derivative.status || 'unknown'),
          progress: derivative.progress
        });
      }
      
      // Check for nested derivatives
      if (derivative.children && Array.isArray(derivative.children)) {
        for (const child of derivative.children) {
          if (child.outputType && child.urn) {
            derivatives.push({
              urn: child.urn,
              type: child.outputType,
              status: normalizeDerivativeStatus(child.status || 'unknown'),
              progress: child.progress
            });
          }
        }
      }
    }
  }
  
  console.log(`🔍 Test: Extracted ${derivatives.length} derivatives`);
  return derivatives;
}

function findBestViewingDerivative(derivatives) {
  console.log(`🔍 Test: Finding best viewing derivative from ${derivatives.length} options`);
  
  const priorityOrder = ['svf2', 'svf', 'f2d', 'thumbnail', 'pdf'];
  
  // First, try to find by priority order
  for (const priorityType of priorityOrder) {
    const derivative = derivatives.find(d => 
      d.type.toLowerCase() === priorityType && 
      d.status === 'success'
    );
    
    if (derivative) {
      console.log(`🔍 Test: Found priority derivative: ${derivative.type}`);
      return derivative;
    }
  }
  
  // If no success status found, return the first available derivative
  if (derivatives.length > 0) {
    console.log(`🔍 Test: No success derivative found, using first available: ${derivatives[0].type}`);
    return derivatives[0];
  }
  
  return null;
}

function generatePossibleTranslatedUrns(originalUrn) {
  const possibleUrns = [];
  
  try {
    // Decode the original URN to work with it
    const decodedUrn = Buffer.from(originalUrn, 'base64').toString();
    console.log(`🔍 Test: Decoded original URN: ${decodedUrn}`);
    
    // Pattern 1: Remove version suffix
    if (decodedUrn.includes('_version=')) {
      const withoutVersion = decodedUrn.replace(/_version=\d+$/, '');
      possibleUrns.push(Buffer.from(withoutVersion).toString('base64'));
      console.log(`🔍 Test: Generated URN without version: ${withoutVersion}`);
    }
    
    // Pattern 2: Change region from wipprod to wipemea (or vice versa)
    if (decodedUrn.includes('wipprod')) {
      const withWipemea = decodedUrn.replace('wipprod', 'wipemea');
      possibleUrns.push(Buffer.from(withWipemea).toString('base64'));
      console.log(`🔍 Test: Generated URN with wipemea: ${withWipemea}`);
    } else if (decodedUrn.includes('wipemea')) {
      const withWipprod = decodedUrn.replace('wipemea', 'wipprod');
      possibleUrns.push(Buffer.from(withWipprod).toString('base64'));
      console.log(`🔍 Test: Generated URN with wipprod: ${withWipprod}`);
    }
    
    // Pattern 3: Remove query parameters entirely
    const withoutQuery = decodedUrn.split('?')[0];
    if (withoutQuery !== decodedUrn) {
      possibleUrns.push(Buffer.from(withoutQuery).toString('base64'));
      console.log(`🔍 Test: Generated URN without query: ${withoutQuery}`);
    }
    
    // Pattern 4: Change file type suffix (e.g., .ifc to .svf)
    if (decodedUrn.includes('.ifc')) {
      const withSvf = decodedUrn.replace('.ifc', '.svf');
      possibleUrns.push(Buffer.from(withSvf).toString('base64'));
      console.log(`🔍 Test: Generated URN with .svf: ${withSvf}`);
    }
    
    // Pattern 5: Add translation suffix
    const withTranslationSuffix = decodedUrn + '_translated';
    possibleUrns.push(Buffer.from(withTranslationSuffix).toString('base64'));
    console.log(`🔍 Test: Generated URN with translation suffix: ${withTranslationSuffix}`);
    
  } catch (error) {
    console.error(`🔍 Test: Error generating possible URNs:`, error);
  }
  
  console.log(`🔍 Test: Generated ${possibleUrns.length} possible URNs`);
  return possibleUrns;
}

async function checkTranslationStatus(originalUrn, token) {
  console.log(`🔍 Test: Checking status for URN: ${originalUrn}`);
  
  try {
    // Step 1: Check if manifest exists for the original URN
    const manifestUrl = `https://developer.api.autodesk.com/modelderivative/v2/designdata/${originalUrn}/manifest`;
    console.log(`🔍 Test: Checking manifest: ${manifestUrl}`);
    
    const manifestResponse = await fetch(manifestUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (manifestResponse.ok) {
      const manifestData = await manifestResponse.json();
      console.log(`🔍 Test: Manifest found, status: ${manifestData.status}`);
      console.log(`🔍 Test: Manifest data:`, manifestData);
      
      // Step 2: Look for SVF/SVF2 derivatives in the manifest
      const derivatives = extractDerivativesFromManifest(manifestData);
      console.log(`🔍 Test: Found derivatives:`, derivatives);
      
      // Step 3: Find the best available derivative for viewing
      const bestDerivative = findBestViewingDerivative(derivatives);
      
      if (bestDerivative) {
        console.log(`🔍 Test: Best derivative found:`, bestDerivative);
        return {
          isTranslated: bestDerivative.status === 'success',
          status: bestDerivative.status,
          translatedUrn: bestDerivative.urn,
          originalUrn,
          manifestUrl,
          derivativeType: bestDerivative.type,
          manifestData
        };
      } else {
        console.log(`🔍 Test: No suitable derivative found in manifest`);
        return {
          isTranslated: false,
          status: normalizeStatus(manifestData.status),
          originalUrn,
          manifestUrl,
          manifestData,
          error: 'No suitable derivative found in manifest'
        };
      }
    }
    
    // Step 4: If no manifest exists, check if there's an automatic translation
    console.log(`🔍 Test: No manifest found, checking for automatic translation...`);
    
    // Try different URN patterns that APS might use for automatic translations
    const possibleUrns = generatePossibleTranslatedUrns(originalUrn);
    
    for (const possibleUrn of possibleUrns) {
      const possibleManifestUrl = `https://developer.api.autodesk.com/modelderivative/v2/designdata/${possibleUrn}/manifest`;
      console.log(`🔍 Test: Trying possible URN: ${possibleUrn}`);
      
      const possibleResponse = await fetch(possibleManifestUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (possibleResponse.ok) {
        const possibleData = await possibleResponse.json();
        console.log(`🔍 Test: Found manifest with possible URN: ${possibleUrn}`);
        
        const derivatives = extractDerivativesFromManifest(possibleData);
        const bestDerivative = findBestViewingDerivative(derivatives);
        
        if (bestDerivative) {
          console.log(`🔍 Test: Found translated file with URN: ${possibleUrn}, derivative: ${bestDerivative.type}`);
          return {
            isTranslated: bestDerivative.status === 'success',
            status: normalizeStatus(bestDerivative.status),
            translatedUrn: bestDerivative.urn,
            originalUrn,
            manifestUrl: possibleManifestUrl,
            derivativeType: bestDerivative.type,
            manifestData: possibleData
          };
        }
      }
    }
    
    // Step 5: No translation found
    console.log(`🔍 Test: No translation found for any URN pattern`);
    return {
      isTranslated: false,
      status: 'not_found',
      originalUrn,
      error: 'No translation found for this file'
    };
    
  } catch (error) {
    console.error(`🔍 Test: Error checking translation status:`, error);
    return {
      isTranslated: false,
      status: 'failed',
      originalUrn,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function testTranslationChecker() {
  console.log('🧪 Testing TranslationChecker Logic...\n');
  
  // Test data
  const testUrn = 'dXJuOmFkc2sud2lwcHJvZDpmcy5maWxlOnZmLkR6OGtjVnM4VGVpd1hYUGFQNHBMaUFfdmVyc2lvbj0x';
  const testToken = 'test-token-123';
  
  console.log(`🧪 Test URN: ${testUrn}`);
  console.log(`🧪 Test Token: ${testToken}\n`);
  
  try {
    // Test 1: Check translation status
    console.log('🧪 Test 1: Checking translation status...');
    const status = await checkTranslationStatus(testUrn, testToken);
    
    console.log('🧪 Result:', JSON.stringify(status, null, 2));
    
    // Test 2: Generate possible URNs
    console.log('\n🧪 Test 2: Generating possible URNs...');
    const possibleUrns = generatePossibleTranslatedUrns(testUrn);
    console.log('🧪 Possible URNs:', possibleUrns);
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testTranslationChecker();
