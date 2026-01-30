// js/side-panel.js
document.addEventListener('DOMContentLoaded', function() {
    // Funkce pro otevření/zavření bočního panelu
    window.toggleSidePanel = function() {
        const panel = document.getElementById('sidePanel');
        if (panel) {
            panel.classList.toggle('active');
        }
    };

    window.closeSidePanel = function() {
        const panel = document.getElementById('sidePanel');
        if (panel) {
            panel.classList.remove('active');
        }
    };

    // Zavření panelu kliknutím mimo
    document.addEventListener('click', function(e) {
        const panel = document.getElementById('sidePanel');
        const toggleBtn = document.querySelector('.side-panel-toggle');
        
        if (panel && toggleBtn && 
            !panel.contains(e.target) && 
            !toggleBtn.contains(e.target) && 
            panel.classList.contains('active')) {
            panel.classList.remove('active');
        }
    });

    // ESC pro zavření
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeSidePanel();
        }
    });
    
    console.log('Boční panel s logy energetických společností inicializován');
});