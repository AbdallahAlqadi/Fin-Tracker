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
  LinearProgress,
  IconButton,
  Snackbar,
  Alert,
} from "@mui/material";
import { styled } from "@mui/system";
import { alpha } from "@mui/material/styles";
import CategoryIcon from "@mui/icons-material/Category";
import DownloadIcon from "@mui/icons-material/Download";
import CloseIcon from "@mui/icons-material/Close";
import FilterListIcon from "@mui/icons-material/FilterList";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { format } from "date-fns";
import * as XLSX from "xlsx";

// Styled Components
const StyledCard = styled(Card)(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  padding: theme.spacing(3), // Use theme spacing
  borderRadius: "12px", // Slightly less rounded
  border: "1px solid #e0e0e0", // Subtle border
  transition: "transform 0.3s ease, box-shadow 0.3s ease",
  background: "#ffffff", // Cleaner background
  width: "100%",
  maxWidth: "450px",
  boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.08)", // Softer shadow
  "@media (max-width:880px)": {
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    padding: theme.spacing(2.5),
  },
  "@media (max-width:575px)": {
    maxWidth: "350px",
  },
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.12)", // Enhanced hover shadow
  },
}));

const ImageContainer = styled("div")(({ theme }) => ({
  flex: "0 0 100px",
  marginRight: theme.spacing(2.5), // Use theme spacing
  borderRadius: "50%",
  overflow: "hidden",
  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)", // Softer shadow
  width: "100px",
  height: "100px",
  border: `2px solid ${theme.palette.grey[200]}`, // Subtle border for definition
  "@media (max-width:880px)": {
    marginRight: 0,
    marginBottom: theme.spacing(2),
  },
}));

const StyledSelect = styled(Select)(({ theme }) => ({
  borderRadius: "8px",
  // boxShadow: "0 1px 3px rgba(0,0,0,0.05)", // Softer shadow
  backgroundColor: theme.palette.background.paper,
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: theme.palette.grey[400], // Lighter default border
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: theme.palette.primary.main, // Use theme primary color on hover
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: theme.palette.primary.main,
    borderWidth: "2px",
  },
  "& .MuiSelect-icon": {
    color: theme.palette.primary.main, // Icon color
  }
}));

const StyledDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialog-paper": {
    borderRadius: "20px",
    overflow: "hidden",
    background: "#fff",
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
    border: "none",
  },
}));

const StyledUpdateDialog = styled(StyledDialog)(({ theme }) => ({
  "& .MuiDialog-paper": {
    width: "90%",
    maxWidth: "500px",
    margin: "auto",
    borderRadius: theme.spacing(2),
    [theme.breakpoints.up("sm")]: {
      width: "500px",
    },
  },
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  background: "linear-gradient(90deg, #4A90E2, #7AC7E8)", // Enhanced: Softer blue gradient
  color: "#fff",
  textAlign: "center",
  padding: theme.spacing(2),
  fontSize: "1.5rem",
  fontWeight: 600,
  position: "relative",
}));

const DeleteDialogTitle = styled(DialogTitle)(({ theme }) => ({
  background: "linear-gradient(90deg, #FF7D7D, #FF5A5A)", // Enhanced: Softer red gradient
  color: "#fff",
  textAlign: "center",
  padding: theme.spacing(2),
  fontSize: "1.5rem",
  fontWeight: 600,
  position: "relative",
}));

const DialogHeader = ({ children, onClose }) => (
  <StyledDialogTitle>
    {children}
    {onClose ? (
      <IconButton
        aria-label="close"
        onClick={onClose}
        sx={{
          position: "absolute",
          right: 8,
          top: 8,
          color: "#fff",
        }}
      >
        <CloseIcon />
      </IconButton>
    ) : null}
  </StyledDialogTitle>
);

