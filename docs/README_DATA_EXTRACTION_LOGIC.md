# Data Extraction Logic - Current AI Pipeline

## 🎯 Current Pipeline Flow

### 1. User Input & Setup
- **Data Source**: Supabase `capture` table (already implemented)
- **Country Detection**: Automatic suggestion based on primary URL extension
- **User Action**: Select country and click "Manufacturer" or "Reseller"

### 2. Primary AI Analysis (OpenAI GPT-4o)
- **Input**: Screenshot (full resolution) + URL
- **Method**: OpenAI GPT-4o multimodal analysis
- **Field Definitions**: Dynamic loading from Supabase `product_field_definitions` table
- **Prompt Template**: 
  ```
  Analysiere dieses Screenshot einer Produktseite und extrahiere alle verfügbaren Informationen.
  
  Zielfelder: ${fieldDescriptions}
  
  Antworte ausschließlich mit gültigem JSON.
  ```
- **Output**: Structured JSON with confidence scores for each field

### 3. Data Population
- **Target**: All form fields in capture page
- **Strategy**: Direct population from AI analysis results
- **Validation**: Basic field validation and error handling

### 4. Optional Enhancement (Based on Source Type)

#### 4a. If "Reseller" Source
- **Manufacturer Search**: Perplexity AI to find manufacturer info
- **Product URL Check**: Verify if manufacturer has specific product page
- **Alternative Retailers**: Search for additional retailers with pricing

#### 4b. If "Manufacturer" Source  
- **Manufacturer URL**: Extract from primary URL
- **Retailer Search**: Perplexity AI to find retailers with pricing
- **Alternative Retailers**: Store additional retailers in "Alternative Retailer" field

## 🔧 Technical Implementation

### Dynamic Field Definitions
- **Source**: Supabase `product_field_definitions` table
- **Fields**: 42+ product fields with descriptions, examples, extraction hints
- **Management**: Web UI at `/settings` page
- **Usage**: Central template for all AI prompts

### AI Analysis Components
- **OpenAI Analyzer**: `src/lib/extraction/aiAnalyzer.ts`
- **Perplexity Analyzer**: `src/lib/extraction/perplexityAnalyzer.ts`
- **Data Fusion**: `src/lib/extraction/dataFusion.ts`
- **API Routes**: Multiple endpoints for different analysis types

### Client-Side Integration
- **Hook**: `src/hooks/useExtraction.ts`
- **State Management**: Real-time progress tracking
- **Error Handling**: Comprehensive error management
- **Form Integration**: Direct population of form fields

## 📊 Current Status

### ✅ Working Features
1. **OpenAI Screenshot Analysis**: Full-resolution analysis with dynamic prompts
2. **Dynamic Field Loading**: 42+ fields from Supabase
3. **Form Population**: Results populate UI fields
4. **Progress Tracking**: Real-time UI updates
5. **Settings UI**: Field definition management
6. **Category Integration**: Dynamic material categories
7. **Project Field**: Predefined project types

### 🔄 Simplified Pipeline (Current Focus)
1. **User Input**: URL + Screenshot + Source Type
2. **AI Analysis**: OpenAI-only (simplified for debugging)
3. **Data Population**: Direct field population
4. **Optional Enhancement**: Manufacturer/retailer search

### 🚧 Areas for Improvement
1. **Perplexity Integration**: Currently disabled, focusing on OpenAI
2. **Data Fusion**: Simplified to single AI source
3. **Validation**: Enhanced field-specific validation needed
4. **Error Recovery**: Better error handling and recovery

## 🎯 Success Metrics

### Current Focus
- **Field Population Rate**: Percentage of fields successfully populated
- **Confidence Scores**: Average confidence across extracted fields
- **Error Rate**: Frequency of extraction failures
- **User Feedback**: Manual corrections needed

### Debugging Approach
- **Console Logging**: Comprehensive logging throughout pipeline
- **Simple Analysis**: Focused on OpenAI-only for isolation
- **Field-by-Field Tracking**: Monitor each field extraction
- **UI State Monitoring**: Track form data updates

## 🚀 Next Steps

### Immediate Actions
1. **Re-enable Perplexity**: Integrate dual AI analysis
2. **Enhance Validation**: Implement field-specific validators
3. **Improve Error Handling**: Better error recovery and user feedback
4. **Performance Optimization**: Caching and rate limiting

### Long-term Goals
- **Multi-Source Analysis**: Additional AI providers
- **Learning System**: Improve prompts based on success rates
- **Batch Processing**: Handle multiple products
- **Export Features**: Structured data export
