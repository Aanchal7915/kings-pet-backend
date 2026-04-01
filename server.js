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

// Serve Static Files from Frontend Build (Disabled index to allow SEO injection priority)
const frontendPath = path.join(__dirname, 'dist');
app.use(express.static(frontendPath, { index: false }));

// Dynamic SEO Injector Catch-all (Express 5 Regex Syntax)
app.get(/.*/, async (req, res) => {
    try {
        const url = req.path;
        const pathParts = url.split('/').filter(p => p);
        const firstPart = pathParts[0]?.toLowerCase();

        let section = 'home';
        let blogId = null;

        if (firstPart) {
            if (firstPart === 'blog' && pathParts[1]) {
                section = 'blog-detail';
                blogId = pathParts[1];
            } else {
                const validSections = ['services', 'gallery', 'about', 'team', 'blog', 'booking', 'contact', 'pets-care', 'privacy', 'terms', 'privacy-policy', 'terms-of-service'];
                if (validSections.includes(firstPart)) {
                    section = firstPart;
                }
            }
        }

        // Debug Logs for Render
        console.log(`[DEBUG] SEO Section Match: "${section}" | Original Path: "${url}"`);

        // Default Fallbacks
        let title = 'Kings Pet Hospital | Trusted Pet Care';
        let description = 'Professional pet care services, expert veterinarians, and modern medical facilities.';
        let keywords = 'Pet Care, Hospital, Veterinary';

        // 2. Fetch Data from DB
        try {
            if (section === 'blog-detail' && blogId) {
                const blogData = await Blog.findById(blogId);
                if (blogData) {
                    title = blogData.metaTitle || blogData.title || title;
                    description = blogData.metaDescription || blogData.description || description;
                    keywords = blogData.metaKeywords || blogData.keywords || keywords;
                    console.log(`[DEBUG] Found Blog SEO for ID: ${blogId}`);
                }
            } else {
                const seoData = await PageSEO.findOne({ 
                    section: { $regex: new RegExp('^' + section + '$', 'i') } 
                });
                if (seoData) {
                    title = seoData.title || title;
                    description = seoData.metaDescription || seoData.description || description;
                    keywords = seoData.metaKeywords || seoData.keywords || keywords;
                    console.log(`[DEBUG] DB Found SEO for section: ${section} | Title: ${title}`);
                } else {
                    console.log(`[DEBUG] No SEO found in DB for: ${section} (Using Defaults)`);
                }
            }
        } catch (dbError) {
            console.error('[DEBUG] Database Error during SEO fetch:', dbError.message);
        }

        // 3. Inject into HTML
        const indexPath = path.join(frontendPath, 'index.html');
        if (!fs.existsSync(indexPath)) {
            return res.status(404).send('Site content not found. Please run "npm run build" in the frontend folder.');
        }

        let html = fs.readFileSync(indexPath, 'utf8');
        html = html.replace(/{{SEO_TITLE}}/g, title);
        html = html.replace(/{{SEO_DESCRIPTION}}/g, description || '');
        html = html.replace(/{{SEO_KEYWORDS}}/g, keywords || '');

        res.send(html);
    } catch (err) {
        console.error('[DEBUG] Critical SEO Injection Error:', err);
        res.status(500).send('Internal Server Error');
    }
});

// Conditional Listen (Skip on Vercel)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

// Export for Vercel
module.exports = app;
