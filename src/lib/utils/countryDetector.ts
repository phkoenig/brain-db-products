/**
 * Attempts to detect a country code from a given URL's top-level domain.
 * @param url The URL to analyze.
 * @returns A two-letter country code (e.g., "de") or a default value.
 */
export function detectCountryFromUrl(url: string, defaultCountry: string = 'de'): string {
    if (!url) {
        return defaultCountry;
    }

    try {
        const hostname = new URL(url).hostname;
        const parts = hostname.split('.');
        
        // Get the last part, which is usually the TLD
        const tld = parts[parts.length - 1];

        // Map common TLDs to country codes
        const countryMap: { [key: string]: string } = {
            de: 'de',
            at: 'at',
            ch: 'ch',
            fr: 'fr',
            it: 'it',
            es: 'es',
            uk: 'gb',
            co: 'gb', // Often .co.uk
            com: 'us',
            ca: 'ca',
        };

        // If TLD is a number (IP address), return default
        if (!isNaN(parseInt(tld, 10))) {
            return defaultCountry;
        }

        return countryMap[tld] || defaultCountry;

    } catch (error) {
        // If URL is invalid, return default
        return defaultCountry;
    }
}