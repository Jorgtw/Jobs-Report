// Funzione globale per cambiare tab tramite i bottoni nella pagina
function switchTab(targetId) {
    if (targetId === 'registrazione') {
        window.location.href = 'https://app.jobs-report.app/#/richiesta-registrazione';
        return;
    }

    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');

    // Trova l'elemento nav corrispondente
    const targetNav = Array.from(navItems).find(item => item.getAttribute('data-target') === targetId);
    if (!targetNav) return;

    // Rimuovi classe active da tutto
    navItems.forEach(nav => nav.classList.remove('active'));
    sections.forEach(sec => sec.classList.remove('active'));

    // Aggiungi classe active al bersaglio
    targetNav.classList.add('active');
    document.getElementById(targetId).classList.add('active');
}

// --- Translation Logic ---
function changeLanguage(lang) {
    if (!window.i18nTranslations || !window.i18nTranslations[lang]) lang = 'it';
    localStorage.setItem('lang', lang);
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (window.i18nTranslations[lang] && window.i18nTranslations[lang][key]) {
            el.innerHTML = window.i18nTranslations[lang][key];
        }
    });
    const langSelect = document.getElementById('lang-select');
    if (langSelect && langSelect.value !== lang) {
        langSelect.value = lang;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // --- Dark Mode Toggle ---
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        body.classList.remove('light-mode');
        body.classList.add('dark-mode');
    }

    themeToggle.addEventListener('click', () => {
        if (body.classList.contains('light-mode')) {
            body.classList.replace('light-mode', 'dark-mode');
            localStorage.setItem('theme', 'dark');
        } else {
            body.classList.replace('dark-mode', 'light-mode');
            localStorage.setItem('theme', 'light');
        }
    });

    // --- Tab Switching Logic (Sidebar) ---
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetId = item.getAttribute('data-target');
            switchTab(targetId);
        });
    });

    // --- Initialize Language ---
    const savedLang = localStorage.getItem('lang') || 'it';
    changeLanguage(savedLang);

    const langSelect = document.getElementById('lang-select');
    if (langSelect) {
        langSelect.addEventListener('change', (e) => {
            changeLanguage(e.target.value);
        });
    }

    // --- Hijack Contattaci Form ---
    const contattoForm = document.querySelector('#contatto form');
    if (contattoForm) {
        contattoForm.onsubmit = function(e) {
            e.preventDefault();
            const name = document.getElementById('contact-name').value;
            const email = document.getElementById('contact-email').value;
            const msg = document.getElementById('contact-message').value;
            
            const subject = encodeURIComponent("Nuovo messaggio dal sito Jobs Report");
            const body = encodeURIComponent(
                "Nome: " + name + "\n" +
                "Email: " + email + "\n\n" +
                "Messaggio:\n" + msg
            );
            
            window.location.href = "mailto:jtw@live.it?subject=" + subject + "&body=" + body;
        };
    }
});
