(() => {
    const button = document.querySelector('.back-to-top');
    if (!button) {
        return;
    }

    const scrollRoot = document.scrollingElement || document.documentElement;

    const isScrollable = (element) => {
        const styles = window.getComputedStyle(element);
        const overflowY = styles.overflowY;
        return (
            (overflowY === 'auto' || overflowY === 'scroll') &&
            element.scrollHeight - element.clientHeight > 50
        );
    };

    const pickScrollContainer = () => {
        const candidates = [
            document.querySelector('main'),
            document.querySelector('.content-card'),
            document.querySelector('.blog-post'),
            document.querySelector('.article-content')
        ].filter(Boolean);

        for (const candidate of candidates) {
            if (isScrollable(candidate)) {
                return candidate;
            }
        }

        return scrollRoot;
    };

    const scrollContainer = pickScrollContainer();
    const usesWindow = scrollContainer === document.documentElement || scrollContainer === document.body;

    const getScrollTop = () =>
        usesWindow ? (scrollRoot.scrollTop || 0) : scrollContainer.scrollTop;

    const getMaxScroll = () =>
        scrollContainer.scrollHeight - scrollContainer.clientHeight;

    const toggleVisibility = () => {
        const scrollTop = getScrollTop();
        const maxScroll = getMaxScroll();

        if (maxScroll <= 200) {
            button.classList.remove('visible');
            return;
        }

        if (scrollTop > 200) {
            button.classList.add('visible');
        } else {
            button.classList.remove('visible');
        }
    };

    button.addEventListener('click', (event) => {
        event.preventDefault();
        if (usesWindow) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });

    const target = usesWindow ? window : scrollContainer;
    target.addEventListener('scroll', toggleVisibility, { passive: true });
    window.addEventListener('resize', toggleVisibility);
    window.addEventListener('load', toggleVisibility);
    toggleVisibility();
})();
