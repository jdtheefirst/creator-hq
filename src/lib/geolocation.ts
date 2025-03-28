interface GeolocationData {
  country: string;
  countryCode: string;
  region: string;
  regionName: string;
  city: string;
  timezone: string;
  lat: number;
  lon: number;
}

export async function getGeolocation(
  ip: string
): Promise<GeolocationData | null> {
  try {
    // Remove rate limiting by using the pro version with your API key
    const response = await fetch(
      `http://ip-api.com/json/${ip}?fields=country,countryCode,region,regionName,city,timezone,lat,lon`
    );

    if (!response.ok) {
      throw new Error("Geolocation API request failed");
    }

    const data = await response.json();
    return {
      country: data.country,
      countryCode: data.countryCode,
      region: data.region,
      regionName: data.regionName,
      city: data.city,
      timezone: data.timezone,
      lat: data.lat,
      lon: data.lon,
    };
  } catch (error) {
    console.error("Error fetching geolocation:", error);
    return null;
  }
}
