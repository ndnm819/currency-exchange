export type CardNetwork = 'visa' | 'mastercard';

export interface Currency {
  code: string;
  name: string;
  numericCode: string;
}

export interface Bank {
  name: string;
  markupRate: number;
}

export interface ExchangeRateResponse {
  convertedAmount: number;
  exchangeRate: number;
  sourceCurrency: string;
  destinationCurrency: string;
  timestamp: string;
} 