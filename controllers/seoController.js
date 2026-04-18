const PageSEO = require('../models/PageSEO');

// Get all SEO configurations
exports.getAllSEO = async (req, res) => {
    try {
        const seoData = await PageSEO.find();
        res.status(200).json({ success: true, data: seoData });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update or Create SEO configuration for a section
exports.updateSectionSEO = async (req, res) => {
    try {
        const { section, title, metaDescription, metaKeywords, h1OrH2, seoText } = req.body;

        const seo = await PageSEO.findOneAndUpdate(
            { section },
            { title, metaDescription, metaKeywords, h1OrH2, seoText },
            { new: true, upsert: true }
        );

        res.status(200).json({ success: true, data: seo });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Initialize default SEO (Run once or through admin)
exports.initializeDefaultSEO = async (req, res) => {
    try {
        const defaults = [
            { section: 'home', title: "Kings Pet Hospital | Best Veterinary Care", metaDescription: "Leading pet hospital providing 24/7 care.", metaKeywords: "Pet Hospital, Veterinary, Pet Care" },
            { section: 'services', title: "Expert Pet Services | Kings Pet Hospital", metaDescription: "Professional grooming, surgery, and diagnostics.", metaKeywords: "Pet Surgery, Grooming, Diagnostics" },
            { section: 'gallery', title: "Our Gallery | Kings Pet Hospital", metaDescription: "View our happy patients and advanced facilities.", metaKeywords: "Pet Gallery, Hospital Photos" },
            { section: 'about', title: "About Us | Kings Pet Hospital", metaDescription: "Our history and commitment to pet care.", metaKeywords: "About Kings Pet, Hospital History" },
            { section: 'team', title: "Our Expert Medical Team", metaDescription: "Meet our qualified veterinarians.", metaKeywords: "Veterinarians, Pet Doctors" },
            { section: 'blog', title: "Pet Health Journal", metaDescription: "Latest pet care tips and news.", metaKeywords: "Pet Blog, Health Tips" },
            { section: 'booking', title: "Book an Appointment", metaDescription: "Schedule your visit today.", metaKeywords: "Book Vet, Appointment" },
            { section: 'contact', title: "Contact Us | Kings Pet Hospital", metaDescription: "Get in touch with our expert team.", metaKeywords: "Contact Vet, Hospital Location" },
            { section: 'pets-care', title: "Pet Care Tips | Wellness Guide", metaDescription: "Learn how to care for your pets properly.", metaKeywords: "Wellness Guide, Pet Wellness" },
            { section: 'privacy', title: "Privacy Policy | Kings Pet Hospital", metaDescription: "How we protect your data.", metaKeywords: "Privacy" },
            { section: 'terms', title: "Terms of Service", metaDescription: "Our terms and conditions.", metaKeywords: "Terms" }
        ];

        for (const item of defaults) {
            await PageSEO.findOneAndUpdate({ section: item.section }, item, { upsert: true });
        }

        res.status(200).json({ success: true, message: "Default SEO initialized" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
