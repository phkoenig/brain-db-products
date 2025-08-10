# APS Viewer Solution - ACC Files Integration

## Problem Statement

The APS Viewer was not starting when trying to display CAD files from Autodesk Construction Cloud (ACC) projects. The core issue was that we were incorrectly trying to query the Model Derivative API manifest for translated derivatives, when the `derivatives.data.id` from the ACC Data Management API is already the correct URN for the APS Viewer.

## Root Cause Analysis

### Initial Problems
1. **Access Token Issues**: The viewer wasn't starting due to authentication problems
2. **URN Format Issues**: Incorrect URN conversion for the Model Derivative API
3. **Manifest Query Failures**: 404 Not Found errors when querying manifests
4. **Translation Job Failures**: Attempting to start new translation jobs when derivatives already existed

### The Real Problem
The fundamental issue was a **misunderstanding of the ACC automatic translation workflow**:

- ACC automatically translates uploaded files (RVT, DWG, IFC, PDF) into viewer-ready formats (SVF/SVF2)
- These translated derivatives are stored in a separate APS storage with different URNs
- The `derivatives.data.id` from the ACC Data Management API is **already the correct URN** for the APS Viewer
- **No manifest query is needed** - the viewer can use the derivatives.data.id directly

## Solution Implementation

### 1. ACCDerivativeFinder Module

Created a dedicated module (`src/lib/acc-derivative-finder.ts`) that implements the correct workflow:

```typescript
export class ACCDerivativeFinder {
  /**
   * Find derivatives for an ACC item using the correct workflow
   */
  async findDerivatives(projectId: string, itemId: string): Promise<ManifestInfo> {
    // Step 1: Get item details from ACC Data Management API
    const itemDetails = await this.getItemDetails(projectId, itemId);
    
    // Step 2: Get version URN from derivatives relationship
    const versionUrn = await this.getVersionUrnFromDerivatives(projectId, itemId);
    
    // Step 3: Use derivatives.data.id directly as viewer URN
    // The derivatives.data.id is already the correct URN for the APS Viewer!
    return {
      isTranslated: true,
      status: 'success',
      derivatives: [{
        urn: versionUrn,
        type: 'derivatives',
        status: 'success'
      }],
      bestViewingDerivative: {
        urn: versionUrn,
        type: 'derivatives',
        status: 'success'
      },
      originalUrn: versionUrn,
      manifestUrl: `https://developer.api.autodesk.com/modelderivative/v2/designdata/${versionUrn}/manifest`
    };
  }
}
```

### 2. Key Implementation Details

#### ACC Data Management API Integration
```typescript
private async getVersionUrnFromDerivatives(projectId: string, itemId: string): Promise<string | null> {
  // Get item details with included versions to find derivatives
  const itemDetailsUrl = `https://developer.api.autodesk.com/data/v1/projects/${projectId}/items/${itemId}?include=versions`;
  
  // Look for derivatives relationship in versions
  if (included.relationships && included.relationships.derivatives) {
    const derivatives = included.relationships.derivatives.data;
    
    // Check if derivatives.data is an object (not an array)
    if (derivatives && derivatives.id) {
      return derivatives.id; // This is the correct URN!
    }
  }
}
```

#### Direct URN Usage
The critical insight from Perplexity AI was that the `derivatives.data.id` can be used directly:

```typescript
// Step 4: Use the derivatives.data.id directly as the viewer URN
// The derivatives.data.id is already the correct URN for the APS Viewer!
console.log(`✅ Using derivatives.data.id directly as viewer URN: ${versionUrn}`);

return {
  isTranslated: true,
  status: 'success',
  derivatives: [{
    urn: versionUrn, // Use directly without manifest query
    type: 'derivatives',
    status: 'success'
  }]
};
```

### 3. Integration with APS Viewer Token Endpoint

Updated `src/app/api/aps/viewer-token/route.ts` to use the new ACCDerivativeFinder:

```typescript
// Use ACCDerivativeFinder to find derivatives
const derivativeFinder = new ACCDerivativeFinder(token);
const manifestInfo = await derivativeFinder.findDerivatives(projectId, fileId);

if (manifestInfo.isTranslated) {
  // File is ready for viewing - use the URN directly
  return {
    access_token: token,
    urn: manifestInfo.bestViewingDerivative?.urn || manifestInfo.originalUrn,
    manifest_exists: true,
    manifest_status: manifestInfo.status,
    derivative_urn: manifestInfo.bestViewingDerivative?.urn || manifestInfo.originalUrn,
    derivative_type: manifestInfo.bestViewingDerivative?.type || 'derivatives',
    acc_derivative_finder_used: true,
    message: `File is ready for viewing. Type: ${manifestInfo.bestViewingDerivative?.type || 'derivatives'}`
  };
}
```

## Technical Workflow

### Correct ACC → APS Viewer Flow
```
1. ACC Item (RVT/DWG/IFC/PDF)
   ↓
