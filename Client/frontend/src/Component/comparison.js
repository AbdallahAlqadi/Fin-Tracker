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
  Tooltip,
  Legend,
} from "chart.js";
import "../cssStyle/comparsion.css";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

// Styled Select component
const StyledSelect = styled(Select)(({ theme }) => ({
  borderRadius: "12px",
  backgroundColor: "#ffffff",
  boxShadow: "0 6px 15px rgba(0, 0, 0, 0.1)",
  transition: "all 0.3s ease",
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: theme.palette.primary.main,
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: theme.palette.primary.dark,
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: theme.palette.secondary.main,
    borderWidth: "3px",
  },
}));

// Styled Checkbox component
const StyledCheckbox = styled(Checkbox)(({ theme }) => ({
  color: theme.palette.secondary.main,
  "&.Mui-checked": {
    color: theme.palette.secondary.main,
  },
  "& .MuiSvgIcon-root": {
    fontSize: 28,
    transition: "transform 0.2s ease",
  },
  "&:hover": {
    transform: "scale(1.1)",
  },
}));

// Styled Radio component
const StyledRadio = styled(Radio)(({ theme }) => ({
  color: theme.palette.primary.main,
  "&.Mui-checked": {
    color: theme.palette.primary.main,
  },
  "&:hover": {
    transform: "scale(1.1)",
  },
}));

