# Final Implementation Plan: Advanced Data Extraction

This document outlines the definitive step-by-step plan to implement the data extraction logic as specified in `README_DATA_EXTRACTION_LOGIC.md` and our subsequent clarifications.

## Phase 1: Setup & Perplexity Integration

First, we will set up the necessary tools to communicate with the Perplexity API.

1.  **Install Perplexity SDK**:
    *   We will install the official Perplexity AI Node.js package to ensure stable and well-structured API calls.
    *   Command: `npm install perplexity-ai`

2.  **Add Environment Variable**:
    *   A `PERPLEXITY_API_KEY` must be added to the `.env.local` file.

3.  **Create Perplexity Service Module**:
    *   **File**: `src/lib/extraction/perplexityService.ts`
    *   **Purpose**: This module will encapsulate all interactions with the Perplexity API.
    *   **Class**: `PerplexityService`
    *   **Methods**:
        *   `findManufacturerInfo(productName: string, retailerName: string)`: Finds the manufacturer's name, main URL, and a direct product page URL. Returns a structured object.
        *   `findRetailers(productName: string, manufacturerName: string, country: string)`: Searches for a list of retailers in the target country. Returns an array of objects, each containing `{ name, url, price }`.

## Phase 2: Utility & API Route Setup

Next, we'll create the necessary helper utilities and backend API routes that our frontend will call.

1.  **Create Country Detection Utility**:
    *   **File**: `src/lib/utils/countryDetector.ts`
    *   **Purpose**: A simple function to determine a country code from a given URL's top-level domain (e.g., `".de"` -> `"DE"`).

2.  **Refactor API Routes**:
    *   The old `/api/extraction/internet-research` route will be **deleted**.
    *   **New Route 1**: `src/app/api/extraction/find-manufacturer/route.ts`
        *   Uses the `PerplexityService` to find manufacturer information.
    *   **New Route 2**: `src/app/api/extraction/find-retailers/route.ts`
        *   Uses the `PerplexityService` to find a list of retailers.

## Phase 3: Core Logic Refactoring (`useExtraction` Hook)

The `useExtraction` hook will be completely refactored to orchestrate the new, multi-step workflow.

1.  **Expanded State Management**:
    *   The `extractionState` will be updated to reflect the new process: `'idle'`, `'scraping_primary'`, `'finding_counterpart'`, `'processing_results'`, `'complete'`, `'error'`.
    *   New state variables will be added to hold the results of each step (e.g., `primaryScrapeData`, `counterpartData`).

2.  **Orchestration in `startExtraction`**:
    *   This function will control the entire flow:
        1.  **(Client-Side)** Perform initial HTML parsing and Screenshot-to-JSON analysis of the primary URL. The results immediately populate the form.
        2.  **(Server-Side)** Based on `sourceType`, call the appropriate new API route (`/find-manufacturer` or `/find-retailers`) to get counterpart information.
        3.  **(Client-Side)** Process the results from the API call.
            *   **If Manufacturer was found**: Populate the manufacturer fields.
            *   **If Retailers were found**: Populate the main retailer block with the "most important" one and format the rest for the "Alternative Retailers" field.
        4.  Update the state to `complete`.

## Phase 4: UI and Form Integration (`capture/page.tsx`)

Finally, we'll connect the refactored logic to the user interface.

1.  **Country Dropdown**:
    *   On page load, a `useEffect` hook will call the `countryDetector` utility with the initial URL to pre-select the "Capture for Country" dropdown.

2.  **Connect Form to the Hook**:
    *   The main "Start Extraction" button will trigger the `startExtraction` function in our hook.
    *   The form fields will be populated in real-time as the extraction steps complete, using the `updateFields` function from the `useCaptureForm` hook.
    *   The "Alternative Retailers" `TextArea` will be populated with a formatted string of markdown links (e.g., `[Retailer B](url) - 99.99€`).

---

This plan provides a clear path forward. When you are ready to proceed, I will begin with **Phase 1**.