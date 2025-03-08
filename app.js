// app.js - Main Express server file
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');
const setupSwagger = require('./swagger');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Validate request body middleware
const validateRequest = (req, res, next) => {
  const { polygon, featureTypes, forcepolygon } = req.body;
  
  // Check if polygon exists and is an array
  if (!polygon || !Array.isArray(polygon)) {
    return res.status(400).json({ error: 'Polygon coordinates are required as an array' });
  }
  
  // Check if polygon has at least 3 points
  if (polygon.length < 3) {
    return res.status(400).json({ error: 'Polygon must have at least 3 points' });
  }
  
  // Check if each point has valid lat and lng
  for (const point of polygon) {
    if (!point.lat || !point.lng) {
      return res.status(400).json({ error: 'Each polygon point must have lat and lng properties' });
    }
  }
  
  // Check if featureTypes exists and is an array
  if (!featureTypes || !Array.isArray(featureTypes)) {
    return res.status(400).json({ error: 'Feature types are required as an array' });
  }
  
  // Check if featureTypes contains valid values
  const validTypes = ['highway', 'building', 'waterway', 'power', 'landuse', 'boundary'];
  for (const type of featureTypes) {
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        error: `Invalid feature type: ${type}. Valid types are: ${validTypes.join(', ')}` 
      });
    }
  }
  
  // Validate forcepolygon if present (optional parameter)
  if (forcepolygon !== undefined && typeof forcepolygon !== 'boolean') {
    return res.status(400).json({ error: 'forcepolygon must be a boolean value (true or false)' });
  }
  
  next();
};

// Main endpoint to get features
app.post('/api/features', validateRequest, async (req, res) => {
  try {
    const { polygon, featureTypes, forcepolygon = false } = req.body;
    
    // Format polygon for Overpass query
    const polyStr = polygon.map(p => `${p.lat} ${p.lng}`).join(' ');
    
    // Build Overpass query
    let overpassQuery = '[out:json];(';
    
    // Add desired feature types
    featureTypes.forEach(type => {
      if (type === 'highway') {
        overpassQuery += `way["highway"](poly:"${polyStr}");`;
      } else if (type === 'building') {
        overpassQuery += `way["building"](poly:"${polyStr}");`;
      } else if (type === 'waterway') {
        overpassQuery += `way["waterway"](poly:"${polyStr}");`;
      } else if (type === 'power') {
        overpassQuery += `way["power"="line"](poly:"${polyStr}");`;
      } else if (type === 'landuse') {
        overpassQuery += `way["landuse"](poly:"${polyStr}");`;
      } else if (type === 'boundary') {
        overpassQuery += `relation["boundary"="administrative"](poly:"${polyStr}");`;
      }
    });
    
    overpassQuery += ');out geom;';
    
    // Make request to Overpass API
    const response = await axios.post('https://overpass-api.de/api/interpreter', 
      overpassQuery, 
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    
    // Process and format the response, passing forcepolygon option
    const processedFeatures = processOverpassResponse(response.data, forcepolygon);
    
    res.json(processedFeatures);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ 
      error: 'An error occurred while fetching features',
      details: error.message
    });
  }
});

// Function to convert LineString to Polygon by creating a small buffer
function lineToPolygon(coordinates) {
  if (coordinates.length < 2) return coordinates;
  
  // Small offset value for creating width (adjust as needed)
  const OFFSET = 0.00005; // roughly 5-6 meters
  
  // Create a new array to hold polygon coordinates
  const polygonCoords = [];
  
  // First, add all the original coordinates
  for (let i = 0; i < coordinates.length; i++) {
    polygonCoords.push({...coordinates[i]});
  }
  
  // Then, add offset coordinates in reverse order to create a closed polygon
  for (let i = coordinates.length - 1; i >= 0; i--) {
    polygonCoords.push({
      lat: coordinates[i].lat + OFFSET,
      lng: coordinates[i].lng + OFFSET
    });
  }
  
  // Add the first point again to close the polygon
  polygonCoords.push({...polygonCoords[0]});
  
  return polygonCoords;
}

// Process Overpass API response into a nicer format
function processOverpassResponse(overpassData, forcepolygon = false) {
  if (!overpassData || !overpassData.elements || !Array.isArray(overpassData.elements)) {
    return { features: [] };
  }
  
  const features = overpassData.elements.map(element => {
    // Skip elements without geometry
    if (!element.geometry) return null;
    
    // Determine feature type
    let featureType = 'unknown';
    if (element.tags) {
      if (element.tags.building) featureType = 'building';
      else if (element.tags.highway) featureType = 'road';
      else if (element.tags.waterway) featureType = 'water';
      else if (element.tags.power) featureType = 'utility';
      else if (element.tags.landuse) featureType = 'landuse';
      else if (element.tags.boundary) featureType = 'boundary';
    }
    
    // Format geometry
    let geometry;
    if (element.type === 'way') {
      // Convert points to our format
      const coordinates = element.geometry.map(point => ({ lat: point.lat, lng: point.lon }));
      
      // Determine geometry type based on element type and forcepolygon flag
      let geometryType;
      let finalCoordinates;
      
      // If it's a building, it's already a polygon
      if (featureType === 'building') {
        geometryType = 'Polygon';
        finalCoordinates = coordinates;
      } 
      // If forcepolygon is true, convert LineString to Polygon
      else if (forcepolygon) {
        geometryType = 'Polygon';
        finalCoordinates = lineToPolygon(coordinates);
      }
      // Otherwise, keep it as a LineString
      else {
        geometryType = 'LineString';
        finalCoordinates = coordinates;
      }
      
      geometry = {
        type: geometryType,
        coordinates: finalCoordinates
      };
    } else {
      // For other element types like relations
      // These are typically administrative boundaries or other complex geometries
      geometry = {
        type: 'Complex',
        coordinates: element.geometry ? 
          element.geometry.map(point => ({ lat: point.lat, lng: point.lon })) : []
      };
    }
    
    // Build feature object
    return {
      id: `${element.type}/${element.id}`,
      type: featureType,
      name: getFeatureName(element),
      geometry: geometry,
      properties: element.tags || {}
    };
  }).filter(Boolean); // Remove null entries
  
  return {
    metadata: {
      count: features.length,
      timestamp: new Date().toISOString(),
      source: 'OpenStreetMap via Overpass API'
    },
    features: features
  };
}

// Helper function to get a nice name for the feature
function getFeatureName(element) {
  if (!element.tags) return 'Unnamed feature';
  
  if (element.tags.name) {
    return element.tags.name;
  }
  
  if (element.tags.highway) {
    return element.tags.ref || 
           `${element.tags.highway.charAt(0).toUpperCase() + element.tags.highway.slice(1)} Road`;
  }
  
  if (element.tags.building) {
    return element.tags.building === 'yes' ? 'Building' : 
           `${element.tags.building.charAt(0).toUpperCase() + element.tags.building.slice(1)} Building`;
  }
  
  if (element.tags.waterway) {
    return element.tags.waterway.charAt(0).toUpperCase() + element.tags.waterway.slice(1);
  }
  
  if (element.tags.power) {
    return `Power ${element.tags.power}`;
  }
  
  return 'Unnamed feature';
}

// Setup Swagger documentation
setupSwagger(app);

// Root endpoint to redirect to API docs
app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API documentation available at http://localhost:${PORT}/api-docs`);
});

module.exports = app; // For testing