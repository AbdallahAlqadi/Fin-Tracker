const CardUser = require('../models/cardUser');

/**
 * @desc    Get all cards added by the logged-in user
 * @route   GET /api/carduser/getCardUser (assuming a base route like /api/carduser)
 * @access  Private (requires JWT verification)
 */
exports.getCardUser = async (req, res) => {
    try {
        // Find the document for the logged-in user (req.user should contain the userId)
        // No need to populate 'carduser' as it's an array of subdocuments, not references.
        const userCardsDocument = await CardUser.findOne({ userId: req.user });

        if (!userCardsDocument) {
            // If the user hasn't added any cards yet, return an empty array or appropriate message
            return res.status(200).json({ carduser: [] }); 
        }

        // Return the array of cards directly from the document
        res.status(200).json({ carduser: userCardsDocument.carduser });

    } catch (error) {
        console.error('Error in getCardUser:', error);
        res.status(500).json({ error: 'Failed to retrieve user cards.', details: error.message });
    }
};

/**
 * @desc    Add a new card for the logged-in user
 * @route   POST /api/carduser/addCardUser (assuming a base route like /api/carduser)
 * @access  Private (requires JWT verification)
 */
exports.addCardUser = async (req, res) => {
    const { categoryName, categoryImage, categoryType } = req.body;
    const userId = req.user; // Assuming req.user holds the ObjectId of the logged-in user

    // Basic validation
    if (!categoryName || !categoryImage || !categoryType) {
        return res.status(400).json({ error: 'Missing required fields: categoryName, categoryImage, categoryType.' });
    }

    try {
        // Find the user's card document
        let userCardsDocument = await CardUser.findOne({ userId });

        // If the document exists, check if the categoryName already exists in the carduser array
        if (userCardsDocument) {
            const existingCategory = userCardsDocument.carduser.find(
                card => card.categoryName === categoryName
            );
            if (existingCategory) {
                // Keep the original Arabic error message as requested
                return res.status(400).json({ error: 'هذه الفئة موجودة بالفعل لهذا المستخدم.' });
            }
        }

        // Prepare the new card object based on the sub-schema
        const newCard = {
            categoryName,
            categoryImage, // Expecting Base64 string or URL
            categoryType
        };

        // Find the user's document and push the new card.
        // Use upsert: true to create the document if it doesn't exist.
        const updatedCardUserDoc = await CardUser.findOneAndUpdate(
            { userId },
            { $push: { carduser: newCard } },
            { new: true, upsert: true, setDefaultsOnInsert: true } // setDefaultsOnInsert might be useful if sub-schema had defaults
        );

        // Return success message and the newly added card (or the whole updated doc)
        // Returning just the added card might be more efficient for the frontend
        const addedCard = updatedCardUserDoc.carduser.find(card => card.categoryName === categoryName); // Find the specific card added

        return res.status(201).json({ // 201 Created is more appropriate for successful addition
            message: 'تمت الإضافة بنجاح.', // Keep original Arabic message
            addedCard: addedCard // Send back the card that was just added
            // data: updatedCardUserDoc // Alternatively send the whole updated document
        });

    } catch (error) {
        console.error('Error in addCardUser:', error);
        // Check for potential validation errors from Mongoose schema
        if (error.name === 'ValidationError') {
             return res.status(400).json({ error: 'Validation failed.', details: error.message });
        }
        return res.status(500).json({ error: 'Failed to add card.', details: error.message });
    }
};
