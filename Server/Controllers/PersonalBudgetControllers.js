const BudgetModel = require("../models/PersonalBudget "); // Assuming path is correct
const Category = require("../models/categoryData"); // Assuming path is correct

// --- GET User Budget ---
exports.getUserBudget = async (req, res) => {
  try {
    const budget = await BudgetModel.findOne({ userId: req.user })
      .populate("products.CategoriesId"); // Populate admin categories only

    if (!budget) {
      // If no budget document exists yet, return an empty structure
      return res.status(200).json({ userId: req.user, products: [] });
    }

    res.status(200).json(budget);
  } catch (error) {
    console.error("Error fetching budget:", error);
    res.status(500).json({ error: "Failed to fetch budget data.", details: error.message });
  }
};

// --- Add Budget Item ---
exports.addBudget = async (req, res) => {
  const { CategoriesId, valueitem, date } = req.body;
  const userId = req.user;

  if (!CategoriesId) {
    return res.status(400).json({ error: "Please provide a CategoriesId." });
  }
  if (!valueitem || !date) {
    return res.status(400).json({ error: "Value and date are required." });
  }

  const selectedDate = new Date(date).toISOString().split("T")[0]; // Normalize date to YYYY-MM-DD
  const startDate = new Date(selectedDate);
  const endDate = new Date(new Date(selectedDate).setDate(startDate.getDate() + 1));

  try {
    // Check if this category already exists for this user on this date
    const existingEntry = await BudgetModel.findOne({
      userId,
      products: {
        $elemMatch: {
          CategoriesId,
          date: { $gte: startDate, $lt: endDate }
        }
      }
    });

    if (existingEntry) {
      return res.status(400).json({ error: "You have already added an entry for this category on this date." });
    }

    // Create the new product entry
    const newProduct = { CategoriesId, valueitem, date: startDate };

    // Add the new product entry to the user's budget
    const updatedBudget = await BudgetModel.findOneAndUpdate(
      { userId },
      { $push: { products: newProduct } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).populate("products.CategoriesId");

    return res.status(200).json({ message: "Budget item added successfully.", budget: updatedBudget });
  } catch (error) {
    console.error("Error in addBudget:", error);
    return res.status(500).json({ error: "Failed to add budget item.", details: error.message });
  }
};

// --- Update Budget Item ---
exports.updateBudget = async (req, res) => {
  const { CategoriesId, valueitem, date } = req.body;
  const userId = req.user;

  if (!CategoriesId) {
    return res.status(400).json({ error: "Please provide a CategoriesId for identification." });
  }
  if (valueitem === undefined || valueitem === null || !date) {
    return res.status(400).json({ error: "New value and date are required." });
  }

  const selectedDate = new Date(date).toISOString().split("T")[0];
  const startDate = new Date(selectedDate);
  const endDate = new Date(new Date(selectedDate).setDate(startDate.getDate() + 1));

  try {
    const budget = await BudgetModel.findOne({ userId });
    if (!budget) {
      return res.status(404).json({ error: "Budget not found for this user." });
    }

    // Find the index of the product to update
    const productIndex = budget.products.findIndex(item => {
      const itemDate = new Date(item.date).toISOString().split("T")[0];
      return itemDate === selectedDate && item.CategoriesId.toString() === CategoriesId;
    });

    if (productIndex > -1) {
      budget.products[productIndex].valueitem = valueitem;
      await budget.save();

      const updatedBudget = await BudgetModel.findById(budget._id)
        .populate("products.CategoriesId");
      return res.status(200).json({ message: "Budget item updated successfully.", budget: updatedBudget });
    } else {
      return res.status(404).json({ error: "Budget item for this category not found on the specified date." });
    }
  } catch (error) {
    console.error("Error updating budget:", error);
    return res.status(500).json({ error: "Failed to update budget item.", details: error.message });
  }
};

// --- Delete Budget Item ---
exports.deleteBudget = async (req, res) => {
  const { CategoriesId, date } = req.body;
  const userId = req.user;

  if (!CategoriesId) {
    return res.status(400).json({ error: "Please provide a CategoriesId for identification." });
  }
  if (!date) {
    return res.status(400).json({ error: "Date is required to identify the item to delete." });
  }

  const selectedDate = new Date(date).toISOString().split("T")[0];
  const startDate = new Date(selectedDate);
  const endDate = new Date(new Date(selectedDate).setDate(startDate.getDate() + 1));

  try {
    const budget = await BudgetModel.findOne({ userId });
    if (!budget) {
      return res.status(404).json({ error: "Budget not found for this user." });
    }

    // Find the index of the product to delete
    const productIndex = budget.products.findIndex(item => {
      const itemDate = new Date(item.date).toISOString().split("T")[0];
      return itemDate === selectedDate && item.CategoriesId.toString() === CategoriesId;
    });

    if (productIndex > -1) {
      budget.products.splice(productIndex, 1);
      await budget.save();

      const updatedBudget = await BudgetModel.findById(budget._id)
        .populate("products.CategoriesId");
      return res.status(200).json({ message: "Budget item deleted successfully.", budget: updatedBudget });
    } else {
      return res.status(404).json({ error: "Budget item for this category not found on the specified date." });
    }
  } catch (error) {
    console.error("Error deleting budget item:", error);
    return res.status(500).json({ error: "Failed to delete budget item.", details: error.message });
  }
};
