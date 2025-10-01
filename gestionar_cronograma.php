<?php
header('Content-Type: application/json');
require_once 'conn.php';

$response = ['success' => false, 'message' => 'Petición no válida.'];
$method = $_SERVER['REQUEST_METHOD'];

// --- Lógica para ACTUALIZAR un cronograma (cuando se usa POST) ---
if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    if (isset($data['id'], $data['nombre'], $data['inicio'], $data['fin'])) {
        $id = $data['id'];
        $nombre = $data['nombre'];
        $inicio = $data['inicio'];
        $fin = $data['fin'];

        $stmt = $conn->prepare("UPDATE cronogramas SET titulo_programa = ?, hora_inicio = ?, hora_fin = ? WHERE id_cronograma = ?");
        $stmt->bind_param("sssi", $nombre, $inicio, $fin, $id);

        if ($stmt->execute()) {
            $response = ['success' => true, 'message' => 'Cronograma actualizado con éxito.'];
        } else {
            $response['message'] = 'Error al actualizar en la base de datos.';
        }
        $stmt->close();
    } else {
        $response['message'] = 'Datos incompletos para actualizar.';
    }
}

// --- Lógica para ELIMINAR un cronograma (cuando se usa DELETE) ---
if ($method === 'DELETE') {
    // Para DELETE, los parámetros suelen venir en la URL o en el cuerpo. Lo leeremos del cuerpo.
    $data = json_decode(file_get_contents('php://input'), true);

    if (isset($data['id'])) {
        $id = $data['id'];

        $stmt = $conn->prepare("DELETE FROM cronogramas WHERE id_cronograma = ?");
        $stmt->bind_param("i", $id);

        if ($stmt->execute()) {
            $response = ['success' => true, 'message' => 'Cronograma eliminado con éxito.'];
        } else {
            $response['message'] = 'Error al eliminar de la base de datos.';
        }
        $stmt->close();
    } else {
        $response['message'] = 'ID de cronograma no proporcionado.';
    }
}

$conn->close();
echo json_encode($response);
?>