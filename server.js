const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const PageSEO = require('./models/PageSEO');
const Blog = require('./models/Blog');
const Slot = require('./models/Slot');

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

        try {
            await Slot.collection.dropIndex('startAt_1');
            console.log('Dropped stale Slot index: startAt_1');
        } catch (indexError) {
            if (!String(indexError?.message || '').includes('index not found')) {
                console.warn('Slot index cleanup warning:', indexError.message);
            }
        }
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
app.use('/api/catalog', require('./routes/catalogRoutes'));
app.use('/api/category', require('./routes/categoryRoutes'));
app.use('/api/subcategory', require('./routes/subcategoryRoutes'));
app.use('/api/service', require('./routes/serviceRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/doctors', require('./routes/doctorRoutes'));
app.use('/api/slots', require('./routes/slotRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/petfoods', require('./routes/petFoodRoutes'));
app.use('/api/petlistings', require('./routes/petListingRoutes'));
app.use('/api/petorders', require('./routes/petOrderRoutes'));

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

        let section = firstPart || 'home';
        let blogId = (firstPart === 'blog') ? pathParts[1] : null;
        let serviceSlug = (firstPart === 'services') ? pathParts[1] : null;

        section = section.toLowerCase().trim();
        console.log(`[SEO UNIVERSAL] URL: ${url} | Section Key: ${section}`);

        // Default Fallbacks
        let title = 'Kings Pet Hospital | Trusted Pet Care';
        let description = 'Professional pet care services, expert veterinarians, and modern medical facilities.';
        let keywords = 'Kings Pet Hospital, Veterinary, Pet Care, Veterinarian near me';

        // 2. Fetch Data from DB
        try {
            if (firstPart === 'blog' && blogId) {
                const blogData = await Blog.findById(blogId);
                if (blogData) {
                    title = blogData.metaTitle || blogData.title || title;
                    description = blogData.metaDescription || blogData.description || description;
                    keywords = blogData.metaKeywords || blogData.keywords || keywords;
                }
            } else if (firstPart === 'services' && serviceSlug) {
                const Service = require('./models/Service');
                const serviceData = await Service.findOne({ slug: serviceSlug });
                if (serviceData) {
                    title = `${serviceData.name} | Kings Pet Hospital`;
                    description = serviceData.description ? serviceData.description.substring(0, 160) : description;
                }
            } 

            // Always try to find a matching PageSEO section even if we found a blog/service 
            // This allows specific sections to override defaults
            // Fuzzy match: handles 'pets-care' vs 'Pets Care'
            const seoData = await PageSEO.findOne({ 
                $or: [
                    { section: { $regex: new RegExp('^' + section + '$', 'i') } },
                    { section: { $regex: new RegExp('^' + section.replace(/-/g, ' ') + '$', 'i') } }
                ]
            });
            
            if (seoData) {
                title = seoData.title || title;
                description = seoData.metaDescription || seoData.description || description;
                keywords = seoData.metaKeywords || seoData.seoText || keywords;
            }
        } catch (dbError) {
            console.error('[SEO UNIVERSAL] DB Error:', dbError.message);
        }

        // 3. Inject into HTML
        const indexPath = path.join(frontendPath, 'index.html');
        if (!fs.existsSync(indexPath)) {
            return res.status(404).send('Site content not found. Please run "npm run build" in the frontend folder.');
        }

        let html = fs.readFileSync(indexPath, 'utf8');

        // Dynamic Canonical URL (Full URL for SEO)
        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        const host = req.get('host');
        const fullUrl = `${protocol}://${host}${url}`;

        // Global replacements for all placeholders found in your frontend index.html
        html = html.replace(/{{SEO_TITLE}}/g, title);
        html = html.replace(/{{SEO_DESCRIPTION}}/g, description || '');
        html = html.replace(/{{SEO_KEYWORDS}}/g, keywords || '');
        html = html.replace(/{{SEO_CANONICAL}}/g, fullUrl);

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
