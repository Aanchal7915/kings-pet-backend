const mongoose = require('mongoose');

const PageSEOSchema = new mongoose.Schema({
    section: {
        type: String,
        required: true,
        unique: true, // e.g., 'home', 'services', 'about', etc.
    },
    title: {
        type: String,
        required: true,
    },
    metaDescription: {
        type: String,
        required: true,
    },
    h1OrH2: {
        type: String,
        default: '',
    },
    seoText: {
        type: String,
        default: '',
    }
}, { timestamps: true });

module.exports = mongoose.model('PageSEO', PageSEOSchema);
