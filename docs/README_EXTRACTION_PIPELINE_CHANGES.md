# Extraction Pipeline Changes - Development History

## 🎯 Overview

This document tracks all the changes made to the data extraction pipeline during development, from the initial web scraping approach to the current AI-only pipeline with database schema optimization.

## 📋 Major Pipeline Evolution

### **Phase 1: Initial Web Scraping Approach** (Deprecated)
- **Technology**: Cheerio-based HTML parsing
- **Files**: `src/lib/extraction/webScraper.ts` (now deprecated)
- **Issues**: Limited success, fragile CSS selectors, "Attribute selector didn't terminate" errors
- **Status**: ❌ Removed from active pipeline

### **Phase 2: Hybrid Web Scraping + AI** (Deprecated)
- **Technology**: Web scraping + OpenAI GPT-4o
- **Issues**: Web scraping still unreliable, AI analysis had Base64 image issues
- **Status**: ❌ Deprecated

### **Phase 3: AI-Only Pipeline** (Current)
- **Technology**: OpenAI GPT-4o + Perplexity AI + Dynamic Field Definitions
- **Status**: ✅ Active development

### **Phase 4: Database Schema Optimization** (Latest - December 2024)
- **Technology**: Supabase Database Schema + Automated Sync System
- **Status**: ✅ Completed

## 🔧 Technical Changes Made

### **1. Dynamic Field Definitions System**

#### **Created Supabase Table**: `product_field_definitions`
- **Purpose**: Central repository for all product field definitions
- **Fields**: 42+ fields with descriptions, examples, extraction hints
- **Management**: Web UI in `/settings` page
- **Usage**: Dynamic prompt generation for AI analysis

#### **Created Files**:
- `src/lib/schemas/product-fields.ts` - TypeScript API for field definitions
- `src/app/settings/page.tsx` - Web UI for field management

### **2. AI Analysis Components**

#### **Enhanced OpenAI Integration**:
- **File**: `src/lib/extraction/aiAnalyzer.ts`
- **Changes**:
  - Dynamic prompt generation using field definitions
  - Full-resolution screenshot handling
  - Structured JSON response parsing
  - Confidence scoring for each field
  - Enhanced error handling

#### **Added Perplexity AI Integration**:
- **File**: `src/lib/extraction/perplexityAnalyzer.ts` (NEW)
- **Features**:
  - URL-based product information extraction
  - Dynamic prompt generation
  - Structured JSON response parsing
  - Confidence scoring

#### **Created Data Fusion Engine**:
- **File**: `src/lib/extraction/dataFusion.ts` (MODIFIED)
- **Strategy**: Confidence-based field selection
- **Logic**: Higher confidence wins in conflicts

### **3. API Routes**

#### **New API Endpoints**:
- `/api/extraction/combined-analysis/route.ts` (NEW) - Orchestrates both AI analyzers
- `/api/extraction/simple-ai-analysis/route.ts` (NEW) - OpenAI-only for debugging
- `/api/extraction/perplexity-analysis/route.ts` (NEW) - Perplexity AI endpoint

#### **Enhanced Existing Endpoints**:
- `/api/extraction/ai-analysis/route.ts` - Updated for dynamic field definitions

### **4. Client-Side Integration**

#### **Updated Extraction Hook**:
- **File**: `src/hooks/useExtraction.ts`
- **Changes**:
  - Removed web scraping calls
  - Added AI-only pipeline
  - Enhanced progress tracking
  - Improved error handling
  - Updated data types

#### **Enhanced Form Integration**:
- **File**: `src/app/capture/page.tsx`
- **Changes**:
  - Dynamic category loading from Supabase
  - Predefined project type selection
  - Enhanced logging for debugging
  - Improved field value handling

### **5. Type System Updates**

#### **Enhanced Type Definitions**:
- **File**: `src/lib/types/extraction.ts`
- **Changes**:
  - Added `'perplexity'` as valid source type
  - Expanded `AIAnalysisResult` interface
  - Updated `FieldData` interface

#### **Updated Product Types**:
- **File**: `src/types/products.ts`
- **Changes**:
  - Added missing fields (manufacturer_url, retailer_name, catalog_url, project, etc.)
  - Updated `ProductFormData` interface

### **6. Material Categories Integration**

#### **Created Category System**:
- **Files**:
  - `src/types/material-categories.ts` (NEW)
  - `src/lib/material-categories.ts` (NEW)
  - `src/hooks/useMaterialCategories.ts` (NEW)
- **Features**:
  - Dynamic loading from Supabase
  - Integration with Category field
  - Hierarchical category structure

### **7. Database Schema Optimization** (NEW - December 2024)

#### **Enhanced Products Table**:
- **New URL Fields Added**:
  - `retailer_product_url` (TEXT) - Direct link to product on retailer site
  - `retailer_main_url` (TEXT) - Main retailer website URL
  - `manufacturer_product_url` (TEXT) - Direct link to product on manufacturer site
  - `manufacturer_main_url` (TEXT) - Main manufacturer website URL
