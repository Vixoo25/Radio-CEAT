<?php
header('Content-Type: application/json');
require_once 'conn.php';

$response = ['success' => false, 'message' => 'Petición no válida.'];

// 1. Leer los datos JSON enviados desde JavaScript
$data = json_decode(file_get_contents('php://input'), true);

if ($data && isset($data['gmail'], $data['nombre'], $data['mensaje'])) {
    $gmail = trim($data['gmail']);
    $nombre = trim($data['nombre']);
    $mensaje = trim($data['mensaje']);

    // 2. Validaciones básicas
    if (!filter_var($gmail, FILTER_VALIDATE_EMAIL)) {
        $response['message'] = 'Por favor, introduce un correo electrónico válido.';
    } elseif (empty($nombre)) {
        $response['message'] = 'El nombre no puede estar vacío.';
    } elseif (empty($mensaje)) {
        $response['message'] = 'El mensaje no puede estar vacío.';
    } else {
        // 3. Preparar la consulta para insertar el mensaje
        $stmt = $conn->prepare("INSERT INTO mensajes_oyentes (gmail, nombre, mensaje) VALUES (?, ?, ?)");
        if ($stmt) {
            $stmt->bind_param("sss", $gmail, $nombre, $mensaje);
            if ($stmt->execute()) {
                $response = ['success' => true, 'message' => '¡Gracias! Tu mensaje ha sido enviado.'];
            } else {
                $response['message'] = 'Hubo un error al guardar tu mensaje. Inténtalo de nuevo.';
            }
            $stmt->close();
        } else {
            $response['message'] = 'Error en la preparación de la consulta.';
        }
    }
}

$conn->close();
echo json_encode($response);
?>