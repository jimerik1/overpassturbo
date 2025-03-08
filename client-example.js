// client-example.js
const axios = require('axios');

// Example polygon (around your original coordinates)
const polygon = [
  { lat: 32.260, lng: -97.790 },
  { lat: 32.260, lng: -97.780 },
  { lat: 32.270, lng: -97.780 },
  { lat: 32.270, lng: -97.790 },
  { lat: 32.260, lng: -97.790 } // Close the polygon by repeating the first point
];

// Feature types we want to retrieve
const featureTypes = ['building', 'highway', 'waterway', 'power'];

// Make the API request
async function getFeatures() {
  try {
    const response = await axios.post('http://localhost:3000/api/features', {
      polygon,
      featureTypes
    });
    
    console.log(`Found ${response.data.metadata.count} features:`);
    console.log(`- Buildings: ${response.data.features.filter(f => f.type === 'building').length}`);
    console.log(`- Roads: ${response.data.features.filter(f => f.type === 'road').length}`);
    console.log(`- Water features: ${response.data.features.filter(f => f.type === 'water').length}`);
    console.log(`- Utilities: ${response.data.features.filter(f => f.type === 'utility').length}`);
    
    // Example - log the first feature of each type
    console.log('\nExample features:');
    const buildingExample = response.data.features.find(f => f.type === 'building');
    if (buildingExample) {
      console.log('Building:', buildingExample.name, `(${buildingExample.id})`);
    }
    
    const roadExample = response.data.features.find(f => f.type === 'road');
    if (roadExample) {
      console.log('Road:', roadExample.name, `(${roadExample.id})`);
    }
    
    // You could save the response to a file
    // require('fs').writeFileSync('features.json', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('Error fetching features:', error.response ? error.response.data : error.message);
  }
}

// Run the example
getFeatures();