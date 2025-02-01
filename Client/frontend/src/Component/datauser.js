import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import { styled } from "@mui/system";
import CategoryIcon from "@mui/icons-material/Category"; // أيقونة للفئة
import { DatePicker } from "@mui/x-date-pickers/DatePicker"; // DatePicker component
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"; // Adapter for date-fns
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"; // Localization provider

const StyledCard = styled(Card)(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  padding: "16px",
  borderRadius: "12px",
  border: "1px solid #e0e0e0",
  transition: "transform 0.3s ease, box-shadow 0.3s ease",
  background: "linear-gradient(145deg, #ffffff, #f9f9f9)",
  width: "400px", // عرض ثابت للبطاقة
  height: "150px", // ارتفاع ثابت للبطاقة
  "&:hover": {
    transform: "translateY(-5px)",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
    borderColor: "#007BFF",
  },
}));

const ImageContainer = styled("div")({
  flex: "0 0 100px", // حجم ثابت لحاوية الصورة
  marginRight: "16px",
  borderRadius: "50%",
  overflow: "hidden",
  boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
  width: "100px", // عرض ثابت للصورة
  height: "100px", // ارتفاع ثابت للصورة
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

const StyledDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialog-paper": {
    borderRadius: "12px",
    padding: "24px",
    background: "#f5f5f5",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
  },
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  fontSize: "1.5rem",
  fontWeight: "bold",
  color: "#007BFF",
  textAlign: "center",
}));

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: "16px",
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    "& fieldset": {
      borderColor: "#007BFF",
    },
    "&:hover fieldset": {
      borderColor: "#0056b3",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#007BFF",
    },
  },
}));

