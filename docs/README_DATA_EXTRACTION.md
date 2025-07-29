# AI-Powered Data Extraction Pipeline - BRAIN DB

## 🎯 Übersicht

Die **Data Extraction** ist das Herzstück der BRAIN DB Anwendung. Wir verwenden eine **AI-basierte Pipeline** mit **OpenAI GPT-4o** für Screenshot-Analyse und **Perplexity AI** für URL-Analyse, kombiniert mit **dynamischen Felddefinitionen** aus Supabase für maximale Flexibilität und Genauigkeit.

## 🏗️ Architektur-Ansatz

### AI-First Strategy: Screenshot + URL Analysis
```
URL + Screenshot → [OpenAI GPT-4o Screenshot Analysis] + [Perplexity AI URL Analysis] → [Data Fusion] → [Validation] → Database
```

### Technologie-Stack
- **Screenshot Analysis**: OpenAI GPT-4o (Multimodal)
- **URL Analysis**: Perplexity AI (llama-3.1-70b-instruct)
- **Dynamic Field Definitions**: Supabase `product_field_definitions` table
- **Data Fusion**: Confidence-based algorithm
- **Validation**: Field-specific validators
- **UI Management**: React hooks with real-time progress tracking

## 📋 Implementierte Pipeline

### **1. Dynamic Field Definitions (Supabase)**
- **Table**: `product_field_definitions`
- **Fields**: 42+ product fields with descriptions, examples, and extraction hints
- **Management**: Web UI in `/settings` page for editing field definitions
- **Usage**: Central template for all AI extraction prompts

### **2. AI Analysis Components**

#### **2.1 OpenAI GPT-4o Screenshot Analysis**
- **File**: `src/lib/extraction/aiAnalyzer.ts`
- **API Route**: `/api/extraction/ai-analysis`
- **Features**:
  - Full-resolution screenshot analysis
  - Dynamic prompt generation using field definitions
  - Structured JSON response parsing
  - Confidence scoring for each field

#### **2.2 Perplexity AI URL Analysis**
- **File**: `src/lib/extraction/perplexityAnalyzer.ts`
- **API Route**: `/api/extraction/perplexity-analysis`
- **Features**:
  - URL-based product information extraction
  - Dynamic prompt generation using field definitions
  - Structured JSON response parsing
  - Confidence scoring for each field

#### **2.3 Combined Analysis Orchestrator**
- **File**: `src/app/api/extraction/combined-analysis/route.ts`
- **Features**:
  - Parallel execution of both AI analyzers
  - Data fusion based on confidence scores
  - Comprehensive error handling
  - Detailed logging for debugging

#### **2.4 Simplified Analysis (Debugging)**
- **File**: `src/app/api/extraction/simple-ai-analysis/route.ts`
- **Features**:
  - OpenAI-only analysis for focused debugging
  - Streamlined response handling
  - Enhanced error reporting

### **3. Data Fusion Engine**
- **File**: `src/lib/extraction/dataFusion.ts`
- **Strategy**: Confidence-based field selection
- **Logic**: Higher confidence wins in case of conflicts
- **Output**: Single fused result with source attribution

### **4. Client-Side Integration**
- **Hook**: `src/hooks/useExtraction.ts`
- **Features**:
  - State management for extraction process
  - Progress tracking with detailed messages
  - Error handling and recovery
  - Integration with form data updates

## 🎯 Field-Specific Strategies

### Dynamic Field Loading
- **Source**: Supabase `product_field_definitions` table
- **Fields**: 42+ fields including:
  - Basic info: product_name, manufacturer, series, product_code
  - Pricing: price, currency, price_per_unit
  - Specifications: dimensions, weight, material, color
  - Documentation: datasheet_url, catalog_url, additional_documents_url
  - Project info: project, category, sample_ordered, sample_stored_in

### Confidence-Based Fusion
- **Strategy**: Compare confidence scores from both AI sources
- **Decision**: Higher confidence wins
- **Fallback**: Empty field if both sources have low confidence

## 🔧 Konfiguration

