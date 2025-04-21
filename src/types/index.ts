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
  exchangeRate: number;
  sourceCurrency: string;
  destinationCurrency: string;
  timestamp: string;
}

export type CardNetwork = 'visa' | 'mastercard'; 