- **Existing URL Fields Confirmed**:
  - `source_url` - Primary extraction source URL
  - `retailer_url` - Legacy retailer URL field

#### **Automated Sync System**:
- **Created**: `product_field_sync_log` table for audit trail
- **Created**: `sync_product_fields()` PostgreSQL function
- **Created**: `product_schema_change_trigger` event trigger
- **Created**: `products_organized` view for logical field ordering
- **Created**: `ProductFieldSynchronizer` TypeScript class
- **Created**: `/api/sync/product-fields` API endpoint

#### **Sync System Features**:
- **Automatic Detection**: Detects new columns in `products` table
- **Type Mapping**: Maps PostgreSQL types to JSON Schema types
- **Field Categorization**: Automatically determines field categories
- **Label Generation**: Creates human-readable labels
- **Audit Trail**: Logs all sync operations
- **Manual Trigger**: API endpoint for manual synchronization

#### **UI Field Mapping Corrections**:
- **Fixed**: `Manufacturer URL` now maps to `manufacturer_main_url`
- **Fixed**: `Retailer Product URL` now maps to `retailer_product_url`
- **Added**: New UI field for `Retailer Main URL` mapping to `retailer_main_url`
- **Updated**: TypeScript interfaces to include all new URL fields

### **8. Navigation and UI Fixes** (NEW - December 2024)

#### **Navigation System Repairs**:
- **Fixed**: Navigation links in `DefaultPageLayout` now properly connect to pages
- **Added**: `usePathname` hook for active page highlighting
- **Connected**: 
  - **DB** → `/database` (Database overview)
  - **New** → `/capture` (Product capture)
  - **Settings** → `/settings` (Field definitions)
  - **User** → `/` (Homepage)

#### **Settings Page Optimization**:
- **Fixed**: Tabs component compatibility issues (Radix UI → Subframe UI)
- **Fixed**: Table component structure problems
- **Simplified**: Removed problematic UI components causing runtime errors
- **Replaced**: Complex components with simple HTML/CSS alternatives
- **Maintained**: All core functionality (field overview, activation/deactivation)

#### **UI Component Compatibility**:
- **Tabs**: Updated from `Tabs.List/Trigger/Content` to `Tabs.Item` structure
- **Table**: Replaced with simple HTML table for better compatibility
- **Badge**: Replaced with CSS-styled spans
- **Button**: Corrected variant names to match Subframe UI options

### **9. Enhanced Extraction Pipeline** (NEW - December 2024)

#### **New Pipeline Flow**:
1. **User Input** → Manufacturer/Retailer Button Click
2. **URL Processing** → Automatic URL field population based on source type
3. **Screenshot Analysis** → GPT-4o Vision with complete field definitions
4. **URL Enhancement** → Perplexity AI for missing/complementary information
5. **Confidence Analysis** → Decision making for conflicting data

#### **URL Processing Logic**:
- **Source URL**: Always populated with the original URL
- **Manufacturer Source**: 
  - `manufacturer_product_url` ← Full URL
  - `manufacturer_main_url` ← Base URL (domain only)
- **Retailer Source**:
  - `retailer_product_url` ← Full URL
  - `retailer_main_url` ← Base URL (domain only)

#### **Enhanced AI Analysis**:
- **Created**: `/api/extraction/enhanced-analysis` endpoint
- **Features**:
  - GPT-4o Vision analysis with complete field definitions
  - Perplexity AI analysis with complete field definitions
  - Confidence-based data fusion
  - Source attribution for each field
  - Conflict resolution with reasoning

#### **Confidence-Based Decision Making**:
- **Logic**: Higher confidence wins in conflicts
- **Features**:
  - Source tracking (OpenAI vs Perplexity)
  - Confidence scoring for each field
  - Reasoning documentation
  - Conflict resolution flags

#### **Updated Components**:
- **useExtraction Hook**: New state management for enhanced pipeline
- **Capture Page**: URL processing and enhanced data handling
- **API Endpoint**: Combined AI analysis with fusion
- **Progress Tracking**: Updated for new pipeline steps

## 🚧 Error Fixes & Improvements

### **1. Base64 Image Issues**
- **Problem**: "Invalid base64 image_url" errors
- **Solution**: Proper handling of data URI prefix in AI analyzers
- **Files**: `src/lib/extraction/aiAnalyzer.ts`, `src/app/capture/page.tsx`

### **2. JSON Response Format**
- **Problem**: OpenAI API errors with JSON format
- **Solution**: Added "Antworte ausschließlich mit gültigem JSON." to prompts
- **Files**: `src/lib/extraction/aiAnalyzer.ts`, `src/lib/extraction/perplexityAnalyzer.ts`

### **3. Perplexity Model Issues**
- **Problem**: 400 Bad Request errors
- **Solution**: Changed model from `llama-3.1-70b-online` to `llama-3.1-70b-instruct`
- **File**: `src/lib/extraction/perplexityAnalyzer.ts`

