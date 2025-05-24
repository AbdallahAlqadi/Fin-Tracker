const Budget = require('../models/PersonalBudget '); // Assuming correct path
const Category = require('../models/categoryData'); // Global categories
const UserCategory = require('../models/carduser'); // User-specific categories
const mongoose = require('mongoose');

exports.getUserBudget = async (req, res) => {
    try {
        // Not populating CategoriesId as it can refer to two different collections.
        // Frontend will need to fetch category details separately if needed.
        const budget = await Budget.findOne({ userId: req.user }); 
        res.status(200).json(budget);
    } catch (error) {
        console.error('Error fetching user budget:', error);
        res.status(500).json({ error: 'Failed to fetch budget data.' });
    }
};

// Add budget item (MODIFIED to support global and user-specific categories)
exports.addBudget = async (req, res) => {
    const { CategoriesId, valueitem, date } = req.body;
    const userId = req.user;

    // Validate input
    if (!mongoose.Types.ObjectId.isValid(CategoriesId)) {
        return res.status(400).json({ error: 'Invalid Category ID format.' });
    }
    if (!date || isNaN(new Date(date))) {
         return res.status(400).json({ error: 'Invalid or missing date.' });
    }
     if (valueitem === undefined || valueitem === null || isNaN(parseFloat(valueitem)) || parseFloat(valueitem) < 0) {
        return res.status(400).json({ error: 'Invalid or missing value. Must be a non-negative number.' });
    }

    const selectedDate = new Date(date).toISOString().split('T')[0];

    try {
        // 1. Validate Category Existence (Check both Global and User-Specific)
        const globalCategory = await Category.findById(CategoriesId);
        const userCategory = await UserCategory.findOne({ _id: CategoriesId, userId: userId });

        // If the ID doesn't exist in either global categories or the user's private categories, return error
        if (!globalCategory && !userCategory) {
            return res.status(404).json({ error: 'Category not found or does not belong to the user.' });
        }

        // 2. Check for duplicate budget entry for this category on the same date
        const existingBudgetEntry = await Budget.findOne({
            userId,
            products: {
                $elemMatch: {
                    CategoriesId: CategoriesId, // Match the specific category ID
                    date: {
                        $gte: new Date(selectedDate),
                        $lt: new Date(new Date(selectedDate).setDate(new Date(selectedDate).getDate() + 1))
                    }
                }
            }
        });

        if (existingBudgetEntry) {
            // Using the user's original Arabic error message
            return res.status(400).json({ error: 'لا يمكنك إضافة نفس الفئة أكثر من مرة في نفس التاريخ.' }); 
        }

        // 3. Add the new budget item
        const updatedBudget = await Budget.findOneAndUpdate(
            { userId },
            {
                $push: {
                    products: {
                        CategoriesId: CategoriesId, // Store the validated ID
                        valueitem: parseFloat(valueitem), // Ensure it's a number
                        date: new Date(selectedDate)
                    }
                }
            },
            { new: true, upsert: true } // Create budget document if it doesn't exist
        );

        // Using the user's original Arabic success message
        return res.status(200).json({ message: 'تمت الإضافة بنجاح.', budget: updatedBudget }); 

    } catch (error) {
        console.error('Error in addBudget:', error);
        return res.status(500).json({ error: 'An error occurred while adding the budget item.' });
    }
};


// Update budget item (Needs similar validation logic if category could change, but typically only value changes)
exports.updateBudget = async (req, res) => {
    const { CategoriesId, valueitem, date } = req.body;
    const userId = req.user;

    // Validate input
    if (!mongoose.Types.ObjectId.isValid(CategoriesId)) {
        return res.status(400).json({ error: 'Invalid Category ID format.' });
    }
     if (!date || isNaN(new Date(date))) {
         return res.status(400).json({ error: 'Invalid or missing date.' });
    }
     if (valueitem === undefined || valueitem === null || isNaN(parseFloat(valueitem)) || parseFloat(valueitem) < 0) {
        return res.status(400).json({ error: 'Invalid or missing value. Must be a non-negative number.' });
    }

    const selectedDate = new Date(date).toISOString().split('T')[0];

    try {
        // Find the budget document for the user
        const budget = await Budget.findOne({ userId });
        if (!budget) {
            return res.status(404).json({ error: 'Budget not found for this user.' });
        }

        // Find the index of the product to update based on Category ID and Date
        const budgetIndex = budget.products.findIndex((item) =>
            item.CategoriesId.toString() === CategoriesId &&
            new Date(item.date).toISOString().split('T')[0] === selectedDate
        );

        if (budgetIndex > -1) {
            // Update the value
            budget.products[budgetIndex].valueitem = parseFloat(valueitem);
            await budget.save();
            res.status(200).json({ message: 'Budget item updated successfully.', budget });
        } else {
            res.status(404).json({ error: 'Budget item not found for the specified category and date.' });
        }
    } catch (error) {
        console.error('Error in updateBudget:', error);
        res.status(500).json({ error: 'An error occurred while updating the budget item.' });
    }
};

// Delete budget item (Consider deleting by budget item's unique _id if possible)
exports.deleteBudget = async (req, res) => {
    // Keeping original logic using CategoriesId and date for now
    const { CategoriesId, date } = req.body;
    const userId = req.user;

    // Validate input
     if (!mongoose.Types.ObjectId.isValid(CategoriesId)) {
        return res.status(400).json({ error: 'Invalid Category ID format.' });
    }
     if (!date || isNaN(new Date(date))) {
         return res.status(400).json({ error: 'Invalid or missing date.' });
    }

    const selectedDate = new Date(date).toISOString().split('T')[0];

    try {
        const budget = await Budget.findOne({ userId });
        if (!budget) {
            return res.status(404).json({ error: 'Budget not found for this user.' });
        }

        // Filter out the item to delete
        const initialLength = budget.products.length;
        budget.products = budget.products.filter(item =>
            !(item.CategoriesId.toString() === CategoriesId && new Date(item.date).toISOString().split('T')[0] === selectedDate)
        );

        // Check if an item was actually removed
        if (budget.products.length < initialLength) {
            await budget.save();
            res.status(200).json({ message: 'Budget item deleted successfully.', budget });
        } else {
            res.status(404).json({ error: 'Budget item not found for the specified category and date.' });
        }
    } catch (error) {
        console.error('Error in deleteBudget:', error);
        res.status(500).json({ error: 'An error occurred while deleting the budget item.' });
    }
};

