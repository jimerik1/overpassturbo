# OpenStreetMap Feature Extractor API

An Express API for extracting features from OpenStreetMap using the Overpass API. This service allows you to query for specific feature types within a defined polygon.

## Features

- Extract buildings, roads, waterways, power lines, and more from OpenStreetMap
- Filter by feature types
- Define search area using polygon coordinates
- Nicely formatted JSON output
- Interactive API documentation

## Installation

1. Clone this repository:
   ```
   git clone <repository-url>
   cd osm-feature-extractor-api
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the server:
   ```
   npm start
   ```

The server will start on port 3000 (by default) and the API documentation will be available at http://localhost:3000/api-docs

## API Usage

### Extract Features Endpoint

**URL:** `POST /api/features`

**Request Body:**
```json
{
  "polygon": [
    { "lat": 32.260, "lng": -97.790 },
    { "lat": 32.260, "lng": -97.780 },
    { "lat": 32.270, "lng": -97.780 },
    { "lat": 32.270, "lng": -97.790 },
    { "lat": 32.260, "lng": -97.790 }
  ],
  "featureTypes": ["building", "highway", "waterway", "power"]
}
```

**Response:**
```json
{
  "metadata": {
    "count": 120,
    "timestamp": "2025-03-08T15:30:45.123Z",
    "source": "OpenStreetMap via Overpass API"
  },
  "features": [
    {
      "id": "way/123456789",
      "type": "building",
      "name": "Building",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          { "lat": 32.2651, "lng": -97.7853 },
          { "lat": 32.2653, "lng": -97.7853 },
          { "lat": 32.2653, "lng": -97.7851 },
          { "lat": 32.2651, "lng": -97.7851 },
          { "lat": 32.2651, "lng": -97.7853 }
        ]
      },
      "properties": {
        "building": "yes"
      }
    },
    // More features...
  ]
}
```

## Available Feature Types

- `building`: Buildings and structures
- `highway`: Roads, paths, and other transport routes
- `waterway`: Rivers, streams, canals
- `power`: Power lines and related infrastructure
- `landuse`: Land use designation areas
- `boundary`: Administrative boundaries

## Client Example

See the `client-example.js` file for a simple Node.js example of how to use this API.

## Rate Limiting and Performance

The Overpass API has rate limits, so please use responsibly. For large areas or many requests, consider:

1. Implementing caching
2. Breaking large areas into smaller queries
3. Adding rate limiting to your service

## License

MIT