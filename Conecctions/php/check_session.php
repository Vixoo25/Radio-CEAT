<?php
session_start();
header('Content-Type: application/json');

if (isset($_SESSION['user_logged_in']) && $_SESSION['user_logged_in'] === true) {
    // Si el usuario está logueado, devolvemos su rol
    echo json_encode([
        'success' => true,
        'role' => $_SESSION['user_role']
    ]);
} else {
    // Si no, devolvemos que no hay sesión activa
    echo json_encode(['success' => false]);
}
?>