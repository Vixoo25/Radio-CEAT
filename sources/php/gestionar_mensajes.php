<?php
session_start();
header('Content-Type: application/json');

$response = ['success' => false, 'message' => 'Acción no válida.'];

// --- Verificación de permisos ---
if (!isset($_SESSION['user_logged_in']) || ($_SESSION['user_role'] !== 'cronograma' && $_SESSION['user_role'] !== 'admin_total')) {
    $response['message'] = 'Acceso denegado. No tienes permisos.';
    echo json_encode($response);
    exit;
}

require_once 'conn.php';

$data = json_decode(file_get_contents('php://input'), true);

if (isset($data['action']) && $data['action'] === 'delete' && isset($data['id'])) {
    $id = $data['id'];
    $stmt = $conn->prepare("DELETE FROM mensajes_oyentes WHERE id = ?");
    if ($stmt) {
        $stmt->bind_param("i", $id);
        if ($stmt->execute()) {
            $response = ['success' => true, 'message' => 'Mensaje marcado como leído.'];
        } else {
            $response['message'] = 'Error al eliminar el mensaje de la base de datos.';
        }
        $stmt->close();
    }
}

echo json_encode($response);
$conn->close();
?>