### Environment Variables
```bash
OPENAI_API_KEY=sk-...
PERPLEXITY_API_KEY=pplx-...
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
```

### API Endpoints
- `/api/extraction/simple-ai-analysis` - OpenAI-only analysis
- `/api/extraction/combined-analysis` - Full AI pipeline
- `/api/extraction/ai-analysis` - OpenAI screenshot analysis
- `/api/extraction/perplexity-analysis` - Perplexity URL analysis

## 📊 Current Implementation Status

### ✅ Implemented Features
1. **Dynamic Field Definitions**: Supabase table with 42+ fields
2. **OpenAI GPT-4o Integration**: Screenshot analysis with full resolution
3. **Perplexity AI Integration**: URL analysis with structured prompts
4. **Data Fusion**: Confidence-based field selection
5. **Progress Tracking**: Real-time UI updates
6. **Error Handling**: Comprehensive error management
7. **Settings UI**: Web interface for field definition management
8. **Category Integration**: Dynamic material categories from Supabase
9. **Project Field**: Predefined project type selection

### 🔄 Current Pipeline Flow
1. **User Input**: URL + Screenshot + Source Type (Manufacturer/Reseller)
2. **AI Analysis**: OpenAI screenshot analysis (primary method)
3. **Data Population**: Results populate form fields
4. **Optional Enhancement**: Manufacturer/retailer search based on source type

### 🚧 Areas for Improvement
1. **Perplexity Integration**: Currently disabled, focusing on OpenAI
2. **Data Fusion**: Simplified to single AI source
3. **Validation**: Basic field validation implemented
4. **Error Recovery**: Enhanced error handling needed

## 🧪 Testing & Debugging

### Current Debugging Approach
- **Console Logging**: Comprehensive logging throughout pipeline
- **Simple Analysis**: Focused on OpenAI-only for isolation
- **Field-by-Field Tracking**: Monitor each field extraction
- **UI State Monitoring**: Track form data updates

### Success Metrics
- **Field Population Rate**: Percentage of fields successfully populated
- **Confidence Scores**: Average confidence across extracted fields
- **Error Rate**: Frequency of extraction failures
- **User Feedback**: Manual corrections needed

## 🚀 Deployment Strategy

### Current Status
- **Development**: Active development with frequent testing
- **Staging**: Ready for testing with real URLs
- **Production**: Requires error handling improvements

### Next Steps
1. **Enable Perplexity**: Re-integrate dual AI analysis
2. **Enhance Validation**: Implement field-specific validators
3. **Performance Optimization**: Caching and rate limiting
4. **User Experience**: Better error messages and recovery

## 📈 Best Practices

### 1. **AI Prompt Engineering**
- Dynamic prompts using field definitions from Supabase
- Structured JSON response requirements
- Confidence scoring for each field
- German language support in prompts

### 2. **Error Handling**
- Graceful degradation when AI analysis fails
- Detailed error logging for debugging
- User-friendly error messages
- Fallback to manual entry

### 3. **Performance**
- Parallel AI analysis where possible
- Efficient screenshot handling
- Minimal API calls
- Responsive UI updates

### 4. **Data Quality**
- Confidence-based field selection
- Source attribution for transparency
- Validation of extracted data
- Manual review flags for low confidence

## 🎯 Nächste Schritte

### Immediate Actions:
1. ✅ **AI Pipeline**: OpenAI GPT-4o integration complete
2. ✅ **Dynamic Fields**: Supabase integration complete
3. ✅ **UI Integration**: Form population working
4. 🔄 **Perplexity Integration**: Re-enable dual AI analysis
5. 🔄 **Validation**: Enhance field-specific validation

### Long-term Goals:
- **Multi-Source Analysis**: Integrate additional AI providers
- **Learning System**: Improve prompts based on success rates
- **Batch Processing**: Handle multiple products simultaneously
- **Export Features**: Structured data export capabilities

---

**Erstellt:** Dezember 2024  
**Status:** 🚧 Active Development  
**Letzte Aktualisierung:** Dezember 2024  
**Nächster Meilenstein:** Re-enable Perplexity AI integration
