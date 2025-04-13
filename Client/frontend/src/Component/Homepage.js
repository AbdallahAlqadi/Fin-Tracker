import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import '../cssStyle/Homepage.css';

const data = [
  { period: 'January', Revenue: 4000, Expenses: 2400 },
  { period: 'February', Revenue: 3000, Expenses: 1398 },
  { period: 'March', Revenue: 2000, Expenses: 9800 },
  { period: 'April', Revenue: 2780, Expenses: 3908 },
];

export default function HomePage() {
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'en');
  const [chartType, setChartType] = useState('bar');

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const translations = {
    en: {
      title: "Website Overview",
      features: {
        dataExport: {
          title: "Data Export",
          description: "Easily export data in multiple formats."
        },
        financialReports: {
          title: "Financial Reports",
          description: "Detailed and accurate financial reporting."
        },
        customExpenseCategories: {
          title: "Custom Expense Categories",
          description: "Tailor expense categories to your needs."
        },
        incomeExpenseTracking: {
          title: "Income & Expense Tracking",
          description: "Manage and track revenues and expenses efficiently."
        },
        dataComparison: {
          title: "Data Comparison",
          description: "Compare expenses and revenues over different days to gain insights."
        }
      },
      chartTitle: "Revenue vs. Expenses",
      chartButtons: {
        bar: "Bar Chart",
        line: "Line Chart"
      },
    },
    ar: {
      title: "نظرة عامة على الموقع",
      features: {
        dataExport: {
          title: "تصدير البيانات",
          description: "يمكنك تصدير البيانات بسهولة بصيغ متعددة."
        },
        financialReports: {
          title: "التقارير المالية",
          description: "تقارير مالية مفصلة ودقيقة."
        },
        customExpenseCategories: {
          title: "فئات المصاريف المخصصة",
          description: "تخصيص فئات المصاريف لتناسب احتياجاتك."
        },
        incomeExpenseTracking: {
          title: "متابعة الدخل والمصاريف",
          description: "إدارة وتتبع الإيرادات والمصاريف بكفاءة."
        },
        dataComparison: {
          title: "مقارنة البيانات",
          description: "قارن بين المصاريف والإيرادات عبر الأيام المختلفة للحصول على رؤى."
        }
      },
      chartTitle: "الإيرادات مقابل المصاريف",
      chartButtons: {
        bar: "مخطط الأعمدة",
        line: "مخطط الخط"
      },
    }
  };

  const arabicMonths = {
    January: "يناير",
    February: "فبراير",
    March: "مارس",
    April: "أبريل"
  };

  const translatedData = data.map(item => ({
    ...item,
    period: language === 'ar' ? (arabicMonths[item.period] || item.period) : item.period
  }));

  return (
    <div className="homepage-container" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="language-select">
        <select 
          value={language} 
          onChange={(e) => setLanguage(e.target.value)}
          className="language-dropdown"
        >
          <option value="en">English</option>
          <option value="ar">العربية</option>
        </select>
      </div>

      <h1 className="title">{translations[language].title}</h1>
      
      <div className="features-grid">
        <div className="feature-card">
          <h2>{translations[language].features.dataExport.title}</h2>
          <p>{translations[language].features.dataExport.description}</p>
        </div>
        <div className="feature-card">
          <h2>{translations[language].features.financialReports.title}</h2>
          <p>{translations[language].features.financialReports.description}</p>
        </div>
        <div className="feature-card">
          <h2>{translations[language].features.customExpenseCategories.title}</h2>
          <p>{translations[language].features.customExpenseCategories.description}</p>
        </div>
        <div className="feature-card">
          <h2>{translations[language].features.incomeExpenseTracking.title}</h2>
          <p>{translations[language].features.incomeExpenseTracking.description}</p>
        </div>
        <div className="feature-card">
          <h2>{translations[language].features.dataComparison.title}</h2>
          <p>{translations[language].features.dataComparison.description}</p>
        </div>
      </div>
      
      <div className="chart-container">
        <h2 className="chart-title">{translations[language].chartTitle}</h2>
        <div className="chart-buttons">
          <button 
            className={`chart-button ${chartType === 'bar' ? 'active' : ''}`}
            onClick={() => setChartType('bar')}
          >
            {translations[language].chartButtons.bar}
          </button>
          <button 
            className={`chart-button ${chartType === 'line' ? 'active' : ''}`}
            onClick={() => setChartType('line')}
          >
            {translations[language].chartButtons.line}
          </button>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          {chartType === 'bar' ? (
            <BarChart data={translatedData}>
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Revenue" fill="#4CAF50" barSize={50} />
              <Bar dataKey="Expenses" fill="#F44336" barSize={50} />
            </BarChart>
          ) : (
            <LineChart data={translatedData}>
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