const BudgetItems = () => {
  const [budgetItems, setBudgetItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [updatedValue, setUpdatedValue] = useState("");
  const [filterDate, setFilterDate] = useState(new Date()); // تاريخ محدد (الشهر الحالي)
  const [filterType, setFilterType] = useState("all"); // all, Revenues, Expenses
  const [filterItem, setFilterItem] = useState("all"); // all, item1, item2, ...
  const [dateType, setDateType] = useState("month"); // full, month, year (الشهر الحالي بشكل افتراضي)

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

  const deleteItem = async (CategoriesId) => {
    try {
      const response = await axios.delete('http://127.0.0.1:5004/api/deleteBudget', {
        headers: {
          Auth: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        data: { CategoriesId: CategoriesId._id }
      });
      console.log("Item deleted successfully", response.data);
      setBudgetItems((prevItems) => prevItems.filter(item => item.CategoriesId._id !== CategoriesId._id));
    } catch (error) {
      console.error("Error deleting budget", error.response?.data || error.message);
    }
  };

  const handleUpdateClick = (item) => {
    setSelectedItem(item);
    setUpdatedValue(item.valueitem);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedItem(null);
    setUpdatedValue("");
  };

  const handleSaveUpdate = async () => {
    if (!selectedItem) return;

    try {
      const response = await axios.put(
        'http://127.0.0.1:5004/api/updateBudget',
        { CategoriesId: selectedItem.CategoriesId._id, valueitem: updatedValue },
        {
          headers: {
            Auth: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      console.log("Item updated successfully", response.data);
      setBudgetItems((prevItems) =>
        prevItems.map((item) =>
          item.CategoriesId._id === selectedItem.CategoriesId._id
            ? { ...item, valueitem: updatedValue }
            : item
        )
      );
      handleCloseDialog();
    } catch (error) {
      console.error("Error updating budget", error.response?.data || error.message);
    }
  };

  const groupByDate = (items) => {
    return items.reduce((acc, item) => {
      const date = new Date(item.date).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(item);
      return acc;
    }, {});
  };

  const filterItems = (items) => {
    let filteredItems = items;

    // Filter by date
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

    // Filter by type
    if (filterType !== "all") {
      filteredItems = filteredItems.filter((item) => item.CategoriesId.categoryType === filterType);
    }

    // Filter by item
    if (filterItem !== "all") {
      filteredItems = filteredItems.filter((item) => item.CategoriesId.categoryName === filterItem);
    }

    return filteredItems;
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

  const uniqueItems = filterType === "all" 
    ? [...new Set(budgetItems.map((item) => item.CategoriesId.categoryName))] 
    : [...new Set(budgetItems.filter((item) => item.CategoriesId.categoryType === filterType).map((item) => item.CategoriesId.categoryName))];

  const filteredItems = filterItems(budgetItems);
  const totals = calculateTotals(filteredItems);
  const balance = totals.Revenues - totals.Expenses;

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
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="Revenues">Revenues</MenuItem>
              <MenuItem value="Expenses">Expenses</MenuItem>
            </StyledSelect>
          </FormControl>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Item</InputLabel>
            <StyledSelect value={filterItem} onChange={(e) => setFilterItem(e.target.value)}>
              <MenuItem value="all">All</MenuItem>
              {uniqueItems.map((item, index) => (
                <MenuItem key={index} value={item}>
                  {item}
                </MenuItem>
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
                {totals.Revenues.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ minWidth: 200, textAlign: "center", background: "#F44336", color: "#fff" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Expenses
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                {totals.Expenses.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ minWidth: 200, textAlign: "center", background: balance >= 0 ? "#4CAF50" : "#F44336", color: "#fff" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Balance
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                {balance.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
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
          Object.entries(groupByDate(filteredItems)).map(([date, items]) => (
            <Box key={date} sx={{ marginBottom: 4 }}>
              <Typography variant="h4" gutterBottom sx={{ color: "#333", fontWeight: "bold", marginBottom: "24px" }}>
                {date}
              </Typography>
              <Grid container spacing={3} justifyContent="flex-start">
                {items.map((item, index) => (
                  <Grid item key={index} sx={{ marginLeft: "80px" }}>
                    <StyledCard>
                      <ImageContainer>
                        <img
                          src={`http://127.0.0.1:5004/${item.CategoriesId.image}`}
                          alt="Category"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </ImageContainer>
                      <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
                        <Typography
                          variant="h6"
                          gutterBottom
                          sx={{
                            color: item.CategoriesId.categoryType === "Revenues" ? "#4CAF50" : "#F44336", // أخضر إذا كانت Revenues، أحمر إذا كانت Expenses
                            fontWeight: "600",
                          }}
                        >
                          {item.CategoriesId.categoryType === "Expenses" ? `-${item.valueitem}` : item.valueitem}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                          <CategoryIcon sx={{ color: "#007BFF" }} /> {/* أيقونة الفئة */}
                          <Typography variant="h5" sx={{ color: "#007BFF", fontWeight: "bold" }}>
                            {item.CategoriesId.categoryName} {/* اسم العنصر */}
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="flex-end" gap={1} sx={{ marginTop: 2 }}>
                          <Button
                            variant="contained"
                            color="error"
                            onClick={() => deleteItem(item.CategoriesId)}
                            sx={{ textTransform: "none", fontWeight: "600" }}
                          >
                            Delete
                          </Button>
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={() => handleUpdateClick(item)}
                            sx={{ textTransform: "none", fontWeight: "600" }}
                          >
                            Update
                          </Button>
                        </Box>
                      </CardContent>
                    </StyledCard>
                  </Grid>
                ))}
              </Grid>
            </Box>
          ))
        )}

        <StyledDialog open={openDialog} onClose={handleCloseDialog}>
          <StyledDialogTitle>Update Budget Item</StyledDialogTitle>
          <StyledDialogContent>
            <Typography variant="h6" sx={{ marginBottom: 2 }}>
              Item Name: {selectedItem?.CategoriesId?.categoryName}
            </Typography>
            <StyledTextField
              autoFocus
              margin="dense"
              label="Value"
              type="text"
              fullWidth
              value={updatedValue}
              onChange={(e) => setUpdatedValue(e.target.value)}
            />
          </StyledDialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} color="secondary">
              Cancel
            </Button>
            <Button onClick={handleSaveUpdate} color="primary">
              Save
            </Button>
          </DialogActions>
        </StyledDialog>
      </Box>
    </LocalizationProvider>
  );
};

export default BudgetItems;