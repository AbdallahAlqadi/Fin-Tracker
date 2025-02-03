import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
} from "@mui/material";
import { styled } from "@mui/system";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import * as d3 from "d3";
import * as XLSX from "xlsx";
import { schemeSet3, schemeTableau10 } from "d3-scale-chromatic";

const StyledCard = styled(Card)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "16px",
  borderRadius: "12px",
  border: "1px solid #e0e0e0",
  transition: "transform 0.3s ease, box-shadow 0.3s ease",
  background: "linear-gradient(145deg, #ffffff, #f9f9f9)",
  width: "200px",
  height: "250px",
  "&:hover": {
    transform: "translateY(-5px)",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
    borderColor: "#007BFF",
  },
}));

const ImageContainer = styled("div")({
  width: "80px",
  height: "80px",
  borderRadius: "50%",
  overflow: "hidden",
  boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
  marginBottom: "12px",
});

const StyledSelect = styled(Select)(({ theme }) => ({
  borderRadius: "8px",
  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "#007BFF",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "#0056b3",
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "#007BFF",
    borderWidth: "2px",
  },
}));

const Graph = () => {
  const [budgetItems, setBudgetItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState(new Date());
  const [filterType, setFilterType] = useState("Revenues");
  const [dateType, setDateType] = useState("month");
  const [currency, setCurrency] = useState("JOD"); // Default currency set to JOD
  const [exchangeRates, setExchangeRates] = useState({}); // Store exchange rates
  const svgRef = useRef();

  const colorScale = d3.scaleOrdinal([...schemeSet3, ...schemeTableau10]);

  useEffect(() => {
    fetchBudget();
    fetchExchangeRates(); // Fetch exchange rates on component mount
  }, []);

  const token = sessionStorage.getItem('jwt');

  const fetchBudget = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:5004/api/getUserBudget', {
        headers: {
          Auth: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      setBudgetItems(response.data.products || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching budget", error);
      setLoading(false);
    }
  };

  const fetchExchangeRates = async () => {
    try {
      const response = await axios.get('https://api.exchangerate-api.com/v4/latest/JOD'); // Replace with your API endpoint
      setExchangeRates(response.data.rates);
    } catch (error) {
      console.error("Error fetching exchange rates", error);
    }
  };

  const groupByCategory = (items) => {
    return items.reduce((acc, item) => {
      const categoryName = item.CategoriesId.categoryName;
      if (!acc[categoryName]) {
        acc[categoryName] = { ...item, valueitem: 0 };
      }
      acc[categoryName].valueitem += parseFloat(item.valueitem);
      return acc;
    }, {});
  };

  const filterItems = (items) => {
    let filteredItems = items;

    if (filterDate) {
      const selectedDate = new Date(filterDate);
      filteredItems = filteredItems.filter((item) => {
        const itemDate = new Date(item.date);
        if (dateType === "month") {
          return selectedDate.getMonth() === itemDate.getMonth() && selectedDate.getFullYear() === itemDate.getFullYear();
        } else if (dateType === "year") {
          return selectedDate.getFullYear() === itemDate.getFullYear();
        } else {
          return selectedDate.toDateString() === itemDate.toDateString();
        }
      });
    }

    if (filterType !== "All") {
      filteredItems = filteredItems.filter((item) => item.CategoriesId.categoryType === filterType);
    }

    return Object.values(groupByCategory(filteredItems));
  };

  const calculateTotals = (items) => {
    const totals = { Revenues: 0, Expenses: 0 };

    items.forEach((item) => {
      const value = parseFloat(item.valueitem);
      if (item.CategoriesId.categoryType === "Revenues") {
        totals.Revenues += value;
      } else if (item.CategoriesId.categoryType === "Expenses") {
        totals.Expenses += value;
      }
    });

    return totals;
  };

  const convertCurrency = (value) => {
    return value * (exchangeRates[currency] || 1);
  };

  const filteredItems = filterItems(budgetItems);
  const totals = calculateTotals(filteredItems);
  const balance = totals.Revenues - totals.Expenses;

  useEffect(() => {
    if (filteredItems.length > 0) {
      drawPieChart(filteredItems);
    }
  }, [filteredItems]);

  const drawPieChart = (data) => {
    const width = 600;
    const height = 400;
    const radius = Math.min(width, height) / 2 - 50;

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    const pie = d3.pie()
      .value(d => parseFloat(d.valueitem))
      .sort(null);

    const arc = d3.arc()
      .innerRadius(0)
      .outerRadius(radius);

    const arcs = svg.selectAll(".arc")
      .data(pie(data))
      .enter()
      .append("g")
      .attr("class", "arc");

    arcs.append("path")
      .attr("d", arc)
      .attr("fill", (d, i) => colorScale(i))
      .attr("stroke", "#fff")
      .style("stroke-width", "2px");
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredItems.map((item) => {
        const date = new Date(item.date);
        const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
        return {
          Category: item.CategoriesId.categoryName,
          Type: item.CategoriesId.categoryType,
          Value: convertCurrency(item.valueitem).toFixed(2), // Convert value to selected currency
          Date: formattedDate,
        };
      })
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Budget Items");
    XLSX.writeFile(workbook, "filtered_budget_items.xlsx");
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ padding: 4, background: "#f5f5f5", minHeight: "100vh" }}>
        <Box sx={{ marginBottom: 4, display: "flex", justifyContent: "center", gap: 2 }}>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Date Type</InputLabel>
            <StyledSelect value={dateType} onChange={(e) => setDateType(e.target.value)}>
              <MenuItem value="full">Full Date</MenuItem>
              <MenuItem value="month">Month</MenuItem>
              <MenuItem value="year">Year</MenuItem>
            </StyledSelect>
          </FormControl>
          <DatePicker
            label={dateType === "month" ? "Select Month" : dateType === "year" ? "Select Year" : "Select Date"}
            views={dateType === "month" ? ["year", "month"] : dateType === "year" ? ["year"] : ["year", "month", "day"]}
            value={filterDate}
            onChange={(newValue) => setFilterDate(newValue)}
            renderInput={(params) => <TextField {...params} sx={{ minWidth: 180 }} />}
          />
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Type</InputLabel>
            <StyledSelect value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <MenuItem value="All">All</MenuItem>
              <MenuItem value="Revenues">Revenues</MenuItem>
              <MenuItem value="Expenses">Expenses</MenuItem>
            </StyledSelect>
          </FormControl>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Currency</InputLabel>
            <StyledSelect value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {Object.keys(exchangeRates).map((rate) => (
                <MenuItem key={rate} value={rate}>{rate}</MenuItem>
              ))}
            </StyledSelect>
          </FormControl>
        </Box>

        <Box sx={{ marginBottom: 4, display: "flex", justifyContent: "center", gap: 4 }}>
          <Card sx={{ minWidth: 200, textAlign: "center", background: "#4CAF50", color: "#fff" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Revenues
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                {convertCurrency(totals.Revenues).toFixed(2)} {currency}
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ minWidth: 200, textAlign: "center", background: "#F44336", color: "#fff" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Expenses
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                {convertCurrency(totals.Expenses).toFixed(2)} {currency}
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ minWidth: 200, textAlign: "center", background: balance >= 0 ? "#4CAF50" : "#F44336", color: "#fff" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Balance
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                {convertCurrency(balance).toFixed(2)} {currency}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ marginBottom: 4, display: "flex", justifyContent: "center", gap: 2 }}>
          <Button variant="contained" color="success" onClick={exportToExcel}>
            Export to Excel
          </Button>
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
            <CircularProgress size={60} />
          </Box>
        ) : filteredItems.length === 0 ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
            <Typography variant="h4" color="textSecondary">
              No Items
            </Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>
              <svg ref={svgRef}></svg>
              <List sx={{ marginLeft: "20px", width: "300px" }}>
                {filteredItems.map((item, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <Box sx={{ width: "20px", height: "20px", backgroundColor: colorScale(index) }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${item.CategoriesId.categoryName} (${((item.valueitem / d3.sum(filteredItems.map(i => i.valueitem))) * 100).toFixed(2)}%)`}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
            <Grid container spacing={3} justifyContent="center">
              {filteredItems.map((item, index) => (
                <Grid item key={index}>
                  <StyledCard>
                    <ImageContainer>
                      <img
                        src={`http://127.0.0.1:5004/${item.CategoriesId.image}`}
                        alt="Category"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </ImageContainer>
                    <CardContent sx={{ textAlign: "center" }}>
                      <Typography variant="h6" sx={{ fontWeight: "bold", color: "#007BFF" }}>
                        {item.CategoriesId.categoryName}
                      </Typography>
                      <Typography variant="body1" sx={{ color: item.CategoriesId.categoryType === "Revenues" ? "#4CAF50" : "#F44336" }}>
                        {item.CategoriesId.categoryType === "Expenses" ? `-${convertCurrency(item.valueitem).toFixed(2)} ${currency}` : `${convertCurrency(item.valueitem).toFixed(2)} ${currency}`}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#666" }}>
                        {((item.valueitem / totals[item.CategoriesId.categoryType]) * 100).toFixed(2)}%
                      </Typography>
                    </CardContent>
                  </StyledCard>
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default Graph;