const DeleteDialogHeader = ({ children, onClose }) => (
  <DeleteDialogTitle>
    {children}
    {onClose ? (
      <IconButton
        aria-label="close"
        onClick={onClose}
        sx={{
          position: "absolute",
          right: 8,
          top: 8,
          color: "#fff",
        }}
      >
        <CloseIcon />
      </IconButton>
    ) : null}
  </DeleteDialogTitle>
);

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  padding: theme.spacing(3),
  backgroundColor: "#f9f9f9",
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    backgroundColor: theme.palette.background.paper, // Add background color for consistency
    "& fieldset": {
      borderColor: theme.palette.grey[400], // Lighter default border
    },
    "&:hover fieldset": {
      borderColor: theme.palette.primary.main, // Use theme primary color on hover
    },
    "&.Mui-focused fieldset": {
      borderColor: theme.palette.primary.main, // Use theme primary color on focus
      borderWidth: "2px", // Keep focused border width
    },
  },
  "& .MuiInputLabel-root": { // Style label
    color: theme.palette.text.secondary,
  },
  "& .MuiInputLabel-root.Mui-focused": { // Style focused label
    color: theme.palette.primary.main,
  },
}));

const StyledDialogActions = styled(DialogActions)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: "#f9f9f9",
  justifyContent: "flex-end",
  gap: theme.spacing(1),
}));

const StyledButton = styled(Button)(({ theme, variant = "contained", color = "primary" }) => ({
  borderRadius: "8px",
  fontWeight: "600",
  padding: "10px 20px",
  textTransform: "none",
  transition: "all 0.2s ease-in-out",
  boxShadow: `0 1px 3px ${alpha(theme.palette.common.black, 0.1)}`,
  color: variant === "outlined" ? theme.palette[color]?.main : theme.palette[color]?.contrastText,
  backgroundColor: variant === "outlined" ? "transparent" : theme.palette[color]?.main,
  border: variant === "outlined" ? `1px solid ${theme.palette[color]?.main}` : "none",
  "&:hover": {
    transform: "translateY(-1px)",
    boxShadow: `0 2px 6px ${alpha(theme.palette.common.black, 0.15)}`,
    backgroundColor: variant === "outlined" ? alpha(theme.palette[color].main, 0.08) : theme.palette[color]?.dark,
    borderColor: variant === "outlined" ? theme.palette[color]?.dark : "none",
  },
}));

const ExportButton = styled(StyledButton)(({ theme }) => ({
  // background: "linear-gradient(135deg, #4CAF50, #43A047)", // Original
  // color: "#fff", // Original
  // "&:hover": {
  //   background: "linear-gradient(135deg, #43A047, #388E3C)", // Original
  // },
  // Inherits from StyledButton, but we can override if needed, e.g., specific green theme
  backgroundColor: theme.palette.success.main,
  color: theme.palette.success.contrastText,
  "&:hover": {
    backgroundColor: theme.palette.success.dark,
  },
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1), // Use theme spacing
}));

const StyledDateCard = styled(Box)(({ theme }) => ({
  // background: "linear-gradient(135deg, #007BFF, #00C6FF)", // Original
  background: `linear-gradient(135deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
  color: theme.palette.primary.contrastText,
  padding: theme.spacing(1.5, 2.5), // Adjusted padding
  borderRadius: "10px", // Slightly less rounded
  boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.1)}`, // Softer shadow
  display: "inline-block",
  textAlign: "center",
  marginBottom: theme.spacing(2),
  fontWeight: 500,
}));

const getImageUrl = (image) => {
  if (!image) return "";
  return image.startsWith("data:") ? image : `https://fin-tracker-ncbx.onrender.com/${image}`;
};

