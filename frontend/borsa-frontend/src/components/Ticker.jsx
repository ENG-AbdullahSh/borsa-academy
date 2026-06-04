import React, { useEffect, useState } from 'react';

const ASSETS = [
  { key: 'BTCUSD', label: 'بيتكوين/دولار', initialValue: 64281.50, decimals: 2 },
  { key: 'GOLD', label: 'ذهب', initialValue: 2341.20, decimals: 2 },
  { key: 'EURUSD', label: 'يورو/دولار', initialValue: 1.0824, decimals: 4 },
  { key: 'ETHUSD', label: 'إيثيريوم/دولار', initialValue: 3450.12, decimals: 2 },
];

const initPrices = () => {
  const map = {};
  ASSETS.forEach(({ key, initialValue }) => {
    map[key] = { value: initialValue, change: 1.25, isUp: true };
  });
  return map;
};

export default function Ticker() {
  const [prices, setPrices] = useState(initPrices());

  useEffect(() => {
    const interval = setInterval(() => {
      setPrices((prev) => {
        const next = { ...prev };
        ASSETS.forEach(({ key, decimals }) => {
          const current = next[key];
          const isEUR = decimals === 4;
          const multiplier = isEUR ? 0.0001 : current.value * 0.0003;
          const rand = Math.random() - 0.47;
          const tick = rand * multiplier;
          const newValue = parseFloat((current.value + tick).toFixed(decimals));
          const newChange = parseFloat((current.change + rand * 0.04).toFixed(2));
          next[key] = { value: newValue, change: newChange, isUp: newChange >= 0 };
        });
        return next;
      });
    }, 2600);
    return () => clearInterval(interval);
  }, []);

  const renderItems = () =>
    ASSETS.map(({ key, label, decimals }) => {
      const data = prices[key];
      const color = data.isUp ? '#75ff9e' : '#ffb4ab';
      return (
        <div key={key} className="d-flex align-items-center gap-2 flex-shrink-0" style={{ padding: '0 28px' }}>
          {/* Asset key badge */}
          <span
            className="font-mono-data fw-bold"
            style={{ color: '#e1e2e7', fontSize: '12px', letterSpacing: '0.04em' }}
          >
            {key}
          </span>
          {/* Arabic label */}
          <span
            className="d-none d-lg-inline"
            style={{ color: '#7c8e7c', fontSize: '11px', fontFamily: 'var(--font-sans)' }}
          >
            ({label})
          </span>
          {/* Price */}
          <span className="font-mono-data fw-semibold" style={{ color, fontSize: '12px' }}>
            {data.value.toLocaleString('ar-SA', { minimumFractionDigits: decimals })}
          </span>
          {/* Change */}
          <span className="font-mono-data" style={{ color, fontSize: '11px' }}>
            {data.isUp ? '▲' : '▼'} {Math.abs(data.change).toFixed(2)}%
          </span>
        </div>
      );
    });

  return (
    <section
      className="overflow-hidden"
      style={{
        backgroundColor: '#191c1f',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <div className="animate-ticker" style={{ direction: 'ltr' /* ticker always LTR */ }}>
        {renderItems()}
        {renderItems()}
        {renderItems()}
      </div>
    </section>
  );
}
