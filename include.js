// include.js – Načítání header/footer/chatbot – Dokumentováno. Optimalizováno pro asynchronní načítání.
// Speciální chování pro WCAG stránku: Nenačítat chatbot a skrýt WCAG odkaz v headeru.

document.addEventListener("DOMContentLoaded", () => {
    const isWcagPage = document.body.classList.contains('wcag-page');

    // Načtení headeru (vždy)
    fetch("header.html?t=" + Date.now())
        .then(r => r.text())
        .then(html => {
            document.body.insertAdjacentHTML("afterbegin", html);
            initMobileMenu(); // Inicializace mobilního menu
            initNewsletterModal(); // Inicializace newsletter modálu

            // Pokud je WCAG stránka, odstranit WCAG odkaz z headeru (pro desktop i mobil)
            if (isWcagPage) {
                document.querySelectorAll('.wcag-accessibility-link').forEach(link => {
                    link.remove(); // Odstraní prvek úplně
                });
            }
        })
        .catch(err => console.error("Chyba při načítání headeru:", err));

    // Footer + chatbot (pouze pokud NENÍ WCAG stránka)
    if (!isWcagPage) {
        Promise.all([
            fetch("footer.html?t=" + Date.now()).then(r => r.text()),
            fetch("chatbot.html?t=" + Date.now()).then(r => r.text())
        ]).then(([footer, chatbot]) => {
            document.body.insertAdjacentHTML("beforeend", footer + chatbot.replace(/<script[\s\S]*?<\/script>/gi, ''));
            // Extrahování a spuštění JS z chatbot ručně
            const scriptMatch = chatbot.match(/<script>([\s\S]*?)<\/script>/i);
            if (scriptMatch && scriptMatch[1]) {
                const scriptElem = document.createElement('script');
                scriptElem.textContent = scriptMatch[1];
                document.body.appendChild(scriptElem);
            }
        }).catch(err => console.error("Chyba při načítání footeru nebo chatbota:", err));
    } else {
        // Pouze footer pro WCAG stránku (bez chatbota)
        fetch("footer.html?t=" + Date.now())
            .then(r => r.text())
            .then(footer => {
                document.body.insertAdjacentHTML("beforeend", footer);
            })
            .catch(err => console.error("Chyba při načítání footeru:", err));
    }
});

// Funkce pro mobilní menu – Dokumentováno: Otevírání/zavírání menu, ARIA atributy pro přístupnost.
function initMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const mobileNav = document.querySelector('.mobile-nav');
    const overlay = document.querySelector('.nav-overlay');

    if (!hamburger || !mobileNav) return;

    function openMenu() {
        hamburger.classList.add('active');
        mobileNav.classList.add('active');
        if (overlay) overlay.classList.add('active');
        document.body.classList.add('menu-open');
        hamburger.setAttribute('aria-expanded', 'true');
        mobileNav.setAttribute('aria-hidden', 'false');
    }

    function closeMenu() {
        hamburger.classList.remove('active');
        mobileNav.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        document.body.classList.remove('menu-open');
        hamburger.setAttribute('aria-expanded', 'false');
        mobileNav.setAttribute('aria-hidden', 'true');
    }

    function toggleMenu() {
        if (mobileNav.classList.contains('active')) closeMenu();
        else openMenu();
    }

    hamburger.addEventListener('click', toggleMenu);
    if (overlay) overlay.addEventListener('click', closeMenu);

    mobileNav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 992) closeMenu();
        });
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 992) closeMenu();
    });
}

// Nová funkce – inicializace newsletter modálu
function initNewsletterModal() {
    window.openNewsletterModal = function() {
        const modal = document.getElementById('newsletterModal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.classList.add('modal-open');
        }
    };

    window.closeNewsletterModal = function() {
        const modal = document.getElementById('newsletterModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.classList.remove('modal-open');
        }
    };

    window.submitNewsletter = function(e) {
        e.preventDefault();
        const email = e.target.querySelector('input[type=email]').value;
        alert(`Děkujeme! Newsletter byl úspěšně přihlášen na: ${email}`);
        closeNewsletterModal();
        e.target.reset();
    };

    // Zavření klikem mimo modal
    window.addEventListener('click', function(e) {
        const modal = document.getElementById('newsletterModal');
        if (e.target === modal) {
            closeNewsletterModal();
        }
    });
}
