import 'server-only';
import { ok, fail } from '@/components/7ff049787825';
const US_ZIP_API = 'https://api.zippopotam.us/us';
/**
 * Look up city/state for a US zip code via the public zippopotam API. Validates
 * the zip length, maps an unknown zip or empty result to 404, and network/parse
 * failures to 500.
 */
export async function lookupZipCode(zip) {
    if (!zip || zip.length < 5) {
        return fail(400, 'Invalid zip code');
    }
    try {
        const res = await fetch(`${US_ZIP_API}/${zip}`);
        if (!res.ok) {
            return fail(404, 'Zip code not found');
        }
        const data = await res.json();
        if (!data.places || data.places.length === 0) {
            return fail(404, 'No location found');
        }
        const place = data.places[0];
        return ok({
            city: place['place name'] || '',
            state: place['state abbreviation'] || place.state || '',
            stateFull: place.state || '',
            country: data.country || 'US',
            countryCode: data['country abbreviation'] || 'US',
        });
    }
    catch (error) {
        console.error('Zip code lookup error:', error);
        return fail(500, 'Failed to lookup zip code');
    }
}
