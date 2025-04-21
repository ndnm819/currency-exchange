import forge from 'node-forge';
import fs from 'fs';
import path from 'path';
import oauth from 'mastercard-oauth1-signer';
import fetch from 'node-fetch';
import { ExchangeRateResponse } from '../types';

interface MastercardConfig {
  p12Path: string;
  p12Password: string;
  keyAlias: string;
  consumerKey: string;
  baseUrl: string;
}

export class MastercardApiService {
  private signingKey: string;
  private consumerKey: string;
  private baseUrl: string;

  constructor(config: MastercardConfig) {
    this.consumerKey = config.consumerKey;
    this.baseUrl = config.baseUrl;
    this.signingKey = this.loadSigningKey(config);
  }

  private loadSigningKey(config: MastercardConfig): string {
    try {
      // In Next.js, we need to use process.cwd() to get the correct path
      const p12Path = path.join(process.cwd(), config.p12Path);
      
      if (!fs.existsSync(p12Path)) {
        throw new Error(`P12 certificate file not found at: ${p12Path}`);
      }

      const p12Content = fs.readFileSync(p12Path, 'binary');
      const p12Asn1 = forge.asn1.fromDer(p12Content, false);
      
      // Ensure the password is a string and not undefined
      const password = config.p12Password?.toString() || '';
      if (!password) {
        throw new Error('P12 password is required but not provided');
      }

      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, password);
      
      const bags = p12.getBags({
        friendlyName: config.keyAlias,
        bagType: forge.pki.oids.pkcs8ShroudedKeyBag
      });

      const keyObj = bags.friendlyName?.[0];
      if (!keyObj?.key) {
        throw new Error('Failed to extract private key from PKCS#12 file. Please check the key alias.');
      }

      // Convert the private key to PEM format
      const pemKey = forge.pki.privateKeyToPem(keyObj.key);
      
      // Log the first few characters of the key for debugging (but not the whole key for security)
      console.log('PEM key format:', pemKey.substring(0, 50) + '...');

      return pemKey;
    } catch (error) {
      console.error('Error loading signing key:', error);
      throw new Error('Failed to load Mastercard signing key. Please check your certificate and credentials.');
    }
  }

  private getAuthorizationHeader(uri: string, method: string, payload: any): string {
    try {
      // For GET requests, we need to include the query parameters in the signature
      if (method === 'GET') {
        // Convert payload to query string
        const queryParams = new URLSearchParams();
        if (payload) {
          Object.entries(payload).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              queryParams.append(key, String(value));
            }
          });
        }
        const queryString = queryParams.toString();
        
        // Log the parameters being used for debugging
        console.log('GET request parameters:', {
          uri,
          method,
          queryString,
          consumerKey: this.consumerKey,
          signingKeyLength: this.signingKey?.length
        });
        
        return oauth.getAuthorizationHeader(
          uri,
          method,
          queryString,
          this.consumerKey,
          this.signingKey
        );
      }

      // For other methods, convert payload to string
      const payloadString = typeof payload === 'string' 
        ? payload 
        : JSON.stringify(payload);
      
      return oauth.getAuthorizationHeader(
        uri,
        method,
        payloadString,
        this.consumerKey,
        this.signingKey
      );
    } catch (error) {
      console.error('Error generating authorization header:', error);
      throw new Error('Failed to generate Mastercard authorization header');
    }
  }

  public async makeRequest(endpoint: string, method: string = 'POST', payload: any = {}): Promise<any> {
    let uri = `${this.baseUrl}${endpoint}`;
    
    // For GET requests, append query parameters to the URI
    if (method === 'GET' && payload) {
      const queryParams = new URLSearchParams();
      Object.entries(payload).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
      uri = `${uri}?${queryParams.toString()}`;
    }
    
    const payloadString = method === 'GET' ? undefined : JSON.stringify(payload);
    const authHeader = this.getAuthorizationHeader(uri, method, payload);

    try {
      const headers: Record<string, string> = {
        'Authorization': authHeader,
        'Accept': 'application/json'
      };

      // Only add Content-Type for non-GET requests
      if (method !== 'GET') {
        headers['Content-Type'] = 'application/json';
      }

      const response = await fetch(uri, {
        method,
        headers,
        body: payloadString,
      });

      // Log response details
      console.log('API Response Status:', response.status);
      console.log('API Response Headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        if (response.status === 401) {
          throw new Error('Authentication failed. Please check your Mastercard API credentials.');
        } else if (response.status === 403) {
          throw new Error('Access forbidden. Please check if your API credentials have the correct permissions.');
        }
        throw new Error(`Mastercard API request failed: ${response.statusText}. Details: ${errorText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const jsonResponse = await response.json();
        console.log('API JSON Response:', jsonResponse);
        return jsonResponse;
      }
      
      const textResponse = await response.text();
      console.log('API Text Response:', textResponse);
      return textResponse;
    } catch (error) {
      console.error('Error making Mastercard API request:', error);
      if (error instanceof Error) {
        throw new Error(`Mastercard API request failed: ${error.message}`);
      }
      throw error;
    }
  }

  public async getExchangeRate(
    sourceCurrency: string,
    destinationCurrency: string,
    amount: number
  ): Promise<ExchangeRateResponse> {
    try {
      // Using the correct endpoint for currency conversion
      const endpoint = `/settlement/currencyrate/conversion-rate`;
      const payload = {
        fxDate: '0000-00-00',
        transCurr: sourceCurrency,
        crdhldBillCurr: destinationCurrency,
        bankFee: 0,
        transAmt: amount
      };
      
      console.log('Making Mastercard API request with:', {
        endpoint,
        payload
      });

      const response = await this.makeRequest(endpoint, 'GET', payload);
      console.log('Mastercard API Response:', response);

      // Check if we have the basic response structure
      if (!response || !response.data) {
        throw new Error('Invalid response structure from Mastercard API');
      }

      const data = response.data;
      
      // Return the response with the required fields
      return {
        exchangeRate: parseFloat(data.conversionRate),
        sourceCurrency: data.transCurr,
        destinationCurrency: data.crdhldBillCurr,
        timestamp: new Date().toISOString(),
        convertedAmount: parseFloat(data.crdhldBillAmt)
      };
    } catch (error) {
      console.error('Error fetching Mastercard exchange rate:', error);
      throw error;
    }
  }

  public async getConversionRate(
    fxDate: string = '0000-00-00',
    transCurr: string,
    crdhldBillCurr: string,
    bankFee: number = 0,
    transAmt: number
  ): Promise<any> {
    try {
      const endpoint = `/settlement/currencyrate/conversion-rate`;
      const payload = {
        fxDate,
        transCurr,
        crdhldBillCurr,
        bankFee,
        transAmt
      };
      
      const response = await this.makeRequest(endpoint, 'GET', payload);

      // Log detailed response information
      console.log('Mastercard API Response Details:', {
        responseType: typeof response,
        responseKeys: response ? Object.keys(response) : [],
        fullResponse: response
      });

      // Check if response is an object and has the expected structure
      if (typeof response !== 'object' || response === null) {
        throw new Error('Invalid response format from Mastercard API');
      }

      // The response has a nested data object with the conversion details
      if (!response.data || !response.data.conversionRate || !response.data.crdhldBillAmt) {
        // Log the actual response structure for debugging
        console.log('Response structure:', JSON.stringify(response, null, 2));
        throw new Error('Missing required fields in Mastercard API response');
      }

      // Return the data object which contains the conversion details
      return response.data;
    } catch (error) {
      console.error('Error fetching Mastercard conversion rate:', error);
      throw error;
    }
  }
}

function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  return value;
}

// Create a singleton instance with environment variables
const config: MastercardConfig = {
  p12Path: 'cert/currency-exchange-sandbox.p12',
  p12Password: getRequiredEnvVar('MASTERCARD_P12_PASSWORD'),
  keyAlias: getRequiredEnvVar('MASTERCARD_KEY_ALIAS'),
  consumerKey: getRequiredEnvVar('MASTERCARD_CONSUMER_KEY'),
  baseUrl: process.env.MASTERCARD_BASE_URL || 'https://sandbox.api.mastercard.com'
};

// Debug environment variables
console.log('Mastercard API Configuration:', {
  ...config,
  p12Password: '***',
  consumerKey: '***',
  keyAlias: config.keyAlias
});

export const mastercardApi = new MastercardApiService(config); 