const Comparison = () => {
  const [budgetItems, setBudgetItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState([]);
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [selectedDays, setSelectedDays] = useState([]);
  const [dateType, setDateType] = useState("year");
  const [chartType, setChartType] = useState("bar");
  const [showRevenues, setShowRevenues] = useState(true);
  const [showExpenses, setShowExpenses] = useState(true);

  useEffect(() => {
    fetchBudget();
  }, []);

  const token = sessionStorage.getItem("jwt");

  const fetchBudget = async () => {
    try {
      const response = await axios.get(
        "https://fin-tracker-ncbx.onrender.com/api/getUserBudget",
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
        key = `${year}-${month}`;
      } else if (dateType === "day") {
        key = `${year}-${month}-${day}`;
      }
      if (!groupedData[key]) {
        groupedData[key] = { Revenues: 0, Expenses: 0 };
      }
      groupedData[key][categoryType] += parseFloat(item.valueitem);
    });
    const sortedKeys = Object.keys(groupedData).sort(
      (a, b) => new Date(a) - new Date(b)
    );
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
        data: labels.map((label) => filteredItems[label].Revenues || 0),
        backgroundColor: "rgba(46, 204, 113, 0.8)",
        borderColor: "rgba(46, 204, 113, 1)",
        borderWidth: 2,
        fill: chartType === "line" ? false : true,
        tension: 0.4,
      });
    }
    if (showExpenses) {
      datasets.push({
        label: "Expenses",
        data: labels.map((label) => filteredItems[label].Expenses || 0),
        backgroundColor: "rgba(231, 76, 60, 0.8)",
        borderColor: "rgba(231, 76, 60, 1)",
        borderWidth: 2,
        fill: chartType === "line" ? false : true,
        tension: 0.4,
      });
    }
    return {
      labels,
      datasets,
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
        labels: {
          font: { size: 16, weight: "bold" },
          padding: 20,
        },
      },
      title: {
        display: true,
        text: "Budget Comparison",
        font: { size: 28, weight: "bold" },
        color: "#2c3e50",
        padding: { top: 20, bottom: 20 },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleFont: { size: 16 },
        bodyFont: { size: 14 },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 14 } },
      },
      y: {
        grid: { color: "rgba(0, 0, 0, 0.1)" },
        ticks: { font: { size: 14 }, beginAtZero: true },
      },
    },
    maintainAspectRatio: false,
    animation: {
      duration: 1500,
      easing: "easeOutBounce",
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

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box
        id="main-container"
        sx={{
          padding: { xs: 2, sm: 3, md: 4 },
          background: "linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)",
          borderRadius: "20px",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
          maxWidth: { xs: "95%", sm: "90%", md: "1200px" },
          margin: "30px auto",
          transition: "transform 0.3s ease",
          "&:hover": {
            transform: "translateY(-5px)",
          },
        }}
      >
        <Paper
          id="controls-container"
          elevation={6}
          sx={{
            marginBottom: 4,
            padding: { xs: 2, sm: 3 },
            borderRadius: "16px",
            background: "linear-gradient(135deg, #ffffff 0%, #eef2f7 100%)",
            boxShadow: "0 8px 20px rgba(0, 0, 0, 0.12)",
          }}
        >
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm="auto">
              <FormControl
                id="date-type-select"
                sx={{
                  minWidth: 160,
                }}
              >
                <InputLabel sx={{ fontWeight: "bold" }}>Date Type</InputLabel>
                <StyledSelect
                  value={dateType}
                  onChange={(e) => setDateType(e.target.value)}
                  label="Date Type"
                >
                  <MenuItem value="year">Year</MenuItem>
                  <MenuItem value="month">Month</MenuItem>
                  <MenuItem value="day">Day</MenuItem>
                </StyledSelect>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm="auto">
              <RadioGroup
                row
                value={chartType}
                onChange={(e) => setChartType(e.target.value)}
              >
                <FormControlLabel
                  value="bar"
                  control={<StyledRadio />}
                  label="Bar Chart"
                  sx={{ fontWeight: "bold" }}
                />
                <FormControlLabel
                  value="line"
                  control={<StyledRadio />}
                  label="Line Chart"
                  sx={{ fontWeight: "bold" }}
                />
              </RadioGroup>
            </Grid>
            <Grid item xs={12} sm="auto">
              <FormControlLabel
                control={
                  <StyledCheckbox
                    checked={showRevenues}
                    onChange={(e) => setShowRevenues(e.target.checked)}
                  />
                }
                label="Show Revenues"
                sx={{ fontWeight: "bold" }}
              />
            </Grid>
            <Grid item xs={12} sm="auto">
              <FormControlLabel
                control={
                  <StyledCheckbox
                    checked={showExpenses}
                    onChange={(e) => setShowExpenses(e.target.checked)}
                  />
                }
                label="Show Expenses"
                sx={{ fontWeight: "bold" }}
              />
            </Grid>
          </Grid>
        </Paper>

        <Box id="date-selection-container" sx={{ marginBottom: 4 }}>
          {dateType === "year" && (
            <Grid container spacing={2}>
              {availableYears.map((year) => (
                <Grid item xs={6} sm={4} md={3} key={year}>
                  <FormControlLabel
                    control={
                      <StyledCheckbox
                        checked={selectedYear.includes(year)}
                        onChange={() => handleYearChange(year)}
                      />
                    }
                    label={year}
                    sx={{
                      backgroundColor: "#fff",
                      borderRadius: "8px",
                      padding: "8px",
                      boxShadow: "0 4px 10px rgba(0, 0, 0, 0.05)",
                      transition: "all 0.3s ease",
                      "&:hover": { boxShadow: "0 6px 15px rgba(0, 0, 0, 0.1)" },
                    }}
                  />
                </Grid>
              ))}
            </Grid>
          )}

          {dateType === "month" && selectedYear.length > 0 && (
            <Grid container spacing={2}>
              {availableMonths.map((month) => (
                <Grid item xs={6} sm={4} md={3} key={month}>
                  <FormControlLabel
                    control={
                      <StyledCheckbox
                        checked={selectedMonths.includes(month)}
                        onChange={() => handleMonthChange(month)}
                      />
                    }
                    label={`Month ${month}`}
                    sx={{
                      backgroundColor: "#fff",
                      borderRadius: "8px",
                      padding: "8px",
                      boxShadow: "0 4px 10px rgba(0, 0, 0, 0.05)",
                      transition: "all 0.3s ease",
                      "&:hover": { boxShadow: "0 6px 15px rgba(0, 0, 0, 0.1)" },
                    }}
                  />
                </Grid>
              ))}
            </Grid>
          )}

          {dateType === "day" &&
            selectedYear.length > 0 &&
            selectedMonths.length > 0 && (
              <Box id="day-selection">
                {availableDays.length > 0 && (
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
                        <Box
                          key={key}
                          sx={{
                            marginBottom: 3,
                            padding: { xs: 2, sm: 3 },
                            borderRadius: "12px",
                            background: "linear-gradient(135deg, #ffffff 0%, #f9fbfc 100%)",
                            boxShadow: "0 6px 15px rgba(0, 0, 0, 0.1)",
                            transition: "all 0.3s ease",
                            "&:hover": {
                              boxShadow: "0 8px 20px rgba(0, 0, 0, 0.15)",
                            },
                          }}
                        >
                          <Typography
                            variant="h6"
                            sx={{ fontWeight: "bold", color: "#2c3e50" }}
                          >
                            {`Month ${month.padStart(2, "0")} (${year})`}
                          </Typography>
                          <FormControl sx={{ minWidth: 200, marginTop: 1 }}>
                            <InputLabel>Days</InputLabel>
                            <StyledSelect
                              multiple
                              value={selectedDays.filter(day => days.includes(day))}
                              onChange={(e) => handleDayChangeForMonth(key, e.target.value)}
                              label="Days"
                              renderValue={(selected) => {
                                if (selected.length === 0) {
                                  return "No days selected";
                                } else if (selected.length <= 3) {
                                  return selected.join(", ");
                                } else {
                                  return `${selected.length} days selected`;
                                }
                              }}
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
                                  {day}
                                </MenuItem>
                              ))}
                            </StyledSelect>
                          </FormControl>
                        </Box>
                      );
                    })}
                  </>
                )}
              </Box>
            )}
        </Box>

        {loading ? (
          <Box
            id="loading-container"
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: { xs: "250px", sm: "300px" },
            }}
          >
            <CircularProgress size={70} sx={{ color: "#3498db" }} />
          </Box>
        ) : Object.keys(filteredItems).length === 0 ? (
          <Box
            id="no-items-container"
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: { xs: "250px", sm: "300px" },
            }}
          >
            <Typography
              variant="h4"
              sx={{ color: "#7f8c8d", fontWeight: "bold" }}
            >
              No Items
            </Typography>
          </Box>
        ) : (
          <Box
            id="chart-container"
            sx={{
              width: "100%",
              height: { xs: "400px", sm: "500px" },
              position: "relative",
              backgroundColor: "#fff",
              borderRadius: "16px",
              boxShadow: "0 8px 25px rgba(0, 0, 0, 0.15)",
              padding: 2,
            }}
          >
            {chartType === "bar" ? (
              <Bar data={getChartData()} options={chartOptions} />
            ) : (
              <Line data={getChartData()} options={chartOptions} />
            )}
          </Box>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default Comparison;