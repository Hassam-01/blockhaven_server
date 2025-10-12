import https from 'https';
import { config } from 'dotenv';

config();

const testCurrencyResponse = () => {
  const options = {
    hostname: 'api.changenow.io',
    path: '/v2/exchange/currencies?active=true',
    method: 'GET',
    headers: {
      'x-changenow-api-key': process.env.CHANGENOW_API_KEY || ''
    }
  };

  const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        if (Array.isArray(response) && response.length > 0) {
          console.log('First currency object structure:');
          console.log(JSON.stringify(response[0], null, 2));
          
          // Look for image-related fields
          const imageFields = Object.keys(response[0]).filter(key => 
            key.toLowerCase().includes('image') || 
            key.toLowerCase().includes('icon') || 
            key.toLowerCase().includes('logo') ||
            key.toLowerCase().includes('img')
          );
          
          if (imageFields.length > 0) {
            console.log('\nImage-related fields found:');
            imageFields.forEach(field => {
              console.log(`${field}: ${response[0][field]}`);
            });
          } else {
            console.log('\nNo obvious image fields found in top-level keys');
            console.log('All keys:', Object.keys(response[0]));
          }
        }
      } catch (error) {
        console.error('Error parsing response:', error);
        console.log('Raw response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('Request error:', error);
  });

  req.end();
};

testCurrencyResponse();