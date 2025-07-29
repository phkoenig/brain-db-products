# Extraction Pipeline Changes - Development History

## 🎯 Overview

This document tracks all the changes made to the data extraction pipeline during development, from the initial web scraping approach to the current AI-only pipeline.

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

## 📊 Current Pipeline Status

### **Active Components**:
1. ✅ **OpenAI GPT-4o Screenshot Analysis** - Working
2. ✅ **Dynamic Field Definitions** - Working
3. ✅ **Form Population** - Working
4. ✅ **Progress Tracking** - Working
5. ✅ **Settings UI** - Working
6. ✅ **Category Integration** - Working
7. ✅ **Project Field** - Working

### **Disabled Components**:
1. 🔄 **Perplexity AI** - Implemented but disabled for debugging
2. 🔄 **Data Fusion** - Simplified to single AI source
3. 🔄 **Web Scraping** - Completely removed from pipeline

### **Debugging Approach**:
- **Simple Analysis**: OpenAI-only for isolation
- **Console Logging**: Comprehensive logging throughout
- **Field-by-Field Tracking**: Monitor each extraction
- **UI State Monitoring**: Track form updates

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

### **Lessons Learned**:
1. **Web Scraping Limitations** - CSS selectors are too fragile
2. **AI Prompt Engineering** - Critical for good results
3. **Error Handling** - Essential for user experience
4. **Type Safety** - Prevents runtime errors

---

**Created**: December 2024  
**Last Updated**: December 2024  
**Status**: 🚧 Active Development  
**Next Milestone**: Re-enable Perplexity AI integration 