### **4. Type System Errors**
- **Problem**: Missing fields in interfaces
- **Solution**: Updated all relevant type definitions
- **Files**: Multiple type definition files

### **5. UI Runtime Errors**
- **Problem**: Empty string values in Select components
- **Solution**: Removed problematic Select.Item with empty value
- **File**: `src/app/capture/page.tsx`

### **6. Database Schema Synchronization** (NEW)
- **Problem**: Inconsistency between `products` and `product_field_definitions` tables
- **Solution**: Implemented automated sync system with PostgreSQL triggers
- **Files**: Database migrations, `src/lib/sync/productFieldSync.ts`, `/api/sync/product-fields`

### **7. UI Field Mapping Issues** (NEW)
- **Problem**: UI fields mapped to incorrect database columns
- **Solution**: Corrected all field mappings in capture page and TypeScript types
- **Files**: `src/app/capture/page.tsx`, `src/types/products.ts`, `src/hooks/useCaptureForm.ts`

### **8. Navigation and Settings Page Errors** (NEW)
- **Problem**: Runtime errors with Tabs and Table components
- **Solution**: Fixed component compatibility and simplified UI structure
- **Files**: `src/ui/layouts/DefaultPageLayout.tsx`, `src/app/settings/page.tsx`

## 📊 Current Pipeline Status

### **Active Components**:
1. ✅ **OpenAI GPT-4o Screenshot Analysis** - Working
2. ✅ **Dynamic Field Definitions** - Working
3. ✅ **Form Population** - Working
4. ✅ **Progress Tracking** - Working
5. ✅ **Settings UI** - Working
6. ✅ **Category Integration** - Working
7. ✅ **Project Field** - Working
8. ✅ **Database Schema Sync** - Working (NEW)
9. ✅ **URL Field Management** - Working (NEW)
10. ✅ **UI Field Mapping** - Working (NEW)
11. ✅ **Navigation System** - Working (NEW)
12. ✅ **Settings Page** - Working (NEW)
13. ✅ **Enhanced Extraction Pipeline** - Working (NEW)
14. ✅ **URL Processing** - Working (NEW)
15. ✅ **Confidence-Based AI Fusion** - Working (NEW)

### **Disabled Components**:
1. 🔄 **Perplexity AI** - Implemented but disabled for debugging
2. 🔄 **Data Fusion** - Simplified to single AI source
3. 🔄 **Web Scraping** - Completely removed from pipeline

### **Debugging Approach**:
- **Simple Analysis**: OpenAI-only for isolation
- **Console Logging**: Comprehensive logging throughout
- **Field-by-Field Tracking**: Monitor each extraction
- **UI State Monitoring**: Track form updates
- **Database Sync Monitoring**: Audit trail for schema changes

## 🎯 Next Development Steps

### **Immediate Priorities**:
1. **Re-enable Perplexity AI** - Integrate dual AI analysis
2. **Enhance Validation** - Implement field-specific validators
3. **Improve Error Handling** - Better error recovery
4. **Performance Optimization** - Caching and rate limiting

### **Long-term Goals**:
1. **Multi-Source Analysis** - Additional AI providers
2. **Learning System** - Improve prompts based on success rates
3. **Batch Processing** - Handle multiple products
4. **Export Features** - Structured data export

## 📝 Development Notes

### **Key Decisions Made**:
1. **Abandoned Web Scraping** - Too unreliable and fragile
2. **AI-First Approach** - Better accuracy and flexibility
3. **Dynamic Field Definitions** - Centralized configuration
4. **Simplified Pipeline** - Focus on core functionality first
5. **Automated Schema Sync** - Ensure data consistency (NEW)
6. **Comprehensive URL Fields** - Support all extraction scenarios (NEW)

### **Lessons Learned**:
1. **Web Scraping Limitations** - CSS selectors are too fragile
2. **AI Prompt Engineering** - Critical for good results
3. **Error Handling** - Essential for user experience
4. **Type Safety** - Prevents runtime errors
5. **Database Schema Management** - Automated sync prevents drift (NEW)
6. **UI-Database Alignment** - Field mappings must be carefully maintained (NEW)
7. **UI Component Compatibility** - Subframe UI has different structure than Radix UI (NEW)
8. **Navigation State Management** - Active page highlighting improves UX (NEW)

## 🔗 Related Documentation

- **Data Extraction Logic**: `README_DATA_EXTRACTION_LOGIC.md`
- **Data Extraction Overview**: `README_DATA_EXTRACTION.md`
- **Implementation Plan**: `IMPLEMENTATION_PLAN_FINAL.md`
- **Development Best Practices**: `README_DEVELOPMENT_BEST_PRACTICES.md`

---

**Created**: December 2024  
**Last Updated**: December 2024  
**Status**: 🚧 Active Development  
**Next Milestone**: Re-enable Perplexity AI integration 