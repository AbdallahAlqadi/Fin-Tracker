import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LineChart, Line, CartesianGrid, Area, AreaChart } from 'recharts';
import '../cssStyle/Homepage.css';

const data = [
  { period: 'January', Revenue: 4000, Expenses: 2400, Profit: 1600 },
  { period: 'February', Revenue: 3000, Expenses: 1398, Profit: 1602 },
  { period: 'March', Revenue: 2000, Expenses: 9800, Profit: -7800 },
  { period: 'April', Revenue: 2780, Expenses: 3908, Profit: -1128 },
  { period: 'May', Revenue: 5890, Expenses: 4800, Profit: 1090 },
  { period: 'June', Revenue: 4390, Expenses: 3800, Profit: 590 },
];

export default function HomePage() {
  const [chartType, setChartType] = useState('bar');

  const translations = {
    title: "Financial Dashboard",
    subtitle: "Track your financial performance with ease",
    features: {
      dataExport: {
        title: "Data Export",
        description: "Easily export data in multiple formats including PDF, Excel, and CSV."
      },
      financialReports: {
        title: "Financial Reports",
        description: "Generate detailed and accurate financial reports with just a few clicks."
      },
      customExpenseCategories: {
        title: "Custom Categories",
        description: "Create and manage custom expense categories tailored to your business needs."
      },
      incomeExpenseTracking: {
        title: "Income & Expense Tracking",
        description: "Monitor and analyze your revenues and expenses with powerful visualization tools."
      },
      dataComparison: {
        title: "Data Comparison",
        description: "Compare financial data across different time periods to identify trends and insights."
      }
    },
    chartTitle: "Revenue vs. Expenses",
    chartButtons: {
      bar: "Bar Chart",
      line: "Line Chart",
      area: "Area Chart"
    },
    period: "Period",
    amount: "Amount",
    currency: "$",
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{`${label}`}</p>
          {payload.map((entry, index) => (
            <p key={`item-${index}`} style={{ color: entry.color }}>
              {`${entry.name}: ${translations.currency}${entry.value.toLocaleString()}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="homepage-container">
      <header className="header">
        <div className="header-content">
          <h1 className="title">{translations.title}</h1>
          <p className="subtitle">{translations.subtitle}</p>
        </div>
      </header>
      
      <section className="features-section">
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </div>
            <h2>{translations.features.dataExport.title}</h2>
            <p>{translations.features.dataExport.description}</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="9" y1="21" x2="9" y2="9"></line>
              </svg>
            </div>
            <h2>{translations.features.financialReports.title}</h2>
            <p>{translations.features.financialReports.description}</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34"></path>
                <polygon points="18 2 22 6 12 16 8 16 8 12 18 2"></polygon>
              </svg>
            </div>
            <h2>{translations.features.customExpenseCategories.title}</h2>
            <p>{translations.features.customExpenseCategories.description}</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
            <h2>{translations.features.incomeExpenseTracking.title}</h2>
            <p>{translations.features.incomeExpenseTracking.description}</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
            </div>
            <h2>{translations.features.dataComparison.title}</h2>
            <p>{translations.features.dataComparison.description}</p>
          </div>
        </div>
      </section>
      
      <section className="chart-section">
        <div className="chart-container">
          <h2 className="chart-title">{translations.chartTitle}</h2>
          <div className="chart-buttons">
            <button 
              className={`chart-button ${chartType === 'bar' ? 'active' : ''}`}
              onClick={( ) => setChartType('bar')}
              aria-pressed={chartType === 'bar'}
            >
              {translations.chartButtons.bar}
            </button>
            <button 
              className={`chart-button ${chartType === 'line' ? 'active' : ''}`}
              onClick={() => setChartType('line')}
              aria-pressed={chartType === 'line'}
            >
              {translations.chartButtons.line}
            </button>
            <button 
              className={`chart-button ${chartType === 'area' ? 'active' : ''}`}
              onClick={() => setChartType('area')}
              aria-pressed={chartType === 'area'}
            >
              {translations.chartButtons.area}
            </button>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={450}>
              {chartType === 'bar' ? (
                <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="period" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: "20px" }} />
                  <Bar dataKey="Revenue" fill="url(#colorRevenue)" barSize={40} radius={[8, 8, 0, 0]} />
                  <Bar dataKey="Expenses" fill="url(#colorExpenses)" barSize={40} radius={[8, 8, 0, 0]} />
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4CAF50" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#4CAF50" stopOpacity={0.6}/>
                    </linearGradient>
                    <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F44336" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#F44336" stopOpacity={0.6}/>
                    </linearGradient>
                  </defs>
                </BarChart>
              ) : chartType === 'line' ? (
                <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="period" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: "20px" }} />
                  <Line 
                    type="monotone" 
                    dataKey="Revenue" 
                    stroke="#4CAF50" 
                    strokeWidth={3} 
                    dot={{ r: 6, fill: "#4CAF50", strokeWidth: 2, stroke: "#fff" }} 
                    activeDot={{ r: 8, fill: "#4CAF50", strokeWidth: 0 }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Expenses" 
                    stroke="#F44336" 
                    strokeWidth={3} 
                    dot={{ r: 6, fill: "#F44336", strokeWidth: 2, stroke: "#fff" }} 
                    activeDot={{ r: 8, fill: "#F44336", strokeWidth: 0 }} 
                  />
                </LineChart>
              ) : (
                <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="period" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: "20px" }} />
                  <defs>
                    <linearGradient id="colorRevenueArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#4CAF50" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorExpensesArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F44336" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#F44336" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone" 
                    dataKey="Revenue" 
                    stroke="#4CAF50" 
                    fillOpacity={1} 
                    fill="url(#colorRevenueArea)" 
                    strokeWidth={2}
                    activeDot={{ r: 8, strokeWidth: 0 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Expenses" 
                    stroke="#F44336" 
                    fillOpacity={1} 
                    fill="url(#colorExpensesArea)" 
                    strokeWidth={2}
                    activeDot={{ r: 8, strokeWidth: 0 }}
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </section>
      
      <footer className="footer">
        <p>&copy; 2025 Financial Dashboard. All rights reserved.</p>
      </footer>
    </div>
  );
}
