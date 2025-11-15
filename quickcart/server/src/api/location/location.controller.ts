import asyncHandler from 'express-async-handler';
import type { Request, Response } from 'express';
import fetch from 'node-fetch';

/**
 * @desc    Check coordinates, reverse geocode, and check serviceability
 * @route   POST /api/location/check
 * @access  Public
 */
export const checkLocation = asyncHandler(async (req: Request, res: Response) => {
  const { lat, lon } = req.body;

  if (!lat || !lon) {
    res.status(400);
    throw new Error('Latitude and longitude are required');
  }

  // Ask for street-level details
  const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
  
  const geoResponse = await fetch(nominatimUrl, {
    headers: { 'User-Agent': 'QuickCartApp/1.0' }
  });
  
  if (!geoResponse.ok) {
    throw new Error('Failed to fetch address from geocoding service');
  }
  
  const data: any = await geoResponse.json();
  const fullAddress = data?.display_name;

  if (!fullAddress) {
    throw new Error('Could not find address for this location');
  }

  // Business Logic: Check if serviceable
  const isServiceable = fullAddress.toLowerCase().includes('jaipur');

  if (!isServiceable) {
    res.status(400);
    throw new Error("Sorry, we don't deliver to your location yet.");
  }

  // --- vvv NEW, SMARTER ADDRESS BUILDER vvv ---
  const address = data.address;
  let locationName = fullAddress; // Default

  if (address) {
    // Try to build the *best* possible address, from most specific to least
    const parts = [
      address.house_number, // "A25"
      address.road,           // "kusam vihar"
      address.neighbourhood || address.suburb, // "Sanganer"
      address.city || address.town || address.village // "Jaipur"
    ].filter(Boolean); // filter(Boolean) removes empty/null parts

    if (parts.length > 0) {
      locationName = parts.join(', ');
    }
  }
  // --- ^^^ END NEW LOGIC ^^^ ---

  res.json({
    serviceable: true,
    locationName: locationName, // Send the new, cleaner address
  });
});

/**
 * @desc    Search for a location by text
 * @route   GET /api/location/search?q=...
 * @access  Public
 */
export const searchLocation = asyncHandler(async (req: Request, res: Response) => {
  const { q } = req.query;

  if (!q || typeof q !== 'string') {
    res.status(400);
    throw new Error('Search query is required');
  }

  const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5`;
  
  const geoResponse = await fetch(nominatimUrl, {
    headers: { 'User-Agent': 'QuickCartApp/1.0' }
  });

  if (!geoResponse.ok) {
    throw new Error('Failed to fetch from geocoding service');
  }
  
  const data: any[] = await geoResponse.json();

  const serviceableLocations = data
    .filter(place => {
      return place.display_name && place.display_name.toLowerCase().includes('jaipur');
    })
    .map(place => ({
      id: place.osm_id,
      name: place.display_name,
      lat: place.lat,
      lon: place.lon,
    }));

  res.json(serviceableLocations);
});