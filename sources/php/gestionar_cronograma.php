<?php
header('Content-Type: application/json');
require_once 'conn.php';

$response = ['success' => false, 'message' => 'Petición no válida.'];
$method = $_SERVER['REQUEST_METHOD'];

// --- Lógica para ACTUALIZAR o CREAR un cronograma (cuando se usa POST) ---
if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    // Si viene un ID, es una ACTUALIZACIÓN
    if (isset($data['id']) && !empty($data['id']) && !str_starts_with($data['id'], 'temp-')) {
        if (isset($data['nombre'], $data['inicio'], $data['fin'])) {
            $id = $data['id'];
            $nombre = $data['nombre'];
            $inicio = $data['inicio'];
            $fin = $data['fin'];
            $descripcion = isset($data['descripcion']) ? $data['descripcion'] : ''; // Campo opcional

            // Usamos sentencias preparadas para MÁXIMA seguridad
            $stmt = $conn->prepare("UPDATE cronogramas SET titulo_programa = ?, hora_inicio = ?, hora_fin = ?, descripcion = ? WHERE id_cronograma = ?");
            if ($stmt) {
                $stmt->bind_param("ssssi", $nombre, $inicio, $fin, $descripcion, $id);
                if ($stmt->execute()) {
                    $response['success'] = true;
                    $response['message'] = "Cronograma actualizado con éxito.";
                } else {
                    $response['message'] = "Error al ejecutar la actualización: " . $stmt->error;
                }
                $stmt->close();
            } else {
                $response['message'] = "Error al preparar la consulta de actualización: " . $conn->error;
            }
        } else {
            $response['message'] = 'Datos incompletos para actualizar.';
        }
    }
    // No se maneja la creación aquí porque se hace en sincronizar_cronogramas.php
    
}

// --- Lógica para ELIMINAR un cronograma (cuando se usa DELETE) ---
if ($method === 'DELETE') {
    $data = json_decode(file_get_contents('php://input'), true);

    if (isset($data['id'])) {
        $id = $data['id'];

        // Solo intentamos borrar si no es un ID temporal
        if (!str_starts_with($id, 'temp-')) {
            $stmt = $conn->prepare("DELETE FROM cronogramas WHERE id_cronograma = ?");
            if ($stmt) {
                $stmt->bind_param("i", $id);
                if ($stmt->execute()) {
                    $response = ['success' => true, 'message' => 'Cronograma eliminado con éxito.'];
                } else {
                    $response['message'] = 'Error al eliminar de la base de datos: ' . $stmt->error;
                }
                $stmt->close();
            } else {
                $response['message'] = 'Error al preparar la consulta de eliminación: ' . $conn->error;
            }
        } else {
            // Si es un ID temporal, la acción se manejó en el cliente, así que devolvemos éxito.
            $response = ['success' => true, 'message' => 'Cronograma temporal eliminado del cliente.'];
        }
    } else {
        $response['message'] = 'ID de cronograma no proporcionado.';
    }
}

$conn->close();
echo json_encode($response);
?>
