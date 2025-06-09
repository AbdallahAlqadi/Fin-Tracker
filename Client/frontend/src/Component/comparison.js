import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  FormControl,
  InputLabel,
  Typography,
  CircularProgress,
  RadioGroup,
  FormControlLabel,
  Radio,
  MenuItem,
  Select,
  Checkbox,
  Grid,
  Paper,
  Chip,
  Tooltip,
  IconButton,
  Fade,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { styled } from "@mui/system";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from "chart.js";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import BarChartIcon from "@mui/icons-material/BarChart";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import PaidOutlinedIcon from "@mui/icons-material/PaidOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import DateRangeIcon from "@mui/icons-material/DateRange";
import EventIcon from "@mui/icons-material/Event";
import "../cssStyle/comparsion.css";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

// --- قائمة العملات ---
const currencies = [
    { code: "JOD", name: "Jordanian Dinar", symbol: "JOD" },
    { code: "USD", name: "US Dollar", symbol: "$" },
    { code: "EUR", name: "Euro", symbol: "€" },
    { code: "GBP", name: "British Pound", symbol: "£" },
    { code: "SAR", name: "Saudi Riyal", symbol: "SAR" },
    { code: "AED", name: "UAE Dirham", symbol: "AED" },
    { code: "EGP", name: "Egyptian Pound", symbol: "EGP" },
    { code: "KWD", name: "Kuwaiti Dinar", symbol: "KWD" },
    { code: "QAR", name: "Qatari Riyal", symbol: "QAR" },
    { code: "BHD", name: "Bahraini Dinar", symbol: "BHD" },
    { code: "OMR", name: "Omani Rial", symbol: "OMR" },
    { code: "LBP", name: "Lebanese Pound", symbol: "LBP" },
    { code: "SYP", name: "Syrian Pound", symbol: "SYP" },
    { code: "IQD", name: "Iraqi Dinar", symbol: "IQD" },
    { code: "TRY", name: "Turkish Lira", symbol: "₺" },
    { code: "JPY", name: "Japanese Yen", symbol: "¥" },
    { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
    { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
    { code: "AUD", name: "Australian Dollar", symbol: "A$" },
    { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
];

// Styled components with modern design principles
const StyledContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4, 5, 6),
  background: "linear-gradient(145deg, #f9fafe 0%, #eef2ff 100%)",
  borderRadius: "24px",
  boxShadow: "0 10px 40px rgba(0, 0, 0, 0.08)",
  maxWidth: "1200px",
  margin: "40px auto",
  transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
  "&:hover": {
    transform: "translateY(-5px)",
    boxShadow: "0 15px 50px rgba(0, 0, 0, 0.12)",
  },
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(3),
    borderRadius: "20px",
  },
}));

const ControlPanel = styled(Paper)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  padding: theme.spacing(3, 4),
  borderRadius: "20px",
  background: "rgba(255, 255, 255, 0.9)",
  backdropFilter: "blur(10px)",
  boxShadow: "0 8px 32px rgba(31, 38, 135, 0.1)",
  border: "1px solid rgba(255, 255, 255, 0.18)",
  transition: "all 0.3s ease",
  "&:hover": {
    boxShadow: "0 8px 32px rgba(31, 38, 135, 0.15)",
  },
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(2),
  },
}));

const StyledSelect = styled(Select)(({ theme }) => ({
  borderRadius: "14px",
  backgroundColor: "rgba(255, 255, 255, 0.8)",
  backdropFilter: "blur(5px)",
  boxShadow: "0 4px 15px rgba(0, 0, 0, 0.05)",
  transition: "all 0.3s ease",
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(0, 0, 0, 0.1)",
    borderWidth: "1px",
  },
  "&:hover": {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.palette.primary.light,
    },
  },
  "&.Mui-focused": {
    backgroundColor: "#ffffff",
    boxShadow: "0 0 0 2px rgba(63, 81, 181, 0.2)",
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.palette.primary.main,
      borderWidth: "2px",
    },
  },
}));

