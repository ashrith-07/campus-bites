const cloudinary = require('../utils/cloudinary');
const multer = require('multer');

// --- Multer Configuration ---
// Multer is used to process the file upload request.
// We use memory storage as Cloudinary can stream directly from memory.
const storage = multer.memoryStorage();

// Multer middleware: handles single file field named 'image'
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // Limit file size to 5MB
}).single('image');

// --- Cloudinary Upload Logic ---
const uploadImage = async (req, res) => {
    // Check if the multer middleware found a file
    if (!req.file) {
        return res.status(400).json({ error: 'No image file uploaded.' });
    }

    try {
        // Upload the file buffer to Cloudinary
        const result = await cloudinary.uploader.upload(
            // Convert buffer to Base64 string for Cloudinary upload
            `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
            {
                folder: 'campus-bites/menu-items', // Organize images in a specific folder
                resource_type: 'image',
            }
        );

        // Success: Send back the secure URL to be saved in the database
        res.status(200).json({
            message: 'Image uploaded successfully.',
            imageUrl: result.secure_url,
            publicId: result.public_id // Useful if you need to delete images later
        });
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        res.status(500).json({ error: 'Image upload failed. Check Cloudinary settings.' });
    }
};

module.exports = {
    upload,
    uploadImage, 
};