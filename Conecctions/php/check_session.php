<?php
session_start();

// --- Tarea de Limpieza Optimizada ---
// Se ejecuta solo una vez al día para no sobrecargar el servidor.
$hoy = date('Y-m-d');
if (!isset($_SESSION['last_cleanup']) || $_SESSION['last_cleanup'] != $hoy) {
    // Incluimos y ejecutamos el script de limpieza.
    require_once 'limpiar_cronogramas_antiguos.php';
    // Guardamos la fecha de la última limpieza en la sesión.
    $_SESSION['last_cleanup'] = $hoy;
}

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