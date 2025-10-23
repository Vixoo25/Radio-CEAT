export function initUI() {
    adjustTopPadding();
    window.addEventListener('resize', adjustTopPadding);
    initScrollAnimation();

    // Cierre genérico de modales
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeModal(modal);
            }
        });
        const closeButton = modal.querySelector('.close-button');
        if (closeButton) {
            closeButton.addEventListener('click', () => closeModal(modal));
        }
    });
}

function adjustTopPadding() {
    const topBar = document.querySelector(".top-bar");
    const mainPage = document.querySelector(".pgina-principal");
    const topBarHeight = topBar.offsetHeight;
    mainPage.style.setProperty('--top-bar-height', `${topBarHeight + 30}px`);
}

export function openModal(modalElement) {
    modalElement.style.display = "flex";
    modalElement.querySelector('.modal-content').style.animation = "animatetop 0.4s";
}

export function closeModal(modalElement) {
    const modalContent = modalElement.querySelector('.modal-content');
    modalContent.style.animation = "animatebottom 0.4s";
    setTimeout(() => {
        modalElement.style.display = "none";
    }, 400);
}

function initScrollAnimation() {
    const sectionsToAnimate = document.querySelectorAll('.fade-in-section');
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    sectionsToAnimate.forEach(section => observer.observe(section));
}
