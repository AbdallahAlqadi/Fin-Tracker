const BudgetModel = require("../models/PersonalBudget "); // Assuming path is correct
const Category = require("../models/categoryData"); // Assuming path is correct
const UserCard = require("../models/carduser"); // Assuming user card model path

// --- MODIFIED Get User Budget ---
exports.getUserBudget = async (req, res) => {
    try {
        const budget = await BudgetModel.findOne({ userId: req.user })
            .populate("products.CategoriesId") // Populate admin categories
            .populate("products.UserCardId");   // Populate user cards
        
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

// --- MODIFIED Add Budget Item ---
exports.addBudget = async (req, res) => {
    // Expect either CategoriesId OR UserCardId, not both
    const { CategoriesId, UserCardId, valueitem, date } = req.body;
    const userId = req.user;

    if ((!CategoriesId && !UserCardId) || (CategoriesId && UserCardId)) {
        return res.status(400).json({ error: "Please provide either CategoriesId or UserCardId, but not both." });
    }
    if (!valueitem || !date) {
        return res.status(400).json({ error: "Value and date are required." });
    }

    const selectedDate = new Date(date).toISOString().split("T")[0]; // Normalize date to YYYY-MM-DD
    const startDate = new Date(selectedDate);
    const endDate = new Date(new Date(selectedDate).setDate(startDate.getDate() + 1));

    try {
        // Check if the specific card (either admin or user) already exists for this user on this date
        const existingEntryQuery = {
            userId,
            date: { $gte: startDate, $lt: endDate },
        };
        if (CategoriesId) {
            existingEntryQuery["products.CategoriesId"] = CategoriesId;
        } else {
            existingEntryQuery["products.UserCardId"] = UserCardId;
        }

        const existingBudgetEntry = await BudgetModel.findOne({
            userId,
            products: {
                $elemMatch: {
                    ...(CategoriesId && { CategoriesId }),
                    ...(UserCardId && { UserCardId }),
                    date: { $gte: startDate, $lt: endDate }
                }
            }
        });

        if (existingBudgetEntry) {
            const cardName = CategoriesId ? "category" : "card";
            return res.status(400).json({ error: `You have already added an entry for this ${cardName} on this date.` });
        }

        // Create the new product entry
        const newProduct = {
            valueitem,
            date: startDate, // Store normalized date
        };
        if (CategoriesId) {
            newProduct.CategoriesId = CategoriesId;
        } else {
            newProduct.UserCardId = UserCardId;
        }

        // Add the new product entry to the user's budget
        const updatedBudget = await BudgetModel.findOneAndUpdate(
            { userId },
            { $push: { products: newProduct } },
            { new: true, upsert: true, setDefaultsOnInsert: true } // Ensure document creation if not exists
        ).populate("products.CategoriesId").populate("products.UserCardId");

        return res.status(200).json({ message: "Budget item added successfully.", budget: updatedBudget });

    } catch (error) {
        console.error("Error in addBudget:", error);
        return res.status(500).json({ error: "Failed to add budget item.", details: error.message });
    }
};

// --- MODIFIED Update Budget Item ---
// Note: Updating requires knowing the specific budget item's _id within the products array,
// or a unique combination (like card ID + date). The current frontend seems to only send card ID + date.
// This implementation assumes updating based on Card ID + Date.
exports.updateBudget = async (req, res) => {
    const { CategoriesId, UserCardId, valueitem, date } = req.body;
    const userId = req.user;

    if ((!CategoriesId && !UserCardId) || (CategoriesId && UserCardId)) {
        return res.status(400).json({ error: "Please provide either CategoriesId or UserCardId for identification." });
    }
    if (valueitem === undefined || valueitem === null || !date) { // Check for undefined/null value
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
            const isDateMatch = itemDate === selectedDate;
            let isCardMatch = false;
            if (CategoriesId && item.CategoriesId) {
                isCardMatch = item.CategoriesId.toString() === CategoriesId;
            } else if (UserCardId && item.UserCardId) {
                isCardMatch = item.UserCardId.toString() === UserCardId;
            }
            return isDateMatch && isCardMatch;
        });

        if (productIndex > -1) {
            // Update the valueitem of the found product
            budget.products[productIndex].valueitem = valueitem;
            await budget.save();
            // Repopulate before sending back
            const updatedBudget = await BudgetModel.findById(budget._id)
                                        .populate("products.CategoriesId")
                                        .populate("products.UserCardId");
            res.status(200).json({ message: "Budget item updated successfully.", budget: updatedBudget });
        } else {
            const cardName = CategoriesId ? "category" : "card";
            res.status(404).json({ error: `Budget item for this ${cardName} not found on the specified date.` });
        }
    } catch (error) {
        console.error("Error updating budget:", error);
        res.status(500).json({ error: "Failed to update budget item.", details: error.message });
    }
};

// --- MODIFIED Delete Budget Item ---
// Similar to update, requires unique identification (Card ID + Date).
exports.deleteBudget = async (req, res) => {
    const { CategoriesId, UserCardId, date } = req.body; // Expect ID and Date
    const userId = req.user;

    if ((!CategoriesId && !UserCardId) || (CategoriesId && UserCardId)) {
        return res.status(400).json({ error: "Please provide either CategoriesId or UserCardId for identification." });
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
            const isDateMatch = itemDate === selectedDate;
            let isCardMatch = false;
            if (CategoriesId && item.CategoriesId) {
                isCardMatch = item.CategoriesId.toString() === CategoriesId;
            } else if (UserCardId && item.UserCardId) {
                isCardMatch = item.UserCardId.toString() === UserCardId;
            }
            return isDateMatch && isCardMatch;
        });

        if (productIndex > -1) {
            // Remove the item from the products array
            budget.products.splice(productIndex, 1);
            await budget.save();
             // Repopulate before sending back
            const updatedBudget = await BudgetModel.findById(budget._id)
                                        .populate("products.CategoriesId")
                                        .populate("products.UserCardId");
            res.status(200).json({ message: "Budget item deleted successfully.", budget: updatedBudget });
        } else {
            const cardName = CategoriesId ? "category" : "card";
            res.status(404).json({ error: `Budget item for this ${cardName} not found on the specified date.` });
        }
    } catch (error) {
        console.error("Error deleting budget item:", error);
        res.status(500).json({ error: "Failed to delete budget item.", details: error.message });
    }
};