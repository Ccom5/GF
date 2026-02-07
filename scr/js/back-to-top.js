(() => {
    const existingButton = document.querySelector('.back-to-top');
    if (!existingButton) {
        return;
    }

    const button = existingButton;

    const toggleVisibility = () => {
        if (window.scrollY > 400) {
            button.classList.add('visible');
        } else {
            button.classList.remove('visible');
        }
    };

    button.addEventListener('click', (event) => {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    window.addEventListener('scroll', toggleVisibility, { passive: true });
    toggleVisibility();
})();
