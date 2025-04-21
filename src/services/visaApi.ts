import { ExchangeRateResponse } from '../types';
import { getCertificates } from '../config/certificates';
import https from 'https';
import axios, { AxiosError } from 'axios';

const VISA_API_HOST = process.env.VISA_API_HOST || 'https://sandbox.api.visa.com';
const VISA_API_USERNAME = process.env.VISA_API_USERNAME;
const VISA_API_PASSWORD = process.env.VISA_API_PASSWORD;

if (!VISA_API_USERNAME || !VISA_API_PASSWORD) {
  throw new Error('VISA_API_USERNAME and VISA_API_PASSWORD must be set in environment variables');
}

// Reverse mapping of numeric codes to alpha codes for response
const NUMERIC_TO_ALPHA = {
  '840': 'USD',
  '978': 'EUR',
  '826': 'GBP',
  '392': 'JPY',
  // Add more currency codes as needed
} as const;

export const getVisaExchangeRate = async (
  sourceCurrencyCode: string,
  destinationCurrencyCode: string,
  sourceAmount: number,
  markupRate: number
): Promise<ExchangeRateResponse> => {
  console.log('Visa API - Request parameters:', {
    sourceCurrencyCode,
    destinationCurrencyCode,
    sourceAmount,
    markupRate,
    apiHost: VISA_API_HOST
  });

  try {
    const requestBody = {
      rateProductCode: "A",
      markupRate: "0", // Always use 0 for markup rate
      destinationCurrencyCode,
      sourceAmount: sourceAmount.toString(),
      sourceCurrencyCode,
    };

    console.log('Visa API - Request body:', requestBody);

    const certificates = getCertificates();
    const httpsAgent = new https.Agent({
      ...certificates,
      rejectUnauthorized: false, // Allow self-signed certificates in sandbox
      minVersion: 'TLSv1.2',
    });

    const response = await axios.post(`${VISA_API_HOST}/forexrates/v2/foreignexchangerates`, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${VISA_API_USERNAME}:${VISA_API_PASSWORD}`).toString('base64')}`,
        'Accept': 'application/json',
      },
      httpsAgent
    });

    console.log('Visa API Response:', JSON.stringify(response.data, null, 2));

    const data = response.data;
    if (!data) {
      throw new Error('Empty response from Visa API');
    }
    if (!data.conversionRate || !data.destinationAmount) {
      console.error('Visa API - Full response data:', JSON.stringify(data, null, 2));
      throw new Error('Response from Visa API is missing required fields');
    }

    // Convert numeric codes back to alpha codes for the response
    const sourceAlpha = NUMERIC_TO_ALPHA[sourceCurrencyCode as keyof typeof NUMERIC_TO_ALPHA] || sourceCurrencyCode;
    const destAlpha = NUMERIC_TO_ALPHA[destinationCurrencyCode as keyof typeof NUMERIC_TO_ALPHA] || destinationCurrencyCode;

    return {
      convertedAmount: parseFloat(data.destinationAmount),
      exchangeRate: parseFloat(data.conversionRate),
      sourceCurrency: sourceAlpha,
      destinationCurrency: destAlpha,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Visa API - Detailed error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      response: error instanceof AxiosError ? {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      } : undefined
    });

    if (error instanceof AxiosError) {
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please check VISA_API_USERNAME and VISA_API_PASSWORD.');
      }
      if (error.response?.status === 403) {
        throw new Error('Access forbidden. Please check if your API credentials have the correct permissions.');
      }
    }
    throw error;
  }
}; 