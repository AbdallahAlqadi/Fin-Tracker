import React, { useEffect, useState, useRef } from "react";
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
  Checkbox
} from "@mui/material";
import { styled } from "@mui/system";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import * as d3 from "d3";
import '../cssStyle/comparsion.css'

// Styled Select component
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
  const [selectedYear, setSelectedYear] = useState([]);
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [selectedDays, setSelectedDays] = useState([]);
  const [dateType, setDateType] = useState("year");
  const [chartType, setChartType] = useState("bar");
  const [showRevenues, setShowRevenues] = useState(true);
  const [showExpenses, setShowExpenses] = useState(true);
  const svgRef = useRef();
  const tooltipRef = useRef();

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

    const sortedKeys = Object.keys(groupedData).sort((a, b) => new Date(b) - new Date(a));
    const sortedData = {};
    sortedKeys.forEach(key => {
      sortedData[key] = groupedData[key];
    });

    return sortedData;
  };

  const filterItems = (items) => {
    let filteredItems = items;
  
    if (dateType === "year" && selectedYear.length > 0) {
      filteredItems = filteredItems.filter((item) => {
        const year = new Date(item.date).getFullYear();
        return selectedYear.includes(year);
      });
    } else if (dateType === "month" && selectedYear.length > 0 && selectedMonths.length > 0) {
      filteredItems = filteredItems.filter((item) => {
        const date = new Date(item.date);
        return selectedYear.includes(date.getFullYear()) && selectedMonths.includes(date.getMonth() + 1);
      });
    } else if (dateType === "day" && selectedYear.length > 0 && selectedMonths.length > 0 && selectedDays.length > 0) {
      filteredItems = filteredItems.filter((item) => {
        const date = new Date(item.date);
        const dayKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`; // تضمين السنة
        return selectedYear.includes(date.getFullYear()) && 
               selectedMonths.includes(date.getMonth() + 1) && 
               selectedDays.includes(dayKey);
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
    const margin = { top: 50, right: 150, bottom: 60, left: 60 };

    d3.select(svgRef.current).selectAll("*").remove();

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
      .range(["#59ff00", "#ff0000"]);

    svg.append("g")
      .selectAll("g")
      .data(dates)
      .enter()
      .append("g")
      .attr("transform", d => `translate(${x0(d)},0)`)
      .selectAll("rect")
      .data(d => categories.map(category => ({ category, value: data[d][category] })))
      .enter()
      .append("rect")
      .attr("x", d => x1(d.category))
      .attr("y", d => y(d.value))
      .attr("width", x1.bandwidth())
      .attr("height", d => height - margin.top - margin.bottom - y(d.value))
      .attr("fill", d => color(d.category))
      .on("mouseover", function (event, d) {
        d3.select(this).attr("opacity", 0.7);
        d3.select(tooltipRef.current)
          .style("opacity", 1)
          .html(`${d.category}: ${d.value}`)
          .style("left", `${event.pageX + 5}px`)
          .style("top", `${event.pageY - 28}px`);
      })
      .on("mouseout", function () {
        d3.select(this).attr("opacity", 1);
        d3.select(tooltipRef.current).style("opacity", 0);
      });

    svg.append("g")
      .attr("transform", `translate(0,${height - margin.top - margin.bottom})`)
      .call(d3.axisBottom(x0))
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)");

    svg.append("g")
      .call(d3.axisLeft(y));

    const legend = svg.append("g")
      .attr("transform", `translate(${width - margin.right + 10},${margin.top})`);

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
    const margin = { top: 50, right: 150, bottom: 60, left: 60 };

    d3.select(svgRef.current).selectAll("*").remove();

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
      .range(["#CD5C5C", "#884ea0"]);

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
          d3.select(tooltipRef.current)
            .style("opacity", 1)
            .html(`${category}: ${d.value}`)
            .style("left", `${event.pageX + 5}px`)
            .style("top", `${event.pageY - 28}px`);
        })
        .on("mouseout", function () {
          d3.select(this).attr("r", 5);
          d3.select(tooltipRef.current).style("opacity", 0);
        });
    });

    svg.append("g")
      .attr("transform", `translate(0,${height - margin.top - margin.bottom})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)");

    svg.append("g")
      .call(d3.axisLeft(y));

    const legend = svg.append("g")
      .attr("transform", `translate(${width - margin.right + 10},${margin.top})`);

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

    svg.append("text")
      .attr("x", (width - margin.left - margin.right) / 2)
      .attr("y", -margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("Budget Comparison");
  };

  const availableYears = [...new Set(budgetItems.map(item => new Date(item.date).getFullYear()))];

  const availableMonths = selectedYear.length > 0 
    ? [...new Set(budgetItems
        .filter(item => selectedYear.includes(new Date(item.date).getFullYear()))
        .map(item => new Date(item.date).getMonth() + 1)
      )] 
    : [];
  
    const availableDays = selectedYear.length > 0 && selectedMonths.length > 0 
    ? [...new Set(budgetItems
        .filter(item => {
          const date = new Date(item.date);
          return selectedYear.includes(date.getFullYear()) && selectedMonths.includes(date.getMonth() + 1);
        })
        .map(item => {
          const date = new Date(item.date);
          return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
        })
      )] 
    : [];
  const handleYearChange = (year) => {
    setSelectedYear(prev => 
      prev.includes(year) 
        ? prev.filter(y => y !== year) 
        : [...prev, year]
    );
    setSelectedMonths([]); 
    setSelectedDays([]); 
  };

  const handleMonthChange = (month) => {
    setSelectedMonths(prev => 
      prev.includes(month) 
        ? prev.filter(m => m !== month) 
        : [...prev, month]
    );
    setSelectedDays([]); 
  };

  const handleDayChange = (day) => {
    setSelectedDays(prevSelectedDays => 
      prevSelectedDays.includes(day)
        ? prevSelectedDays.filter(d => d !== day)
        : [...prevSelectedDays, day]
    );
  };
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
    <Box id="main-container">
      <Box id="controls-container">
        <FormControl id="date-type-select">
          <InputLabel>Date Type</InputLabel>
          <StyledSelect value={dateType} onChange={(e) => setDateType(e.target.value)}>
            <MenuItem value="year">Year</MenuItem>
            <MenuItem value="month">Month</MenuItem>
            <MenuItem value="day">Day</MenuItem>
          </StyledSelect>
        </FormControl>
        <RadioGroup row value={chartType} onChange={(e) => setChartType(e.target.value)}>
          <FormControlLabel value="bar" control={<Radio />} label="Bar Chart" />
          <FormControlLabel value="line" control={<Radio />} label="Line Chart" />
        </RadioGroup>
        <FormControlLabel
          control={<Checkbox checked={showRevenues} onChange={(e) => setShowRevenues(e.target.checked)} />}
          label="Show Revenues"
        />
        <FormControlLabel
          control={<Checkbox checked={showExpenses} onChange={(e) => setShowExpenses(e.target.checked)} />}
          label="Show Expenses"
        />
      </Box>
  
      <Box id="date-selection-container">
        {dateType === "year" && (
          <Box id="year-selection">
            {availableYears.map((year) => (
              <FormControlLabel
                key={year}
                control={<Checkbox checked={selectedYear.includes(year)} onChange={() => handleYearChange(year)} />}
                label={year}
              />
            ))}
          </Box>
        )}
  
        {dateType === "month" && selectedYear.length > 0 && (
          <Box id="month-selection">
            {availableMonths.map((month) => (
              <FormControlLabel
                key={month}
                control={<Checkbox checked={selectedMonths.includes(month)} onChange={() => handleMonthChange(month)} />}
                label={`Month ${month}`}
              />
            ))}
          </Box>
        )}
  
        {dateType === "day" && selectedYear.length > 0 && selectedMonths.length > 0 && (
          <Box id="day-selection">
            {selectedMonths.map((month) => {
              const year = selectedYear[0];
              const validDays = availableDays.filter((day) => {
                const [dayYear, dayMonth] = day.split("-");
                return parseInt(dayMonth) === month && parseInt(dayYear) === year;
              });
  
              if (validDays.length === 0) return null;
  
              return (
                <Box key={month} className="month-days-container">
                  <strong>{`الشهر ${month.toString().padStart(2, "0")} (${year})`}</strong>
                  <Box className="days-checkbox-group">
                    {validDays.map((day) => (
                      <FormControlLabel
                        key={day}
                        control={<Checkbox checked={selectedDays.includes(day)} onChange={() => handleDayChange(day)} />}
                        label={day}
                      />
                    ))}
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>
  
      {loading ? (
        <Box id="loading-container">
          <CircularProgress size={60} />
        </Box>
      ) : Object.keys(filteredItems).length === 0 ? (
        <Box id="no-items-container">
          <Typography variant="h4" color="textSecondary">
            No Items
          </Typography>
        </Box>
      ) : (
        <>
          <Box id="chart-container">
            <svg ref={svgRef} width="800" height="400"></svg>
          </Box>
          <div id="tooltip" ref={tooltipRef}></div>
        </>
      )}
    </Box>
  </LocalizationProvider>
  
  );
};

export default Comparison;