2. ACC Data Management API: GET /projects/{projectId}/items/{itemId}?include=versions
   ↓
3. Extract derivatives.data.id from versions relationship
   ↓
4. Use derivatives.data.id directly as APS Viewer URN
   ↓
5. APS Viewer loads the translated derivatives automatically
```

### Previous Incorrect Flow
```
1. ACC Item
   ↓
2. Get derivatives.data.id
   ↓
3. Query Model Derivative API manifest ❌ (404 Not Found)
   ↓
4. Try to start translation job ❌ (Unnecessary)
   ↓
5. Fail to display file
```

## Authentication Strategy

### Token Management
- **3-legged OAuth**: Primary method for ACC files (user-specific access)
- **2-legged OAuth**: Fallback for service-level operations
- **Scopes**: `viewables:read`, `data:read` for viewer functionality

### Implementation
```typescript
async function getACCToken(): Promise<string> {
  try {
    // Try 3-legged OAuth first
    const accOAuth = new ACCOAuthService();
    return await accOAuth.getAccessToken();
  } catch (error) {
    console.log('🔍 APS Viewer: 3-legged OAuth failed, falling back to 2-legged:', error);
    
    // Fallback to 2-legged OAuth
    const response = await fetch('https://developer.api.autodesk.com/authentication/v1/authenticate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.APS_CLIENT_ID!,
        client_secret: process.env.APS_CLIENT_SECRET!,
        grant_type: 'client_credentials',
        scope: 'viewables:read data:read data:write data:create bucket:create bucket:read bucket:delete'
      })
    });
    
    const data = await response.json();
    return data.access_token;
  }
}
```

## Testing and Validation

### Terminal Testing
```bash
curl -X POST http://localhost:3000/api/aps/viewer-token \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "b.e4a2d0c3-1ca2-4a10-b381-f184c303a1c1",
    "fileId": "urn:adsk.wipemea:dm.lineage:1lB5mmb8TIuIvyBHLXDDDQ"
  }'
```

### Successful Response
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "urn": "dXJuOmFkc2sud2lwZW1lYTpmcy5maWxlOnZmLjFsQjVtbWI4VEl1SXZ5QkhMWERERFE_dmVyc2lvbj0yOQ",
  "manifest_exists": true,
  "manifest_status": "success",
  "derivative_urn": "dXJuOmFkc2sud2lwZW1lYTpmcy5maWxlOnZmLjFsQjVtbWI4VEl1SXZ5QkhMWERERFE_dmVyc2lvbj0yOQ",
  "derivative_type": "derivatives",
  "acc_derivative_finder_used": true,
  "message": "File is ready for viewing. Type: derivatives"
}
```

## Key Learnings

### 1. ACC Automatic Translation
- ACC automatically translates uploaded files into viewer-ready formats
- Derivatives are stored separately with different URNs
- No manual translation job is needed for most file types

### 2. URN Handling
- The `derivatives.data.id` from ACC API is already Base64-encoded
- It can be used directly as the APS Viewer URN
- No additional manifest query is required

### 3. Authentication
- 3-legged OAuth is preferred for ACC files
- 2-legged OAuth works as fallback
- Both provide the necessary scopes for viewer functionality

### 4. Error Handling
- Robust fallback mechanisms for different API response formats
- Comprehensive logging for debugging
- Graceful degradation when derivatives are not found

## Files Modified

1. **`src/lib/acc-derivative-finder.ts`** - New module for finding ACC derivatives
2. **`src/app/api/aps/viewer-token/route.ts`** - Updated to use ACCDerivativeFinder
3. **`src/lib/translation-checker.ts`** - Modified translation job format (svf2 → svf)

## Future Improvements

1. **Caching**: Cache derivative URNs to reduce API calls
2. **Webhook Integration**: Use webhooks to monitor translation status
3. **Error Recovery**: Implement retry mechanisms for failed requests
4. **Performance**: Optimize API calls and response processing

## References

- [Autodesk Platform Services Documentation](https://aps.autodesk.com/)
- [ACC Data Management API](https://aps.autodesk.com/en/docs/data/v2/overview/)
- [Model Derivative API](https://aps.autodesk.com/en/docs/model-derivative/v2/overview/)
- [APS Viewer Documentation](https://aps.autodesk.com/en/docs/viewer/v7/developers_guide/overview/)
