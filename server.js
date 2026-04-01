const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const PageSEO = require('./models/PageSEO');
const Blog = require('./models/Blog');

// Load env vars
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Database Connection
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};
connectDB();

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/blogs', require('./routes/blogRoutes'));
app.use('/api/seo', require('./routes/seoRoutes'));

const PORT = process.env.PORT || 5000;

// Serve Static Files from Frontend Build (Must be after API routes)
const frontendPath = path.join(__dirname, '../kings-pet-hospital-main/dist');
app.use(express.static(frontendPath));

// Dynamic SEO Injector Catch-all (Express 5 Regex Syntax)
app.get(/.*/, async (req, res) => {
    try {
        const url = req.path;
        let section = 'home';
        // 1. Identify Section based on URL (Mapping Paths to Admin Sections)
        const pathParts = url.split('/').filter(p => p);
        if (url === '/' || url === '' || pathParts.length === 0) {
            section = 'home';
        } else {
            const firstPart = pathParts[0];
            // Match to known sections
            const validSections = ['services', 'gallery', 'about', 'team', 'blog', 'booking', 'contact', 'pets-care', 'privacy', 'terms'];
            if (validSections.includes(firstPart)) {
                section = firstPart;
            } else {
                section = 'home'; // Default
            }
        }

        let title = 'Kings Pet Hospital | Trusted Pet Care';
        let description = 'Kings Pet Hospital - Professional pet care services, expert veterinarians, and modern medical facilities.';
        let keywords = 'Kings Pet Hospital, Pet Hospital, Veterinary, Pet Care';

        // 2. Specialized SEO for Blog Detail
        const urlParts = url.split('/');
        if (urlParts[1] === 'blog' && urlParts[2]) {
            try {
                const blogId = urlParts[2];
                const blog = await Blog.findById(blogId);
                if (blog) {
                    title = blog.metaTitle || blog.title || title;
                    description = blog.metaDescription || description;
                    keywords = blog.metaKeywords || keywords;
                }
            } catch (err) {
                console.log('SEO: Blog not found or ID error:', err.message);
            }
        } 
        // 3. Section SEO from Database
        else {
            try {
                const seoData = await PageSEO.findOne({ section });
                if (seoData) {
                    title = seoData.title || title;
                    description = seoData.metaDescription || description;
                    keywords = seoData.seoText || keywords;
                }
            } catch (err) {
                console.log('SEO: Section fetch error:', err.message);
            }
        }

        const indexPath = path.join(frontendPath, 'index.html');
        if (!fs.existsSync(indexPath)) {
            return res.status(404).send('Site content not found. Please run "npm run build" in the frontend folder.');
        }

        let html = fs.readFileSync(indexPath, 'utf8');

        // Replacement Logic
        html = html.replace(/{{SEO_TITLE}}/g, title);
        html = html.replace(/{{SEO_DESCRIPTION}}/g, description || '');
        html = html.replace(/{{SEO_KEYWORDS}}/g, keywords || '');

        res.set('Content-Type', 'text/html');
        res.send(html);
    } catch (error) {
        console.error('Critical SEO Error:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
