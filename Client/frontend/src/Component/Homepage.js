import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import '../cssStyle/Homepage.css'

const data = [
  { period: 'January', Revenue: 4000, Expenses: 2400 },
  { period: 'February', Revenue: 3000, Expenses: 1398 },
  { period: 'March', Revenue: 2000, Expenses: 9800 },
  { period: 'April', Revenue: 2780, Expenses: 3908 },
];

export default function HomePage() {
  const [chartType, setChartType] = useState('bar');

  return (
    <div className="homepage-container">
      <h1 className="title">Website Overview</h1>
      
      <div className="features-grid">
        <div className="feature-card">
          <h2>Data Export</h2>
          <p>Easily export data in multiple formats.</p>
        </div>
        <div className="feature-card">
          <h2>Financial Reports</h2>
          <p>Detailed and accurate financial reporting.</p>
        </div>
        <div className="feature-card">
          <h2>Custom Expense Categories</h2>
          <p>Tailor expense categories to your needs.</p>
        </div>
        <div className="feature-card">
          <h2>Income & Expense Tracking</h2>
          <p>Manage and track revenues and expenses efficiently.</p>
        </div>
      </div>
      
      <div className="chart-container">
        <h2 className="chart-title">Revenue vs. Expenses</h2>
        <div className="chart-buttons">
          <button className="chart-button" onClick={() => setChartType('bar')}>Bar Chart</button>
          <button className="chart-button" onClick={() => setChartType('line')}>Line Chart</button>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          {chartType === 'bar' ? (
            <BarChart data={data}>
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Revenue" fill="#4CAF50" barSize={50} />
              <Bar dataKey="Expenses" fill="#F44336" barSize={50} />
            </BarChart>
          ) : (
            <LineChart data={data}>
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Revenue" stroke="#4CAF50" strokeWidth={3} />
              <Line type="monotone" dataKey="Expenses" stroke="#F44336" strokeWidth={3} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
