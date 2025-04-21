'use client';

import { useState, useEffect } from 'react';
import { CardNetwork, Currency, ExchangeRateResponse } from '../types';
import { CURRENCIES, BANKS } from '../constants';
import { Combobox } from '@headlessui/react';

export default function Home() {
  const [sourceCurrency, setSourceCurrency] = useState<Currency>(CURRENCIES[0]);
  const [destinationCurrency, setDestinationCurrency] = useState<Currency>(CURRENCIES[1]);
  const [amount, setAmount] = useState<number>(100);
  const [cardNetwork, setCardNetwork] = useState<CardNetwork>('visa');
  const [markupRate, setMarkupRate] = useState<number>(0);
  const [isBankSelection, setIsBankSelection] = useState<boolean>(false);
  const [selectedBank, setSelectedBank] = useState<string>('');
  const [exchangeData, setExchangeData] = useState<ExchangeRateResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [sourceQuery, setSourceQuery] = useState('');
  const [destinationQuery, setDestinationQuery] = useState('');

  const filteredSourceCurrencies = sourceQuery === ''
    ? CURRENCIES
    : CURRENCIES.filter((currency) =>
        `${currency.name} ${currency.code} ${currency.numericCode}`
          .toLowerCase()
          .includes(sourceQuery.toLowerCase())
      );

  const filteredDestinationCurrencies = destinationQuery === ''
    ? CURRENCIES
    : CURRENCIES.filter((currency) =>
        `${currency.name} ${currency.code} ${currency.numericCode}`
          .toLowerCase()
          .includes(destinationQuery.toLowerCase())
      );

  const fetchExchangeRate = async () => {
    if (!sourceCurrency || !destinationCurrency) return;
    
    setIsLoading(true);
    setError(null);
    try {
      console.log('Fetching exchange rate with params:', {
        sourceCurrency: sourceCurrency.numericCode,
        destinationCurrency: destinationCurrency.numericCode,
        amount,
        markupRate
      });
      
      const response = await fetch(
        `/api/exchange?sourceCurrency=${sourceCurrency.numericCode}&destinationCurrency=${destinationCurrency.numericCode}&amount=${amount}&markupRate=0`
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error || 'Failed to fetch exchange rate');
      }

      const data = await response.json();
      console.log('API Response:', data);
      
      // Apply markup rate calculation on client side (markupRate is in percentage)
      const finalAmount = data.convertedAmount * (1 + markupRate / 100);
      setExchangeData({
        ...data,
        convertedAmount: finalAmount
      });
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      setExchangeData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExchangeRate();
  }, [sourceCurrency, destinationCurrency, amount, cardNetwork, markupRate]);

  const handleBankSelect = (bankName: string) => {
    const bank = BANKS.find(b => b.name === bankName);
    if (bank) {
      setMarkupRate(bank.markupRate);
      setSelectedBank(bankName);
    }
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Currency Exchange Calculator</h1>
        
        <div className="space-y-6">
          {/* Currency Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">From Currency</label>
              <Combobox value={sourceCurrency} onChange={setSourceCurrency}>
                <div className="relative">
                  <Combobox.Input
                    className="w-full p-2 border rounded"
                    onChange={(event) => setSourceQuery(event.target.value)}
                    displayValue={(currency: Currency) => currency ? `${currency.name} (${currency.code})` : ''}
                  />
                  <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                    {filteredSourceCurrencies.map((currency) => (
                      <Combobox.Option
                        key={currency.code}
                        value={currency}
                        className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-10 pr-4 ${
                            active ? 'bg-blue-600 text-white' : 'text-gray-900'
                          }`
                        }
                      >
                        {({ selected, active }) => (
                          <>
                            <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                              {currency.name} ({currency.code})
                            </span>
                            {selected ? (
                              <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                active ? 'text-white' : 'text-blue-600'
                              }`}>
                                ✓
                              </span>
                            ) : null}
                          </>
                        )}
                      </Combobox.Option>
                    ))}
                  </Combobox.Options>
                </div>
              </Combobox>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">To Currency</label>
              <Combobox value={destinationCurrency} onChange={setDestinationCurrency}>
                <div className="relative">
                  <Combobox.Input
                    className="w-full p-2 border rounded"
                    onChange={(event) => setDestinationQuery(event.target.value)}
                    displayValue={(currency: Currency) => currency ? `${currency.name} (${currency.code})` : ''}
                  />
                  <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                    {filteredDestinationCurrencies.map((currency) => (
                      <Combobox.Option
                        key={currency.code}
                        value={currency}
                        className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-10 pr-4 ${
                            active ? 'bg-blue-600 text-white' : 'text-gray-900'
                          }`
                        }
                      >
                        {({ selected, active }) => (
                          <>
                            <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                              {currency.name} ({currency.code})
                            </span>
                            {selected ? (
                              <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                active ? 'text-white' : 'text-blue-600'
                              }`}>
                                ✓
                              </span>
                            ) : null}
                          </>
                        )}
                      </Combobox.Option>
                    ))}
                  </Combobox.Options>
                </div>
              </Combobox>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium mb-2">Amount</label>
            <input
              type="number"
              className="w-full p-2 border rounded"
              value={amount}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(Number(e.target.value))}
              min="0"
            />
          </div>

          {/* Card Network Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Card Network</label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="cardNetwork"
                  value="visa"
                  checked={cardNetwork === 'visa'}
                  onChange={() => setCardNetwork('visa')}
                  className="mr-2"
                />
                Visa
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="cardNetwork"
                  value="mastercard"
                  checked={cardNetwork === 'mastercard'}
                  onChange={() => setCardNetwork('mastercard')}
                  className="mr-2"
                />
                Mastercard
              </label>
            </div>
          </div>

          {/* Bank Markup Rate */}
          <div>
            <label className="block text-sm font-medium mb-2">Bank Markup Rate (%)</label>
            {isBankSelection ? (
              <div>
                <select
                  className="w-full p-2 border rounded"
                  value={selectedBank}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleBankSelect(e.target.value)}
                >
                  <option value="">Select a bank</option>
                  {BANKS.map(bank => (
                    <option key={bank.name} value={bank.name}>
                      {bank.name} ({bank.markupRate}%)
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setIsBankSelection(false)}
                  className="text-blue-500 hover:underline mt-2"
                >
                  Manual input
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="number"
                  className="w-full p-2 border rounded"
                  value={markupRate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMarkupRate(Number(e.target.value))}
                  step="0.01"
                  min="0"
                />
                <button
                  type="button"
                  onClick={() => setIsBankSelection(true)}
                  className="text-blue-500 hover:underline mt-2"
                >
                  I don't know
                </button>
              </div>
            )}
          </div>

          {/* Exchange Rate Display */}
          <div className="p-4 bg-gray-50 rounded">
            <h2 className="text-lg font-semibold mb-2">Exchange Result</h2>
            {isLoading ? (
              <p>Loading...</p>
            ) : error ? (
              <p className="text-red-500">{error}</p>
            ) : exchangeData && sourceCurrency && destinationCurrency ? (
              <div>
                <p className="text-2xl font-bold mb-2">
                  {amount} {sourceCurrency.code} = {exchangeData.convertedAmount.toFixed(2)} {destinationCurrency.code}
                </p>
                <p className="text-sm text-gray-600">
                  1 {sourceCurrency.code} = {exchangeData.exchangeRate.toFixed(4)} {destinationCurrency.code}
                </p>
                {markupRate > 0 && (
                  <p className="text-sm text-gray-600 mt-2">
                    Including {markupRate}% markup rate
                  </p>
                )}
              </div>
            ) : (
              <p>No exchange rate available</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
} 