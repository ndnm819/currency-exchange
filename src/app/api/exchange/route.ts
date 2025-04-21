import { NextResponse } from 'next/server';
import { getVisaExchangeRate } from '../../../services/visaApi';
import { CURRENCIES } from '../../../constants';

export const dynamic = 'force-dynamic';

function isValidCurrencyCode(code: string): boolean {
  return CURRENCIES.some(currency => currency.numericCode === code);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sourceCurrency = searchParams.get('sourceCurrency');
    const destinationCurrency = searchParams.get('destinationCurrency');
    const amount = searchParams.get('amount');
    const markupRate = searchParams.get('markupRate');

    console.log('API Route - Request parameters:', {
      sourceCurrency,
      destinationCurrency,
      amount,
      markupRate
    });

    if (!sourceCurrency || !destinationCurrency || !amount || !markupRate) {
      console.error('API Route - Missing parameters');
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    if (!isValidCurrencyCode(sourceCurrency) || !isValidCurrencyCode(destinationCurrency)) {
      console.error('API Route - Invalid currency code');
      return NextResponse.json(
        { error: 'Invalid currency code. Please use valid ISO 4217 numeric currency codes.' },
        { status: 400 }
      );
    }

    const rate = await getVisaExchangeRate(
      sourceCurrency,
      destinationCurrency,
      Number(amount),
      Number(markupRate)
    );

    console.log('API Route - Successful response:', rate);
    return NextResponse.json({
      convertedAmount: rate.convertedAmount,
      exchangeRate: rate.exchangeRate,
      sourceCurrency: rate.sourceCurrency,
      destinationCurrency: rate.destinationCurrency,
      timestamp: rate.timestamp
    });
  } catch (error: unknown) {
    console.error('API Route - Detailed error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch exchange rate' },
      { status: 500 }
    );
  }
} 