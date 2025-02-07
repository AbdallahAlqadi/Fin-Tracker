import React, { useState } from 'react';
import '../cssStyle/installment.css';
import * as XLSX from 'xlsx';

const InstallmentForm = ({ onCalculate }) => {
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

    // Calculate the number of installments required
    const numberOfInstallments = Math.ceil(total / installment);

    // Calculate the final date based on the number of installments
    const calculatedEndDate = new Date(startDate);
    if (frequency === 'monthly') {
      calculatedEndDate.setMonth(calculatedEndDate.getMonth() + numberOfInstallments);
    } else if (frequency === 'yearly') {
      calculatedEndDate.setFullYear(calculatedEndDate.getFullYear() + numberOfInstallments);
    } else {
      const daysInterval = getDaysInterval(frequency);
      calculatedEndDate.setDate(calculatedEndDate.getDate() + daysInterval * numberOfInstallments);
    }

    // Check that the calculated end date does not exceed the specified end date
    if (calculatedEndDate > endDateObj) {
      setError('The number of installments is not enough to cover the total amount in the specified period.');
      return;
    }

    onCalculate({ total, installment, frequency, endDateObj });
  };

  const getDaysInterval = (type) => {
    switch (type) {
      case 'daily': return 1;
      case 'weekly': return 7;
      case 'monthly': return 30; // Handled separately
      case 'yearly': return 365; // Handled separately
      default: return 30;
    }
  };

  return (
    <div className="form-container">
      {error && <p className="error-text">{error}</p>}
      <div className="input-group">
        <label>Total Amount:</label>
        <input type="number" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} />
      </div>
      <div className="input-group">
        <label>End Date:</label>
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </div>
      <div className="input-group">
        <label>Installment Amount:</label>
        <input type="number" value={installmentAmount} onChange={(e) => setInstallmentAmount(e.target.value)} />
      </div>
      <div className="input-group">
        <label>Payment Frequency:</label>
        <select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>
      <button className="calculate-button" onClick={handleSubmit}>Calculate Installments</button>
    </div>
  );
};

const InstallmentTable = ({ installments, total }) => (
  <div className="table-container">
    <h2>Installment Schedule</h2>
    <table>
      <thead>
        <tr>
          <th>Installment #</th>
          <th>Date</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        {installments.map((installment, index) => (
          <tr key={index}>
            <td>{index + 1}</td>
            <td>{installment.date}</td>
            <td>{installment.amount.toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </table>
    <p>Total Amount: {total.toFixed(2)}</p>
  </div>
);

const InstallmentCalculator = () => {
  const [installments, setInstallments] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);

  const calculateInstallments = ({ total, installment, frequency, endDateObj }) => {
    let remainingAmount = total;
    let currentDate = new Date();
    const installmentDates = [];

    while (currentDate <= endDateObj && remainingAmount > 0) {
      const amount = Math.min(installment, remainingAmount);
      installmentDates.push({
        date: formatDate(currentDate), // Use a function to format the date
        amount: amount,
      });
      remainingAmount -= amount;

      // Update the date based on the frequency type
      if (frequency === 'monthly') {
        currentDate.setMonth(currentDate.getMonth() + 1); // Add a month
      } else if (frequency === 'yearly') {
        currentDate.setFullYear(currentDate.getFullYear() + 1); // Add a year
      } else {
        const daysInterval = getDaysInterval(frequency);
        currentDate.setDate(currentDate.getDate() + daysInterval); // Add days
      }
    }

    setInstallments(installmentDates.sort((a, b) => new Date(a.date) - new Date(b.date)));
    setTotalAmount(total);
  };

  // Function to format the date correctly (day/month/year)
  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months start from 0
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getDaysInterval = (type) => {
    switch (type) {
      case 'daily': return 1;
      case 'weekly': return 7;
      case 'monthly': return 30; // Handled separately
      case 'yearly': return 365; // Handled separately
      default: return 30;
    }
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(installments.map((installment, index) => ({
      'Installment #': index + 1,
      Date: installment.date,
      Amount: installment.amount.toFixed(2),
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Installments');

    // Add the total amount to the worksheet
    const totalRow = [{ 'Installment #': 'Total Amount', Amount: totalAmount.toFixed(2) }];
    const totalWorksheet = XLSX.utils.json_to_sheet(totalRow, { header: ['Installment #', 'Amount'] });
    XLSX.utils.book_append_sheet(workbook, totalWorksheet, 'Total');

    XLSX.writeFile(workbook, 'installments.xlsx');
  };

  return (
    <div className="calculator-container">
      <h1>Installment Calculator</h1>
      <div className="content-container">
        <InstallmentForm onCalculate={calculateInstallments} />
        {installments.length > 0 && (
          <>
            <InstallmentTable installments={installments} total={totalAmount} />
            <button className="export-button" onClick={exportToExcel}>Export to Excel</button>
          </>
        )}
      </div>
    </div>
  );
};

export default InstallmentCalculator;