<?php
session_start();
header('Content-Type: application/json');

// --- Verificación de permisos ---
// Solo usuarios con rol 'cronograma' o 'admin_total' pueden ver los mensajes.
if (!isset($_SESSION['user_logged_in']) || ($_SESSION['user_role'] !== 'cronograma' && $_SESSION['user_role'] !== 'admin_total')) {
    echo json_encode([]); // Devuelve un array vacío si no hay permisos
    exit;
}

require_once 'conn.php';

$mensajes = [];
$sql = "SELECT id, gmail, nombre, mensaje, fecha_envio FROM mensajes_oyentes ORDER BY fecha_envio DESC";
$result = $conn->query($sql);

if ($result) {
    while ($row = $result->fetch_assoc()) {
        $mensajes[] = $row;
    }
}

echo json_encode($mensajes);
$conn->close();
?>