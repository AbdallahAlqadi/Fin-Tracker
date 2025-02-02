import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  CircularProgress,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
} from "@mui/material";
import { styled } from "@mui/system";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import * as d3 from "d3";

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

const Comparison = () => {
  const [budgetItems, setBudgetItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYears, setSelectedYears] = useState([]);
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [selectedDays, setSelectedDays] = useState([]);
  const [dateType, setDateType] = useState("year"); // year, month, day
  const [chartType, setChartType] = useState("bar"); // bar, line
  const [showRevenues, setShowRevenues] = useState(true);
  const [showExpenses, setShowExpenses] = useState(true);
  const svgRef = useRef();

  useEffect(() => {
    fetchBudget();
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

  const groupByDate = (items) => {
    const groupedData = {};

    items.forEach((item) => {
      const date = new Date(item.date);
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // Months are 0-indexed
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

    return groupedData;
  };

  const filterItems = (items) => {
    let filteredItems = items;

    if (dateType === "year" && selectedYears.length > 0) {
      filteredItems = filteredItems.filter((item) => {
        const year = new Date(item.date).getFullYear();
        return selectedYears.includes(year);
      });
    } else if (dateType === "month" && selectedYears.length > 0 && selectedMonths.length > 0) {
      filteredItems = filteredItems.filter((item) => {
        const year = new Date(item.date).getFullYear();
        const month = new Date(item.date).getMonth() + 1;
        return selectedYears.includes(year) && selectedMonths.includes(month);
      });
    } else if (dateType === "day" && selectedYears.length > 0 && selectedMonths.length > 0 && selectedDays.length > 0) {
      filteredItems = filteredItems.filter((item) => {
        const year = new Date(item.date).getFullYear();
        const month = new Date(item.date).getMonth() + 1;
        const day = new Date(item.date).getDate();
        return selectedYears.includes(year) && selectedMonths.includes(month) && selectedDays.includes(day);
      });
    }

    const groupedData = groupByDate(filteredItems);

    // Filter based on user selection (Revenues, Expenses, or both)
    const result = {};
    Object.keys(groupedData).forEach((key) => {
      result[key] = {};
      if (showRevenues) result[key].Revenues = groupedData[key].Revenues || 0;
      if (showExpenses) result[key].Expenses = groupedData[key].Expenses || 0;
    });

    return result;
  };

  const filteredItems = filterItems(budgetItems);

  useEffect(() => {
    if (Object.keys(filteredItems).length > 0) {
      if (chartType === "bar") {
        drawBarChart(filteredItems);
      } else if (chartType === "line") {
        drawLineChart(filteredItems);
      }
    }
  }, [filteredItems, chartType]);

  const drawBarChart = (data) => {
    const width = 800;
    const height = 400;
    const margin = { top: 50, right: 150, bottom: 60, left: 60 }; // Increased right margin for legend

    d3.select(svgRef.current).selectAll("*").remove(); // Clear previous chart

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const dates = Object.keys(data);
    const categories = [];
    if (showRevenues) categories.push("Revenues");
    if (showExpenses) categories.push("Expenses");

    const x0 = d3.scaleBand()
      .domain(dates)
      .rangeRound([0, width - margin.left - margin.right])
      .paddingInner(0.1);

    const x1 = d3.scaleBand()
      .domain(categories)
      .rangeRound([0, x0.bandwidth()])
      .padding(0.05);

    const y = d3.scaleLinear()
      .domain([0, d3.max(Object.values(data), date => d3.max(Object.values(date)))])
      .nice()
      .rangeRound([height - margin.top - margin.bottom, 0]);

    const color = d3.scaleOrdinal()
      .domain(categories)
      .range(["#FFD700", "#9370DB"]); // Gold and Purple

    // Add bars
    svg.append("g")
      .selectAll("g")
      .data(dates)
      .enter()
      .append("g")
      .attr("transform", d => `translate(${x0(d)},0)`)
      .selectAll("rect")
      .data(d => categories.map(category => ({ category, value: data[d][category] || 0 })))
      .enter()
      .append("rect")
      .attr("x", d => x1(d.category))
      .attr("y", d => y(d.value))
      .attr("width", x1.bandwidth())
      .attr("height", d => height - margin.top - margin.bottom - y(d.value))
      .attr("fill", d => color(d.category))
      .on("mouseover", function (event, d) {
        d3.select(this).attr("opacity", 0.7);
        svg.append("text")
          .attr("class", "bar-value")
          .attr("x", x0(dates[0]) + x1(d.category) + x1.bandwidth() / 2)
          .attr("y", y(d.value) - 5)
          .attr("text-anchor", "middle")
          .text(d.value);
      })
      .on("mouseout", function () {
        d3.select(this).attr("opacity", 1);
        svg.selectAll(".bar-value").remove();
      });

    // Add x-axis
    svg.append("g")
      .attr("transform", `translate(0,${height - margin.top - margin.bottom})`)
      .call(d3.axisBottom(x0))
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)");

    // Add y-axis
    svg.append("g")
      .call(d3.axisLeft(y));

    // Add legend
    const legend = svg.append("g")
      .attr("transform", `translate(${width - margin.right + 10},${margin.top})`); // Adjusted position

    categories.forEach((category, i) => {
      legend.append("rect")
        .attr("x", 0)
        .attr("y", i * 20)
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", color(category));

      legend.append("text")
        .attr("x", 20)
        .attr("y", i * 20 + 12)
        .text(category)
        .style("font-size", "12px")
        .attr("alignment-baseline", "middle");
    });

    // Add chart title
    svg.append("text")
      .attr("x", (width - margin.left - margin.right) / 2)
      .attr("y", -margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("Budget Comparison");
  };

  const drawLineChart = (data) => {
    const width = 800;
    const height = 400;
    const margin = { top: 50, right: 150, bottom: 60, left: 60 }; // Increased right margin for legend

    d3.select(svgRef.current).selectAll("*").remove(); // Clear previous chart

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const dates = Object.keys(data);
    const categories = [];
    if (showRevenues) categories.push("Revenues");
    if (showExpenses) categories.push("Expenses");

    const x = d3.scaleBand()
      .domain(dates)
      .rangeRound([0, width - margin.left - margin.right])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, d3.max(Object.values(data), date => d3.max(Object.values(date)))])
      .nice()
      .rangeRound([height - margin.top - margin.bottom, 0]);

    const color = d3.scaleOrdinal()
      .domain(categories)
      .range(["#FFD700", "#9370DB"]); // Gold and Purple

    const line = d3.line()
      .x((d, i) => x(dates[i]) + x.bandwidth() / 2)
      .y(d => y(d.value));

    categories.forEach((category) => {
      const categoryData = dates.map(date => ({ value: data[date][category] || 0 }));

      svg.append("path")
        .datum(categoryData)
        .attr("fill", "none")
        .attr("stroke", color(category))
        .attr("stroke-width", 2)
        .attr("d", line);

      svg.selectAll(`.dot-${category}`)
        .data(categoryData)
        .enter()
        .append("circle")
        .attr("class", `dot-${category}`)
        .attr("cx", (d, i) => x(dates[i]) + x.bandwidth() / 2)
        .attr("cy", d => y(d.value))
        .attr("r", 5)
        .attr("fill", color(category))
        .on("mouseover", function (event, d) {
          d3.select(this).attr("r", 8);
          svg.append("text")
            .attr("class", "line-value")
            .attr("x", x(dates[0]) + x.bandwidth() / 2)
            .attr("y", y(d.value) - 10)
            .attr("text-anchor", "middle")
            .text(d.value);
        })
        .on("mouseout", function () {
          d3.select(this).attr("r", 5);
          svg.selectAll(".line-value").remove();
        });
    });

    // Add x-axis
    svg.append("g")
      .attr("transform", `translate(0,${height - margin.top - margin.bottom})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)");

    // Add y-axis
    svg.append("g")
      .call(d3.axisLeft(y));

    // Add legend
    const legend = svg.append("g")
      .attr("transform", `translate(${width - margin.right + 10},${margin.top})`); // Adjusted position

    categories.forEach((category, i) => {
      legend.append("rect")
        .attr("x", 0)
        .attr("y", i * 20)
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", color(category));

      legend.append("text")
        .attr("x", 20)
        .attr("y", i * 20 + 12)
        .text(category)
        .style("font-size", "12px")
        .attr("alignment-baseline", "middle");
    });

    // Add chart title
    svg.append("text")
      .attr("x", (width - margin.left - margin.right) / 2)
      .attr("y", -margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("Budget Comparison");
  };

  const availableYears = [...new Set(budgetItems.map(item => new Date(item.date).getFullYear()))];
  const availableMonths = selectedYears.length > 0 ? [...new Set(budgetItems.filter(item => selectedYears.includes(new Date(item.date).getFullYear())).map(item => new Date(item.date).getMonth() + 1))] : [];
  const availableDays = selectedYears.length > 0 && selectedMonths.length > 0 ? [...new Set(budgetItems.filter(item => selectedYears.includes(new Date(item.date).getFullYear()) && selectedMonths.includes(new Date(item.date).getMonth() + 1)).map(item => new Date(item.date).getDate()))] : [];

  const handleYearChange = (year) => {
    const newSelectedYears = selectedYears.includes(year)
      ? selectedYears.filter(y => y !== year)
      : [...selectedYears, year];
    setSelectedYears(newSelectedYears);
    setSelectedMonths([]); // Reset selected months when changing years
    setSelectedDays([]); // Reset selected days when changing years
  };

  const handleMonthChange = (month) => {
    const newSelectedMonths = selectedMonths.includes(month)
      ? selectedMonths.filter(m => m !== month)
      : [...selectedMonths, month];
    setSelectedMonths(newSelectedMonths);
    setSelectedDays([]); // Reset selected days when changing months
  };

  const handleDayChange = (day) => {
    const newSelectedDays = selectedDays.includes(day)
      ? selectedDays.filter(d => d !== day)
      : [...selectedDays, day];
    setSelectedDays(newSelectedDays);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ padding: 4, background: "#f5f5f5", minHeight: "100vh" }}>
        <Box sx={{ marginBottom: 4, display: "flex", justifyContent: "center", gap: 2 }}>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Date Type</InputLabel>
            <StyledSelect value={dateType} onChange={(e) => setDateType(e.target.value)}>
              <MenuItem value="year">Year</MenuItem>
              <MenuItem value="month">Month</MenuItem>
              <MenuItem value="day">Day</MenuItem>
            </StyledSelect>
          </FormControl>
          <RadioGroup
            row
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
          >
            <FormControlLabel value="bar" control={<Radio />} label="Bar Chart" />
            <FormControlLabel value="line" control={<Radio />} label="Line Chart" />
          </RadioGroup>
          <FormControlLabel
            control={
              <Checkbox
                checked={showRevenues}
                onChange={(e) => setShowRevenues(e.target.checked)}
              />
            }
            label="Show Revenues"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={showExpenses}
                onChange={(e) => setShowExpenses(e.target.checked)}
              />
            }
            label="Show Expenses"
          />
        </Box>

        <Box sx={{ marginBottom: 4, display: "flex", justifyContent: "center", gap: 2 }}>
          {dateType === "year" && (
            <Box sx={{ display: "flex", gap: 2 }}>
              {availableYears.map((year) => (
                <FormControlLabel
                  key={year}
                  control={
                    <Checkbox
                      checked={selectedYears.includes(year)}
                      onChange={() => handleYearChange(year)}
                    />
                  }
                  label={year}
                />
              ))}
            </Box>
          )}
          {dateType === "month" && selectedYears.length > 0 && (
            <Box sx={{ display: "flex", gap: 2 }}>
              {availableMonths.map((month) => (
                <FormControlLabel
                  key={month}
                  control={
                    <Checkbox
                      checked={selectedMonths.includes(month)}
                      onChange={() => handleMonthChange(month)}
                    />
                  }
                  label={`${selectedYears[0]}-${month}`}
                />
              ))}
            </Box>
          )}
          {dateType === "day" && selectedYears.length > 0 && selectedMonths.length > 0 && (
            <Box sx={{ display: "flex", gap: 2 }}>
              {availableDays.map((day) => (
                <FormControlLabel
                  key={day}
                  control={
                    <Checkbox
                      checked={selectedDays.includes(day)}
                      onChange={() => handleDayChange(day)}
                    />
                  }
                  label={`${selectedYears[0]}-${selectedMonths[0]}-${day}`}
                />
              ))}
            </Box>
          )}
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
            <CircularProgress size={60} />
          </Box>
        ) : Object.keys(filteredItems).length === 0 ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
            <Typography variant="h4" color="textSecondary">
              No Items
            </Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ display: "flex", justifyContent: "center", marginBottom: 4, marginTop: 4 }}>
              <svg ref={svgRef} width="800" height="400"></svg>
            </Box>
          </>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default Comparison;