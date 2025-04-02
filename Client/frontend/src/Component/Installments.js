import React, { useState } from 'react';
import '../cssStyle/installment.css';
import * as XLSX from 'xlsx';

const InstallmentForm = ({ onCalculate, onClose }) => {
  const [totalAmount, setTotalAmount] = useState('');
  const [endDate, setEndDate] = useState('');
  const [installmentAmount, setInstallmentAmount] = useState('');
  const [frequency, setFrequency] = useState('monthly');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    setError('');
    const total = parseFloat(totalAmount);
    const installment = parseFloat(installmentAmount);
    const startDate = new Date();
    const endDateObj = new Date(endDate);

    if (!totalAmount || isNaN(total) || total <= 0) {
      setError('Please enter a valid total amount greater than zero.');
      return;
    }
    if (!installmentAmount || isNaN(installment) || installment <= 0) {
      setError('Please enter a valid installment amount greater than zero.');
      return;
    }
    if (!endDate) {
      setError('Please enter a valid end date.');
      return;
    }
    if (startDate >= endDateObj) {
      setError('The end date must be after today.');
      return;
    }
    if (installment > total) {
      setError('The installment amount must be less than or equal to the total amount.');
      return;
    }

    const numberOfInstallments = Math.ceil(total / installment);
    const calculatedEndDate = new Date(startDate);
    if (frequency === 'monthly') {
      calculatedEndDate.setMonth(calculatedEndDate.getMonth() + numberOfInstallments);
    } else if (frequency === 'yearly') {
      calculatedEndDate.setFullYear(calculatedEndDate.getFullYear() + numberOfInstallments);
    } else {
      const daysInterval = getDaysInterval(frequency);
      calculatedEndDate.setDate(calculatedEndDate.getDate() + daysInterval * numberOfInstallments);
    }

    if (calculatedEndDate > endDateObj) {
      setError('The number of installments is not enough to cover the total amount in the specified period.');
      return;
    }

    onCalculate({ total, installment, frequency, endDateObj });
    onClose();
  };

  const getDaysInterval = (type) => {
    switch (type) {
      case 'daily': return 1;
      case 'weekly': return 7;
      case 'monthly': return 30;
      case 'yearly': return 365;
      default: return 30;
    }
  };

  return (
    <div className="dialog-box">
      <div className="dialog-content">
        <h2 style={{ marginBottom: '1.5rem', color: '#2c3e50' }}>Payment Plan Calculator</h2>
        {error && (
          <div className="error-text">
            <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {error}
          </div>
        )}
        <div className="input-group">
          <label>Total Amount ($)</label>
          <input
            type="number"
            placeholder="Enter total amount"
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
          />
        </div>
        <div className="input-group">
          <label>End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
        <div className="input-group">
          <label>Installment Amount ($)</label>
          <input
            type="number"
            placeholder="Enter installment amount"
            value={installmentAmount}
            onChange={(e) => setInstallmentAmount(e.target.value)}
          />
        </div>
        <div className="input-group">
          <label>Payment Frequency</label>
          <select className="custom-select" value={frequency} onChange={(e) => setFrequency(e.target.value)}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
        <div className="button-container">
          <button className="calculate-button" onClick={handleSubmit}>
            <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Generate Plan
          </button>
          <button className="close-button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const InstallmentTable = ({ installments, total }) => (
  <div className="table-container">
    <h3 style={{ color: '#2c3e50', marginBottom: '1rem' }}>Payment Schedule</h3>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Due Date</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        {installments.map((installment, index) => (
          <tr key={index}>
            <td>{index + 1}</td>
            <td>{installment.date}</td>
            <td>${installment.amount.toFixed(2)}</td>
          </tr>
        ))}
        <tr style={{ fontWeight: '600' }}>
          <td colSpan="2">Total Amount</td>
          <td>${total.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>
  </div>
);

const InstallmentCalculator = () => {
  const [installments, setInstallments] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [showDialog, setShowDialog] = useState(false);

  const calculateInstallments = ({ total, installment, frequency, endDateObj }) => {
    let remainingAmount = total;
    let currentDate = new Date();
    const installmentDates = [];

    while (currentDate <= endDateObj && remainingAmount > 0) {
      const amount = Math.min(installment, remainingAmount);
      installmentDates.push({
        date: formatDate(currentDate),
        amount: amount,
      });
      remainingAmount -= amount;

      if (frequency === 'monthly') {
        currentDate.setMonth(currentDate.getMonth() + 1);
      } else if (frequency === 'yearly') {
        currentDate.setFullYear(currentDate.getFullYear() + 1);
      } else {
        const daysInterval = getDaysInterval(frequency);
        currentDate.setDate(currentDate.getDate() + daysInterval);
      }
    }

    setInstallments(installmentDates.sort((a, b) => new Date(a.date) - new Date(b.date)));
    setTotalAmount(total);
  };

  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getDaysInterval = (type) => {
    switch (type) {
      case 'daily': return 1;
      case 'weekly': return 7;
      case 'monthly': return 30;
      case 'yearly': return 365;
      default: return 30;
    }
  };

  const exportToExcel = () => {
    const worksheetData = installments.map((installment, index) => ({
      'Installment #': index + 1,
      'Date': installment.date,
      'Amount': installment.amount.toFixed(2),
    }));

    worksheetData.push({
      'Installment #': 'Total',
      'Date': '',
      'Amount': totalAmount.toFixed(2),
    });

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Installments');
    XLSX.writeFile(workbook, 'installments.xlsx');
  };

  return (
    <div className="calculator-container">
      <h1>Payment Plan Calculator</h1>
      <div className="content-container">
        <button className="open-dialog-button" onClick={() => setShowDialog(true)}>
          <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Create New Plan
        </button>

        {showDialog && (
          <InstallmentForm
            onCalculate={calculateInstallments}
            onClose={() => setShowDialog(false)}
          />
        )}

        {installments.length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <InstallmentTable installments={installments} total={totalAmount} />
            <button className="export-button" onClick={exportToExcel}>
              <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              Export to Excel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstallmentCalculator;