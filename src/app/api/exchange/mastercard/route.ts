import { NextResponse } from 'next/server';
import { MastercardApiService } from '../../../../services/mastercardApi';
import { CURRENCIES } from '../../../../constants';

export const dynamic = 'force-dynamic';

function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  return value;
}

// Initialize the API client with environment variables
const mastercardApi = new MastercardApiService({
  p12Path: 'cert/currency-exchange-sandbox.p12',
  p12Password: getRequiredEnvVar('MASTERCARD_P12_PASSWORD'),
  keyAlias: getRequiredEnvVar('MASTERCARD_KEY_ALIAS'),
  consumerKey: getRequiredEnvVar('MASTERCARD_CONSUMER_KEY'),
  baseUrl: process.env.MASTERCARD_BASE_URL || 'https://sandbox.api.mastercard.com'
});

function isValidCurrencyCode(code: string): boolean {
  return CURRENCIES.some(currency => currency.code === code);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sourceCurrency = searchParams.get('sourceCurrency');
    const destinationCurrency = searchParams.get('destinationCurrency');
    const amount = parseFloat(searchParams.get('amount') || '0');

    if (!sourceCurrency || !destinationCurrency || isNaN(amount)) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    console.log('Mastercard API Route - Request parameters:', {
      sourceCurrency,
      destinationCurrency,
      amount
    });

    const response = await mastercardApi.getExchangeRate(
      sourceCurrency,
      destinationCurrency,
      amount
    );

    console.log('Mastercard API Route - Response:', response);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Mastercard API Route - Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exchange rate' },
      { status: 500 }
    );
  }
} 