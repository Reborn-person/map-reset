const NOMINATIM_BASE_URL =
  process.env.NOMINATIM_BASE_URL || 'https://nominatim.openstreetmap.org/search';

export interface GeocodingResult {
  formattedAddress: string;
  coordinates: [number, number];
}

export const geocodeAddress = async (
  query: string
): Promise<GeocodingResult | null> => {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return null;
  }

  const url = new URL(NOMINATIM_BASE_URL);
  url.searchParams.set('q', trimmedQuery);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '1');

  const response = await fetch(url.toString(), {
    headers: {
      'User-Agent': 'biye-address-navigation-system/1.0',
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Geocoding request failed with status ${response.status}`);
  }

  const results = (await response.json()) as Array<{
    display_name: string;
    lat: string;
    lon: string;
  }>;

  if (!results.length) {
    return null;
  }

  const firstResult = results[0];

  return {
    formattedAddress: firstResult.display_name,
    coordinates: [Number(firstResult.lon), Number(firstResult.lat)],
  };
};
