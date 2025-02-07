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
    onClose(); // Close the dialog after calculation
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
        <h2>Installment Calculator</h2>
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
          <select className="custom-select" value={frequency} onChange={(e) => setFrequency(e.target.value)}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
        <button className="calculate-button" onClick={handleSubmit}>Calculate Installments</button>
        <button className="close-button" onClick={onClose}>Close</button>
      </div>
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

    // Add total row
    worksheetData.push({
      'Installment #': 'Total',
      'Date': '',
      'Amount': totalAmount.toFixed(2),
    });

    const worksheet = XLSX.utils.json_to_sheet(worksheetData, { header: ['Installment #', 'Date', 'Amount'] });

    // Apply some styling
    const wscols = [
      { wch: 15 }, // Installment # column width
      { wch: 15 }, // Date column width
      { wch: 15 }, // Amount column width
    ];
    worksheet['!cols'] = wscols;

    // Add bold font to the header
    const headerStyle = { font: { bold: true } };
    for (let col = 0; col < 3; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellRef].s) worksheet[cellRef].s = {};
      worksheet[cellRef].s = headerStyle;
    }

    // Add bold font to the total row
    const totalRowRef = XLSX.utils.encode_cell({ r: worksheetData.length, c: 2 });
    if (!worksheet[totalRowRef].s) worksheet[totalRowRef].s = {};
    worksheet[totalRowRef].s = headerStyle;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Installments');

    XLSX.writeFile(workbook, 'installments.xlsx');
  };

  return (
    <div className="calculator-container">
      <h1 style={{fontFamily:'-moz-initial'}}>Installment Calculator</h1>
      <div className="content-container">
        <button className="open-dialog-button" onClick={() => setShowDialog(true)}>Open Calculator</button>
        {showDialog && (
          <InstallmentForm
            onCalculate={calculateInstallments}
            onClose={() => setShowDialog(false)}
          />
        )}
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