// Main Component
const BudgetItems = () => {
  const [budgetItems, setBudgetItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [updatedValue, setUpdatedValue] = useState("");
  const [filterDate, setFilterDate] = useState(new Date());
  const [filterType, setFilterType] = useState("all");
  const [filterItem, setFilterItem] = useState("all");
  const [dateType, setDateType] = useState("month");
  const [exportLoading, setExportLoading] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [showError, setShowError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const token = sessionStorage.getItem("jwt");

  useEffect(() => {
    fetchBudget();
  }, []);

  const fetchBudget = async () => {
    try {
      const response = await axios.get("https://fin-tracker-ncbx.onrender.com/api/getUserBudget", {
        headers: {
          Auth: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      setBudgetItems((response.data.products || []).filter((item) => item.CategoriesId));
    } catch (error) {
      console.error("Error fetching budget", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const todayString = format(new Date(), "yyyy-MM-dd");
    const hasItemsToday = budgetItems.some(item => format(new Date(item.date), "yyyy-MM-dd") === todayString);
    localStorage.setItem("not", hasItemsToday ? "1" : "0");
  }, [budgetItems]);

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    handleCloseDeleteDialog();
    try {
      const response = await axios.delete("https://fin-tracker-ncbx.onrender.com/api/deleteBudget", {
        headers: {
          Auth: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        data: {
          CategoriesId: itemToDelete.CategoriesId._id,
          date: new Date(itemToDelete.date).toISOString(),
        },
      });
      if (response.status === 200) {
        console.log("Item deleted successfully", response.data);
        setBudgetItems((prevItems) =>
          prevItems.filter(
            (budgetItem) =>
              !(
                budgetItem.CategoriesId._id === itemToDelete.CategoriesId._id &&
                new Date(budgetItem.date).toISOString() === new Date(itemToDelete.date).toISOString()
              )
          )
        );
      } else {
        console.error("Failed to delete item", response.data);
      }
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

    const numericValue = parseFloat(updatedValue);
    if (isNaN(numericValue)) {
      alert("Please enter a valid number.");
      return;
    }
    handleCloseDialog();
    try {
      const response = await axios.put(
        "https://fin-tracker-ncbx.onrender.com/api/updateBudget",
        {
          CategoriesId: selectedItem.CategoriesId._id,
          date: selectedItem.date,
          valueitem: numericValue,
        },
        {
          headers: {
            Auth: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        console.log("Item updated successfully", response.data);
        setBudgetItems((prevItems) =>
          prevItems.map((item) =>
            item.CategoriesId._id === selectedItem.CategoriesId._id &&
            new Date(item.date).toISOString() === new Date(selectedItem.date).toISOString()
              ? { ...item, valueitem: numericValue }
              : item
          )
        );
      } else {
        console.error("Failed to update item", response.data);
      }
    } catch (error) {
      console.error("Error updating budget", error.response?.data || error.message);
    }
  };

  const groupByDate = (items) => {
    const grouped = items.reduce((acc, item) => {
      const date = new Date(item.date);
      const dateString = date.toISOString().split("T")[0];
      if (!acc[dateString]) {
        acc[dateString] = [];
      }
      acc[dateString].push(item);
      return acc;
    }, {});
    return Object.entries(grouped).sort((a, b) => new Date(b[0]) - new Date(a[0]));
  };

  const filterItems = (items) => {
    let filteredItems = items.filter((item) => item.CategoriesId);

    if (filterDate && !isNaN(new Date(filterDate).getTime())) {
      const selectedDate = new Date(filterDate);
      filteredItems = filteredItems.filter((item) => {
        const itemDate = new Date(item.date);
        const isSameDate =
          selectedDate.getFullYear() === itemDate.getFullYear() &&
          selectedDate.getMonth() === itemDate.getMonth() &&
          selectedDate.getDate() === itemDate.getDate();
        if (dateType === "month") {
          return (
            selectedDate.getMonth() === itemDate.getMonth() &&
            selectedDate.getFullYear() === itemDate.getFullYear()
          );
        } else if (dateType === "year") {
          return selectedDate.getFullYear() === itemDate.getFullYear();
        } else {
          return isSameDate;
        }
      });
    }

    if (filterType !== "all") {
      filteredItems = filteredItems.filter(
        (item) => item.CategoriesId.categoryType === filterType
      );
    }

    if (filterItem !== "all") {
      filteredItems = filteredItems.filter(
        (item) => item.CategoriesId.categoryName === filterItem
      );
    }

    return filteredItems;
  };

  const uniqueItems =
    filterType === "all"
      ? [
          ...new Set(
            budgetItems.filter((item) => item.CategoriesId).map((item) => item.CategoriesId.categoryName)
          ),
        ]
      : [
          ...new Set(
            budgetItems
              .filter((item) => item.CategoriesId && item.CategoriesId.categoryType === filterType)
              .map((item) => item.CategoriesId.categoryName)
          ),
        ];

  const filteredItems = filterItems(budgetItems);
  const calculateTotals = (items) => {
    const totals = { Revenues: 0, Expenses: 0 };
    items.forEach((item) => {
      const value = parseFloat(item.valueitem);
      if (item.CategoriesId) {
        if (item.CategoriesId.categoryType === "Revenues") {
          totals.Revenues += value;
        } else if (item.CategoriesId.categoryType === "Expenses") {
          totals.Expenses += value;
        }
      }
    });
    return totals;
  };

  const totals = calculateTotals(filteredItems);
  const balance = totals.Revenues - totals.Expenses;

  useEffect(() => {
    if (balance < 0) {
      setShowError(true);
      setShowSuccess(false);
      const timer = setTimeout(() => setShowError(false), 5000);
      return () => clearTimeout(timer);
    } else if (balance > 0) {
      setShowSuccess(true);
      setShowError(false);
      const timer = setTimeout(() => setShowSuccess(false), 5000);
      return () => clearTimeout(timer);
    } else {
      setShowError(false);
      setShowSuccess(false);
    }
  }, [balance]);

  const exportToExcel = async () => {
    setExportLoading(true);
    setExportProgress(0);

    const wsData = filteredItems.map((item) => ({
      Date: format(new Date(item.date), "dd/MM/yyyy"),
      Item: item.CategoriesId.categoryName,
      Type: item.CategoriesId.categoryType,
      Value: item.valueitem,
    }));

    const totalsRow = [
      {
        Date: "Totals",
        Item: "Revenues",
        Type: "",
        Value: totals.Revenues.toFixed(2),
      },
      {
        Date: "Totals",
        Item: "Expenses",
        Type: "",
        Value: totals.Expenses.toFixed(2),
      },
      {
        Date: "Totals",
        Item: "Balance",
        Type: "",
        Value: balance.toFixed(2),
      },
    ];

    const exportData = [...wsData, ...totalsRow];

    const ws = XLSX.utils.json_to_sheet(exportData, { header: ["Date", "Item", "Type", "Value"] });

    ws["!cols"] = [
      { wpx: 100 },
      { wpx: 200 },
      { wpx: 100 },
      { wpx: 100 },
    ];

    const headerCellStyle = {
      font: { bold: true },
      fill: { fgColor: { rgb: "FFFF00" } },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      },
      alignment: { horizontal: "center" },
    };

    const headers = ["Date", "Item", "Type", "Value"];
    headers.forEach((header, index) => {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: index });
      if (ws[cellAddress]) {
        ws[cellAddress].s = headerCellStyle;
      }
    });

    setExportProgress(50);

    setTimeout(() => {
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "BudgetItems");
      XLSX.writeFile(wb, "BudgetItems.xlsx");
      setExportProgress(100);
      setExportLoading(false);
      setExportProgress(0);
    }, 100);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Snackbar
        open={showError}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        autoHideDuration={5000}
        onClose={() => setShowError(false)}
      >
        <Alert
          onClose={() => setShowError(false)}
          severity="error"
          sx={{ fontSize: "1.2rem", padding: "16px", width: "100%" }}
        >
          Warning: Expenses exceed Revenues!
        </Alert>
      </Snackbar>

      <Snackbar
        open={showSuccess}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        autoHideDuration={5000}
        onClose={() => setShowSuccess(false)}
      >
        <Alert
          onClose={() => setShowSuccess(false)}
          severity="success"
          sx={{ fontSize: "1.2rem", padding: "16px", width: "100%" }}
        >
          Success: Revenues exceed Expenses!
        </Alert>
      </Snackbar>

      <Box
        sx={{
          fontFamily: "'Cairo', sans-serif",
          padding: { xs: 2, sm: 4 },
          background: "#f5f5f5",
          minHeight: "100vh",
        }}
      >
        <Box
          sx={{
            marginBottom: 4,
            display: "flex",
            justifyContent: "center",
            gap: 2,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <FilterListIcon sx={{ fontSize: 30, color: "#007BFF" }} />
            <Typography variant="h5">Filters</Typography>
          </Box>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Date Type</InputLabel>
            <StyledSelect
              value={dateType}
              onChange={(e) => setDateType(e.target.value)}
              label="Date Type"
            >
              <MenuItem value="full">Full Date</MenuItem>
              <MenuItem value="month">Month</MenuItem>
              <MenuItem value="year">Year</MenuItem>
            </StyledSelect>
          </FormControl>
          <DatePicker
            label={
              dateType === "month"
                ? "Select Month"
                : dateType === "year"
                ? "Select Year"
                : "Select Date"
            }
            views={
              dateType === "month"
                ? ["year", "month"]
                : dateType === "year"
                ? ["year"]
                : ["year", "month", "day"]
            }
            value={filterDate}
            onChange={(newValue) => {
              if (newValue && !isNaN(new Date(newValue).getTime())) {
                setFilterDate(newValue);
              }
            }}
            renderInput={(params) => <TextField {...params} sx={{ minWidth: 180 }} />}
          />
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Type</InputLabel>
            <StyledSelect
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              label="Type"
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="Revenues">Revenues</MenuItem>
              <MenuItem value="Expenses">Expenses</MenuItem>
            </StyledSelect>
          </FormControl>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Item</InputLabel>
            <StyledSelect
              value={filterItem}
              onChange={(e) => setFilterItem(e.target.value)}
              label="Item"
            >
              <MenuItem value="all">All</MenuItem>
              {uniqueItems.map((item, index) => (
                <MenuItem key={index} value={item}>
                  {item}
                </MenuItem>
              ))}
            </StyledSelect>
          </FormControl>
          <ExportButton onClick={exportToExcel} variant="contained" disabled={exportLoading}>
            {exportLoading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <DownloadIcon />
            )}
            {exportLoading ? "Exporting..." : "Export to Excel"}
          </ExportButton>
        </Box>

        {exportLoading && (
          <LinearProgress variant="determinate" value={exportProgress} sx={{ marginBottom: 2 }} />
        )}

        <Box
          sx={{
            marginBottom: 4,
            display: "flex",
            justifyContent: "center",
            gap: 4,
            flexDirection: "row",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <Card
            sx={{
              minWidth: { xs: 150, sm: 200 },
              textAlign: "center",
              background: "linear-gradient(135deg, #66bb6a, #43a047)",
              color: "#fff",
              borderRadius: "16px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            <CardContent>
              <Box display="flex" justifyContent="center" alignItems="center" gap={1}>
                <TrendingUpIcon sx={{ fontSize: 30 }} />
                <Typography variant="h6" gutterBottom>
                  Total Revenues
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                {totals.Revenues.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
          <Card
            sx={{
              minWidth: { xs: 150, sm: 200 },
              textAlign: "center",
              background: "linear-gradient(135deg, #ef5350, #e53935)",
              color: "#fff",
              borderRadius: "16px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            <CardContent>
              <Box display="flex" justifyContent="center" alignItems="center" gap={1}>
                <TrendingDownIcon sx={{ fontSize: 30 }} />
                <Typography variant="h6" gutterBottom>
                  Total Expenses
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                {totals.Expenses.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
          <Card
            sx={{
              minWidth: { xs: 150, sm: 200 },
              textAlign: "center",
              background:
                balance >= 0
                  ? "linear-gradient(135deg, #66bb6a, #43a047)"
                  : "linear-gradient(135deg, #ef5350, #e53935)",
              color: "#fff",
              borderRadius: "16px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            <CardContent>
              <Box display="flex" justifyContent="center" alignItems="center" gap={1}>
                <AccountBalanceIcon sx={{ fontSize: 30 }} />
                <Typography variant="h6" gutterBottom>
                  Balance
                </Typography>
              </Box>
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
          groupByDate(filteredItems).map(([date, items]) => (
            <Box key={date} sx={{ marginBottom: 4 }}>
              <StyledDateCard>
                <Box display="flex" alignItems="center" gap={1} justifyContent="center">
                  <CalendarTodayIcon sx={{ fontSize: 24, color: "#fff" }} />
                  <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                    {format(new Date(date), "dd MMMM yyyy")}
                  </Typography>
                </Box>
              </StyledDateCard>
              <Grid container spacing={3} justifyContent="center">
                {items
                  .filter((item) => item.CategoriesId)
                  .map((item, index) => (
                    <Grid item key={index} xs={12} sm={6}>
                      <StyledCard>
                        <ImageContainer>
                          <img
                            src={getImageUrl(item.CategoriesId.image)}
                            alt="Category"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        </ImageContainer>
                        <CardContent
                          sx={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <Typography
                            variant="h6"
                            gutterBottom
                            sx={{
                              color:
                                item.CategoriesId.categoryType === "Revenues"
                                  ? "#4CAF50"
                                  : "#F44336",
                              fontWeight: "600",
                            }}
                          >
                            {item.CategoriesId.categoryType === "Expenses"
                              ? `-${item.valueitem}`
                              : item.valueitem}
                          </Typography>
                          <Box display="flex" alignItems="center" gap={1}>
                            <CategoryIcon
                              sx={{
                                color:
                                  item.CategoriesId.categoryType === "Revenues"
                                    ? "#4CAF50"
                                    : "#F44336",
                              }}
                            />
                            <Typography
                              variant="h5"
                              sx={{
                                color:
                                  item.CategoriesId.categoryType === "Revenues"
                                    ? "#4CAF50"
                                    : "#F44336",
                                fontWeight: "bold",
                              }}
                            >
                              {item.CategoriesId.categoryName}
                            </Typography>
                          </Box>
                          <Box
                            display="flex"
                            justifyContent="center"
                            gap={1}
                            sx={{ marginTop: 2, flexDirection: { xs: "column", sm: "row" } }}
                          >
                            <StyledButton
                              variant="contained"
                              color="error"
                              onClick={() => handleDeleteClick(item)}
                              startIcon={<DeleteIcon />}
                            >
                              Delete
                            </StyledButton>
                            <StyledButton
                              variant="contained"
                              color="primary"
                              onClick={() => handleUpdateClick(item)}
                              startIcon={<EditIcon />}
                            >
                              Update
                            </StyledButton>
                          </Box>
                        </CardContent>
                      </StyledCard>
                    </Grid>
                  ))}
              </Grid>
            </Box>
          ))
        )}

        <StyledUpdateDialog open={openDialog} onClose={handleCloseDialog}>
          <DialogHeader onClose={handleCloseDialog}>
            Update Budget Item
          </DialogHeader>
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
          <StyledDialogActions>
            <StyledButton
              onClick={handleCloseDialog}
              color="secondary"
              variant="outlined"
              startIcon={<CloseIcon />}
            >
              Cancel
            </StyledButton>
            <StyledButton
              onClick={handleSaveUpdate}
              color="primary"
              variant="contained"
              startIcon={<SaveIcon />}
            >
              Save
            </StyledButton>
          </StyledDialogActions>
        </StyledUpdateDialog>

        <StyledDialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
          <DeleteDialogHeader onClose={handleCloseDeleteDialog}>
            Confirm Deletion
          </DeleteDialogHeader>
          <StyledDialogContent>
            <Typography variant="body1">
              Are you sure you want to delete the item:{" "}
              <strong>{itemToDelete?.CategoriesId?.categoryName}</strong>?
            </Typography>
          </StyledDialogContent>
          <StyledDialogActions>
            <StyledButton
              onClick={handleCloseDeleteDialog}
              color="secondary"
              variant="outlined"
              startIcon={<CloseIcon />}
            >
              Cancel
            </StyledButton>
            <StyledButton
              onClick={confirmDelete}
              color="error"
              variant="contained"
              startIcon={<DeleteIcon />}
            >
              Delete
            </StyledButton>
          </StyledDialogActions>
        </StyledDialog>
      </Box>
    </LocalizationProvider>
  );
};

export default BudgetItems;