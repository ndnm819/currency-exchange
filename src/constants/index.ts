import { Bank } from '../types';

export const BANKS: Bank[] = [
  { name: 'Standard Chartered', markupRate: 3.5 },
  { name: 'Citibank', markupRate: 3.25 },
  { name: 'DBS', markupRate: 3.25 },
  { name: 'HSBC', markupRate: 3.25 },
  { name: 'Maybank', markupRate: 3.25 },
  { name: 'OCBC', markupRate: 3.25 },
  { name: 'UOB', markupRate: 3.25 },
  { name: 'BOC', markupRate: 3 },
  { name: 'CIMB', markupRate: 3 },
  { name: 'Amaze', markupRate: 2 },
  { name: 'YouTrip', markupRate: 0 },
  { name: 'Trust Bank', markupRate: 0 },
];

export const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', numericCode: '840' },
  { code: 'EUR', name: 'Euro', numericCode: '978' },
  { code: 'GBP', name: 'British Pound', numericCode: '826' },
  { code: 'JPY', name: 'Japanese Yen', numericCode: '392' },
  { code: 'AUD', name: 'Australian Dollar', numericCode: '036' },
  { code: 'CAD', name: 'Canadian Dollar', numericCode: '124' },
  { code: 'CHF', name: 'Swiss Franc', numericCode: '756' },
  { code: 'CNY', name: 'Chinese Yuan', numericCode: '156' },
  { code: 'HKD', name: 'Hong Kong Dollar', numericCode: '344' },
  { code: 'SGD', name: 'Singapore Dollar', numericCode: '702' },
]; 