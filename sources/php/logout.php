<?php
// Inicia la sesión para poder acceder a ella.
session_start();

// 1. Elimina todas las variables de sesión.
$_SESSION = array();

// 2. Destruye la sesión.
session_destroy();

// 3. Devuelve una respuesta JSON para que JavaScript sepa que todo fue bien.
header('Content-Type: application/json');
echo json_encode(['success' => true, 'message' => 'Sesión cerrada correctamente.']);
exit;
?>