const StyledCheckbox = styled(Checkbox)(({ theme }) => ({
  color: theme.palette.secondary.main,
  padding: "10px",
  "&.Mui-checked": {
    color: theme.palette.primary.main,
  },
  "& .MuiSvgIcon-root": {
    fontSize: 24,
    transition: "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
  },
  "&:hover": {
    backgroundColor: "rgba(63, 81, 181, 0.08)",
    "& .MuiSvgIcon-root": {
      transform: "scale(1.1)",
    },
  },
}));

const StyledRadio = styled(Radio)(({ theme }) => ({
  color: theme.palette.text.secondary,
  padding: "10px",
  "&.Mui-checked": {
    color: theme.palette.primary.main,
  },
  "& .MuiSvgIcon-root": {
    fontSize: 24,
    transition: "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
  },
  "&:hover": {
    backgroundColor: "rgba(63, 81, 181, 0.08)",
    "& .MuiSvgIcon-root": {
      transform: "scale(1.1)",
    },
  },
}));

const FilterChip = styled(Chip)(({ theme, selected }) => ({
  margin: theme.spacing(0.5),
  borderRadius: "12px",
  fontWeight: 500,
  transition: "all 0.2s ease",
  backgroundColor: selected ? theme.palette.primary.main : "rgba(255, 255, 255, 0.9)",
  color: selected ? "#fff" : theme.palette.text.primary,
  border: selected ? "none" : "1px solid rgba(0, 0, 0, 0.12)",
  boxShadow: selected ? "0 4px 10px rgba(63, 81, 181, 0.25)" : "none",
  "&:hover": {
    backgroundColor: selected ? theme.palette.primary.dark : "rgba(63, 81, 181, 0.08)",
    transform: "translateY(-2px)",
    boxShadow: selected 
      ? "0 6px 12px rgba(63, 81, 181, 0.3)" 
      : "0 4px 8px rgba(0, 0, 0, 0.1)",
  },
  "&:active": {
    transform: "translateY(0)",
    boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
  },
}));

const ChartContainer = styled(Box)(({ theme }) => ({
  width: "100%",
  height: "500px",
  position: "relative",
  backgroundColor: "#ffffff",
  borderRadius: "20px",
  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
  padding: theme.spacing(3),
  transition: "all 0.3s ease",
  "&:hover": {
    boxShadow: "0 15px 35px rgba(0, 0, 0, 0.12)",
  },
  [theme.breakpoints.down("sm")]: {
    height: "400px",
    padding: theme.spacing(2),
  },
}));

const MonthCard = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  padding: theme.spacing(3),
  borderRadius: "16px",
  background: "linear-gradient(145deg, #ffffff 0%, #f9fafc 100%)",
  boxShadow: "0 6px 20px rgba(0, 0, 0, 0.06)",
  transition: "all 0.3s ease",
  border: "1px solid rgba(230, 230, 250, 0.7)",
  "&:hover": {
    transform: "translateY(-3px)",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
  },
}));

const EmptyStateContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  height: "400px",
  backgroundColor: "#ffffff",
  borderRadius: "20px",
  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
  padding: theme.spacing(3),
}));

const StyledTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  marginBottom: theme.spacing(1),
  background: "linear-gradient(90deg, #3f51b5 0%, #7986cb 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  textShadow: "0 2px 10px rgba(63, 81, 181, 0.15)",
}));

