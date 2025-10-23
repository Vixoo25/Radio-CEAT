import { openModal, closeModal } from './ui.js';
import { login, checkSession, logout } from './api.js';
import { initializeEditor, initializeEditorNoticias } from './admin.js';

export function initAuth() {
    // --- Selectores ---
    const openLoginModalBtn = document.getElementById("open-login-modal");
    const openLoginNoticiasModalBtn = document.getElementById("open-login-noticias-modal");
    const logoutCronogramaBtn = document.getElementById("logout-cronograma-button");
    const logoutNoticiasBtn = document.getElementById("logout-noticias-button");

    // --- Event Listeners ---
    openLoginModalBtn.addEventListener("click", () => handleLoginTrigger('cronograma', openEditorModal));
    openLoginNoticiasModalBtn.addEventListener("click", () => handleLoginTrigger('noticias', openEditorNoticiasModal));

    logoutCronogramaBtn.addEventListener("click", handleLogout);
    logoutNoticiasBtn.addEventListener("click", handleLogout);

    setupLoginForm("login-form", "modal-login", "login-message", 'cronograma', openEditorModal);
    setupLoginForm("login-form-noticias", "modal-login-noticias", "login-message-noticias", 'noticias', openEditorNoticiasModal);
}

async function handleLoginTrigger(type, openEditorCallback) {
    const session = await checkSession();
    const requiredRoles = type === 'cronograma' ? ['cronograma', 'admin_total'] : ['noticias', 'admin_total'];

    if (session.success && requiredRoles.includes(session.role)) {
        openEditorCallback();
    } else {
        const modalId = type === 'cronograma' ? 'modal-login' : 'modal-login-noticias';
        openModal(document.getElementById(modalId));
    }
}

function setupLoginForm(formId, modalId, messageId, roleType, openEditorCallback) {
    const form = document.getElementById(formId);
    const modal = document.getElementById(modalId);
    const messageEl = document.getElementById(messageId);
    const usernameInput = form.querySelector('input[type="text"]');
    const passwordInput = form.querySelector('input[type="password"]');

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const username = usernameInput.value;
        const password = passwordInput.value;
        const requiredRoles = roleType === 'cronograma' ? ['cronograma', 'admin_total'] : ['noticias', 'admin_total'];

        const result = await login(username, password);

        messageEl.textContent = result.message;
        if (result.success && requiredRoles.includes(result.role)) {
            messageEl.className = "success-message";
            setTimeout(() => {
                closeModal(modal);
                form.reset();
                messageEl.textContent = "";
                openEditorCallback();
            }, 1000);
        } else {
            messageEl.className = "error-message";
            passwordInput.value = "";
        }
    });

    modal.querySelector('.close-button').addEventListener('click', () => {
        closeModal(modal);
        form.reset();
        messageEl.textContent = "";
    });
}

function openEditorModal() {
    openModal(document.getElementById('modal-editor'));
    initializeEditor();
}

function openEditorNoticiasModal() {
    openModal(document.getElementById('modal-editor-noticias'));
    initializeEditorNoticias();
}

export async function handleLogout() {
    if (confirm("¿Estás seguro de que quieres cerrar la sesión?")) {
        await logout();
        alert("Sesión cerrada.");
        window.location.reload();
    }
}
