// --- Global State ---
let currentBillingCycle = 'monthly'; // 'monthly' | 'yearly'

// --- Translation Engine ---
function changeLanguage(lang) {
    if (!window.i18nTranslations || !window.i18nTranslations[lang]) {
        lang = 'it';
    }
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;

    const dict = window.i18nTranslations[lang];

    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict && dict[key] !== undefined) {
            el.innerHTML = dict[key];
        }
    });

    const langSelect = document.getElementById('lang-select');
    if (langSelect && langSelect.value !== lang) {
        langSelect.value = lang;
    }

    updatePricingDisplay();

    if (window.lucide) {
        window.lucide.createIcons();
    }
}

// --- Pricing Toggle Engine ---
function setBillingCycle(cycle) {
    currentBillingCycle = cycle;
    const switchEl = document.getElementById('billing-toggle');
    const labelMonthly = document.getElementById('label-monthly');
    const labelYearly = document.getElementById('label-yearly');

    if (cycle === 'yearly') {
        if (switchEl) switchEl.classList.add('active');
        if (labelYearly) labelYearly.classList.add('active');
        if (labelMonthly) labelMonthly.classList.remove('active');
    } else {
        if (switchEl) switchEl.classList.remove('active');
        if (labelMonthly) labelMonthly.classList.add('active');
        if (labelYearly) labelYearly.classList.remove('active');
    }

    updatePricingDisplay();
}

function updatePricingDisplay() {
    const lang = localStorage.getItem('lang') || 'it';
    const dict = (window.i18nTranslations && window.i18nTranslations[lang]) || {};

    const isYearly = currentBillingCycle === 'yearly';

    // Starter
    const starterPriceEl = document.getElementById('price-starter');
    const starterPeriodEl = document.getElementById('period-starter');
    const starterYearlyNoteEl = document.getElementById('note-starter');
    if (starterPriceEl) starterPriceEl.textContent = isYearly ? (dict['pricing.starterPriceYearly'] || '€32.50') : (dict['pricing.starterPriceMonthly'] || '€39');
    if (starterPeriodEl) starterPeriodEl.textContent = dict['pricing.perMonth'] || '/mese';
    if (starterYearlyNoteEl) {
        starterYearlyNoteEl.textContent = isYearly 
            ? (dict['pricing.perYear'] || 'o €{price}/anno').replace('{price}', dict['pricing.starterYearlyTotal'] || '390')
            : (dict['pricing.perYear'] || 'o €{price}/anno').replace('{price}', dict['pricing.starterYearlyTotal'] || '390');
    }

    // Business
    const businessPriceEl = document.getElementById('price-business');
    const businessPeriodEl = document.getElementById('period-business');
    const businessYearlyNoteEl = document.getElementById('note-business');
    if (businessPriceEl) businessPriceEl.textContent = isYearly ? (dict['pricing.businessPriceYearly'] || '€99') : (dict['pricing.businessPriceMonthly'] || '€119');
    if (businessPeriodEl) businessPeriodEl.textContent = dict['pricing.perMonth'] || '/mese';
    if (businessYearlyNoteEl) {
        businessYearlyNoteEl.textContent = isYearly
            ? (dict['pricing.perYear'] || 'o €{price}/anno').replace('{price}', dict['pricing.businessYearlyTotal'] || '1.188')
            : (dict['pricing.perYear'] || 'o €{price}/anno').replace('{price}', dict['pricing.businessYearlyTotal'] || '1.188');
    }

    // Growth
    const growthPriceEl = document.getElementById('price-growth');
    const growthPeriodEl = document.getElementById('period-growth');
    const growthYearlyNoteEl = document.getElementById('note-growth');
    if (growthPriceEl) growthPriceEl.textContent = isYearly ? (dict['pricing.growthPriceYearly'] || '€249') : (dict['pricing.growthPriceMonthly'] || '€299');
    if (growthPeriodEl) growthPeriodEl.textContent = dict['pricing.perMonth'] || '/mese';
    if (growthYearlyNoteEl) {
        growthYearlyNoteEl.textContent = isYearly
            ? (dict['pricing.perYear'] || 'o €{price}/anno').replace('{price}', dict['pricing.growthYearlyTotal'] || '2.988')
            : (dict['pricing.perYear'] || 'o €{price}/anno').replace('{price}', dict['pricing.growthYearlyTotal'] || '2.988');
    }
}

// --- DOM Initializer ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Language Init
    const savedLang = localStorage.getItem('lang') || 'it';
    changeLanguage(savedLang);

    const langSelect = document.getElementById('lang-select');
    if (langSelect) {
        langSelect.addEventListener('change', (e) => {
            changeLanguage(e.target.value);
        });
    }

    // 2. Billing Toggle Init
    const switchEl = document.getElementById('billing-toggle');
    if (switchEl) {
        switchEl.addEventListener('click', () => {
            setBillingCycle(currentBillingCycle === 'monthly' ? 'yearly' : 'monthly');
        });
    }

    const labelMonthly = document.getElementById('label-monthly');
    if (labelMonthly) {
        labelMonthly.addEventListener('click', () => setBillingCycle('monthly'));
    }

    const labelYearly = document.getElementById('label-yearly');
    if (labelYearly) {
        labelYearly.addEventListener('click', () => setBillingCycle('yearly'));
    }

    // 3. FAQ Accordion
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        if (question) {
            question.addEventListener('click', () => {
                const isActive = item.classList.contains('active');
                faqItems.forEach(other => other.classList.remove('active'));
                if (!isActive) {
                    item.classList.add('active');
                }
            });
        }
    });

    // 4. Lucide Icons
    if (window.lucide) {
        window.lucide.createIcons();
    }
});