const Comparison = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  
  const [budgetItems, setBudgetItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState([]);
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [selectedDays, setSelectedDays] = useState([]);
  const [dateType, setDateType] = useState("year");
  const [chartType, setChartType] = useState("bar");
  const [showRevenues, setShowRevenues] = useState(true);
  const [showExpenses, setShowExpenses] = useState(true);
  const [chartHovered, setChartHovered] = useState(false);

  // --- START: تعديلات العملة ---
  const [currency, setCurrency] = useState({
    code: "JOD",
    symbol: "JOD",
    rate: 1,
  });
  // --- END: تعديلات العملة ---

  useEffect(() => {
    fetchBudget();
    
    // Add subtle entrance animation
    const timer = setTimeout(() => {
      const container = document.getElementById("main-container");
      if (container) {
        container.style.opacity = "1";
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // --- START: خطاف للاستماع لتغييرات العملة ---
  useEffect(() => {
    const updateCurrencyState = () => {
        const savedCurrencyCode = localStorage.getItem("selectedCurrency") || "JOD";
        const cachedRatesData = localStorage.getItem("exchangeRates");
        let rates = {};

        if (cachedRatesData) {
            try {
                rates = JSON.parse(cachedRatesData).rates;
            } catch (error) {
                console.error("Failed to parse exchange rates from localStorage", error);
                rates = {};
            }
        }

        const currencyInfo = currencies.find(c => c.code === savedCurrencyCode) || currencies[0];
        const rate = rates[savedCurrencyCode] || 1;

        setCurrency({
            code: savedCurrencyCode,
            symbol: currencyInfo.symbol,
            rate: rate,
        });
    };

    updateCurrencyState();
    window.addEventListener('currencyChanged', updateCurrencyState);
    return () => {
        window.removeEventListener('currencyChanged', updateCurrencyState);
    };
  }, []);
  // --- END: خطاف للاستماع لتغييرات العملة ---

  const token = sessionStorage.getItem("jwt");

  const fetchBudget = async () => {
    try {
      const response = await axios.get(
        "http://127.0.0.1:5004/api/getUserBudget",
        {
          headers: {
            Auth: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      setBudgetItems(response.data.products || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching budget", error);
      setLoading(false);
    }
  };

  const groupByDate = (items) => {
    const groupedData = {};
    items.forEach((item) => {
      if (!item.CategoriesId || !item.CategoriesId.categoryType) return;
      const date = new Date(item.date);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const categoryType = item.CategoriesId.categoryType;
      let key;
      if (dateType === "year") {
        key = year;
      } else if (dateType === "month") {
        key = `${year}-${String(month).padStart(2, '0')}`;
      } else if (dateType === "day") {
        key = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
      if (!groupedData[key]) {
        groupedData[key] = { Revenues: 0, Expenses: 0 };
      }
      groupedData[key][categoryType] += parseFloat(item.valueitem);
    });
    const sortedKeys = Object.keys(groupedData).sort((a, b) => {
        const dateA = new Date(a.split('-').join('/'));
        const dateB = new Date(b.split('-').join('/'));
        return dateA - dateB;
    });
    const sortedData = {};
    sortedKeys.forEach((key) => {
      sortedData[key] = groupedData[key];
    });
    return sortedData;
  };

  const filterItems = (items) => {
    let filteredItems = items.filter(
      (item) => item.CategoriesId && item.CategoriesId.categoryType
    );

    if (dateType === "year" && selectedYear.length > 0) {
      filteredItems = filteredItems.filter((item) => {
        const year = new Date(item.date).getFullYear();
        return selectedYear.includes(year);
      });
    } else if (
      dateType === "month" &&
      selectedYear.length > 0 &&
      selectedMonths.length > 0
    ) {
      filteredItems = filteredItems.filter((item) => {
        const date = new Date(item.date);
        return (
          selectedYear.includes(date.getFullYear()) &&
          selectedMonths.includes(date.getMonth() + 1)
        );
      });
    } else if (
      dateType === "day" &&
      selectedYear.length > 0 &&
      selectedMonths.length > 0 &&
      selectedDays.length > 0
    ) {
      filteredItems = filteredItems.filter((item) => {
        const date = new Date(item.date);
        const dayKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
        return (
          selectedYear.includes(date.getFullYear()) &&
          selectedMonths.includes(date.getMonth() + 1) &&
          selectedDays.includes(dayKey)
        );
      });
    }
    const groupedData = groupByDate(filteredItems);
    const result = {};
    Object.keys(groupedData).forEach((key) => {
      result[key] = {};
      if (showRevenues) result[key].Revenues = groupedData[key].Revenues || 0;
      if (showExpenses) result[key].Expenses = groupedData[key].Expenses || 0;
    });
    return result;
  };

  const filteredItems = filterItems(budgetItems);

  const getChartData = () => {
    const labels = Object.keys(filteredItems);
    const datasets = [];
    
    if (showRevenues) {
      datasets.push({
        label: "Revenues",
        data: labels.map((label) => (filteredItems[label].Revenues || 0) * currency.rate),
        backgroundColor: "rgba(46, 204, 113, 0.7)",
        borderColor: "rgba(46, 204, 113, 1)",
        borderWidth: 2,
        fill: chartType === "line" ? "start" : undefined,
        tension: 0.4,
        pointBackgroundColor: "rgba(46, 204, 113, 1)",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "rgba(46, 204, 113, 1)",
        pointHoverBorderWidth: 2,
      });
    }
    
    if (showExpenses) {
      datasets.push({
        label: "Expenses",
        data: labels.map((label) => (filteredItems[label].Expenses || 0) * currency.rate),
        backgroundColor: "rgba(231, 76, 60, 0.7)",
        borderColor: "rgba(231, 76, 60, 1)",
        borderWidth: 2,
        fill: chartType === "line" ? "start" : undefined,
        tension: 0.4,
        pointBackgroundColor: "rgba(231, 76, 60, 1)",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "rgba(231, 76, 60, 1)",
        pointHoverBorderWidth: 2,
      });
    }
    
    return {
      labels,
      datasets,
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        align: "end",
        labels: {
          boxWidth: 15,
          usePointStyle: true,
          pointStyle: "circle",
          padding: 20,
          font: { 
            size: 14,
            weight: "600",
            family: "'Poppins', sans-serif"
          },
        },
      },
      title: {
        display: true,
        text: `Budget Comparison (${currency.code})`,
        font: { 
          size: 24, 
          weight: "bold",
          family: "'Poppins', sans-serif"
        },
        color: "#2c3e50",
        padding: { top: 20, bottom: 20 },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleFont: { size: 16, weight: "bold" },
        bodyFont: { size: 14 },
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        usePointStyle: true,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += `${currency.symbol} ${context.parsed.y.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
              })}`;
            }
            return label;
          }
        }
      },
    },
    scales: {
      x: {
        grid: { 
          display: false,
          drawBorder: false,
        },
        ticks: { 
          font: { 
            size: 12,
            weight: "500",
            family: "'Poppins', sans-serif"
          },
          color: "#64748b",
          padding: 10,
        },
      },
      y: {
        grid: { 
          color: "rgba(0, 0, 0, 0.05)",
          drawBorder: false,
        },
        ticks: { 
          font: { 
            size: 12,
            weight: "500",
            family: "'Poppins', sans-serif"
          },
          color: "#64748b",
          padding: 10,
          callback: function(value) {
            return `${currency.symbol}${value.toLocaleString()}`;
          }
        },
        beginAtZero: true,
      },
    },
    animation: {
      duration: 1500,
      easing: "easeOutQuart",
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    onHover: (event, chartElements) => {
      setChartHovered(chartElements.length > 0);
    },
  };

  const availableYears = [
    ...new Set(budgetItems.map((item) => new Date(item.date).getFullYear())),
  ];

  const availableMonths =
    selectedYear.length > 0
      ? [
          ...new Set(
            budgetItems
              .filter(
                (item) =>
                  selectedYear.includes(new Date(item.date).getFullYear())
              )
              .map((item) => new Date(item.date).getMonth() + 1)
          ),
        ]
      : [];

  const availableDays =
    selectedYear.length > 0 && selectedMonths.length > 0
      ? [
          ...new Set(
            budgetItems
              .filter((item) => {
                const date = new Date(item.date);
                return (
                  selectedYear.includes(date.getFullYear()) &&
                  selectedMonths.includes(date.getMonth() + 1)
                );
              })
              .map((item) => {
                const date = new Date(item.date);
                return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
              })
          ),
        ]
      : [];

  const handleYearChange = (year) => {
    setSelectedYear((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]
    );
    setSelectedMonths([]);
    setSelectedDays([]);
  };

  const handleMonthChange = (month) => {
    setSelectedMonths((prev) =>
      prev.includes(month) ? prev.filter((m) => m !== month) : [...prev, month]
    );
    setSelectedDays([]);
  };

  const handleDayChangeForMonth = (monthKey, selectedDaysForMonth) => {
    const updatedSelectedDays = selectedDays.filter(day => !day.startsWith(`${monthKey}-`));
    setSelectedDays([...updatedSelectedDays, ...selectedDaysForMonth]);
  };
  
  const getMonthName = (monthNum) => {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return months[monthNum - 1];
  };

  const getDateTypeIcon = () => {
    switch(dateType) {
      case "year": return <CalendarMonthIcon />;
      case "month": return <DateRangeIcon />;
      case "day": return <EventIcon />;
      default: return <CalendarMonthIcon />;
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <StyledContainer
        id="main-container"
        sx={{
          opacity: 0,
          transition: "opacity 0.5s ease-in-out",
        }}
      >
        <ControlPanel elevation={3}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12}>
              <StyledTitle variant="h5" gutterBottom>
                Budget Comparison Dashboard
              </StyledTitle>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Visualize and compare your revenues and expenses across different time periods
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel 
                  id="date-type-select-label"
                  sx={{ 
                    fontWeight: 500,
                    color: theme.palette.primary.main
                  }}
                >
                  Date Type
                </InputLabel>
                <StyledSelect
                  labelId="date-type-select-label"
                  value={dateType}
                  onChange={(e) => setDateType(e.target.value)}
                  label="Date Type"
                  startAdornment={getDateTypeIcon()}
                >
                  <MenuItem value="year">Year</MenuItem>
                  <MenuItem value="month">Month</MenuItem>
                  <MenuItem value="day">Day</MenuItem>
                </StyledSelect>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <RadioGroup
                  row
                  value={chartType}
                  onChange={(e) => setChartType(e.target.value)}
                  sx={{ justifyContent: "center" }}
                >
                  <Tooltip title="Bar Chart" arrow placement="top">
                    <FormControlLabel
                      value="bar"
                      control={<StyledRadio icon={<BarChartIcon />} checkedIcon={<BarChartIcon />} />}
                      label="Bar"
                      sx={{ fontWeight: 500 }}
                    />
                  </Tooltip>
                  <Tooltip title="Line Chart" arrow placement="top">
                    <FormControlLabel
                      value="line"
                      control={<StyledRadio icon={<ShowChartIcon />} checkedIcon={<ShowChartIcon />} />}
                      label="Line"
                      sx={{ fontWeight: 500 }}
                    />
                  </Tooltip>
                </RadioGroup>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControlLabel
                control={
                  <StyledCheckbox
                    checked={showRevenues}
                    onChange={(e) => setShowRevenues(e.target.checked)}
                    icon={<PaidOutlinedIcon />}
                    checkedIcon={<PaidOutlinedIcon />}
                  />
                }
                label="Revenues"
                sx={{ fontWeight: 500 }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControlLabel
                control={
                  <StyledCheckbox
                    checked={showExpenses}
                    onChange={(e) => setShowExpenses(e.target.checked)}
                    icon={<AccountBalanceWalletOutlinedIcon />}
                    checkedIcon={<AccountBalanceWalletOutlinedIcon />}
                  />
                }
                label="Expenses"
                sx={{ fontWeight: 500 }}
              />
            </Grid>
          </Grid>
        </ControlPanel>

        <Box sx={{ mb: 4 }}>
          {dateType === "year" && (
            <Box>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                Select Years:
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap" }}>
                {availableYears.map((year) => (
                  <FilterChip
                    key={year}
                    label={year}
                    selected={selectedYear.includes(year)}
                    onClick={() => handleYearChange(year)}
                    clickable
                  />
                ))}
              </Box>
            </Box>
          )}

          {dateType === "month" && selectedYear.length > 0 && (
            <Box>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                Select Months:
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap" }}>
                {availableMonths.map((month) => (
                  <FilterChip
                    key={month}
                    label={getMonthName(month)}
                    selected={selectedMonths.includes(month)}
                    onClick={() => handleMonthChange(month)}
                    clickable
                  />
                ))}
              </Box>
            </Box>
          )}

          {dateType === "day" &&
            selectedYear.length > 0 &&
            selectedMonths.length > 0 && (
              <Box>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                  Select Days:
                </Typography>
                {availableDays.length > 0 ? (
                  <>
                    {Object.entries(
                      availableDays.reduce((acc, day) => {
                        const [year, month] = day.split("-").slice(0, 2);
                        const key = `${year}-${month}`;
                        if (!acc[key]) acc[key] = [];
                        acc[key].push(day);
                        return acc;
                      }, {})
                    ).map(([key, days]) => {
                      const [year, month] = key.split("-");
                      return (
                        <MonthCard key={key}>
                          <Typography
                            variant="h6"
                            sx={{ fontWeight: 600, color: theme.palette.primary.main, mb: 2 }}
                          >
                            {`${getMonthName(parseInt(month))} ${year}`}
                          </Typography>
                          <FormControl fullWidth>
                            <InputLabel>Days</InputLabel>
                            <StyledSelect
                              multiple
                              value={selectedDays.filter(day => days.includes(day))}
                              onChange={(e) => handleDayChangeForMonth(key, e.target.value)}
                              label="Days"
                              renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {selected.length === 0 ? (
                                    <Typography variant="body2" color="text.secondary">
                                      No days selected
                                    </Typography>
                                  ) : selected.length <= 3 ? (
                                    selected.map((value) => (
                                      <Chip 
                                        key={value} 
                                        label={value.split('-')[2]} 
                                        size="small"
                                        sx={{ 
                                          backgroundColor: theme.palette.primary.main,
                                          color: '#fff',
                                          fontWeight: 500
                                        }}
                                      />
                                    ))
                                  ) : (
                                    <Typography variant="body2" fontWeight={500}>
                                      {`${selected.length} days selected`}
                                    </Typography>
                                  )}
                                </Box>
                              )}
                              MenuProps={{
                                PaperProps: {
                                  style: {
                                    maxHeight: 300,
                                    overflowY: "auto",
                                  },
                                },
                              }}
                            >
                              {days.map((day) => (
                                <MenuItem key={day} value={day}>
                                  <StyledCheckbox checked={selectedDays.includes(day)} />
                                  {`Day ${day.split('-')[2]}`}
                                </MenuItem>
                              ))}
                            </StyledSelect>
                          </FormControl>
                        </MonthCard>
                      );
                    })}
                  </>
                ) : (
                  <Typography variant="body1" color="text.secondary">
                    Please select a year and month first to see available days.
                  </Typography>
                )}
              </Box>
            )}
        </Box>

        {loading ? (
          <EmptyStateContainer>
            <CircularProgress size={60} sx={{ color: theme.palette.primary.main, mb: 2 }} />
            <Typography variant="h6" color="text.secondary" fontWeight={500}>
              Loading your budget data...
            </Typography>
          </EmptyStateContainer>
        ) : Object.keys(filteredItems).length === 0 ? (
          <EmptyStateContainer>
            <Typography
              variant="h5"
              sx={{ color: "#7f8c8d", fontWeight: 600, mb: 2 }}
            >
              No Data Available
            </Typography>
            <Typography variant="body1" color="text.secondary" align="center">
              Please select different filters or add budget items to see the comparison.
            </Typography>
          </EmptyStateContainer>
        ) : (
          <Fade in={true} timeout={500}>
            <ChartContainer
              onMouseEnter={() => setChartHovered(true)}
              onMouseLeave={() => setChartHovered(false)}
              sx={{
                transform: chartHovered ? "scale(1.01)" : "scale(1)",
                transition: "transform 0.3s ease",
              }}
            >
              <Box sx={{ position: "absolute", top: 12, right: 12 }}>
                <Tooltip title="Click and drag to zoom, double-click to reset" arrow>
                  <IconButton size="small">
                    <InfoOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              {chartType === "bar" ? (
                <Bar data={getChartData()} options={chartOptions} />
              ) : (
                <Line data={getChartData()} options={chartOptions} />
              )}
            </ChartContainer>
          </Fade>
        )}
      </StyledContainer>
    </LocalizationProvider>
  );
};

export default Comparison;
