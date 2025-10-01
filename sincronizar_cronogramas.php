<?php
header('Content-Type: application/json');
require_once 'conn.php';

$response = ['success' => false, 'message' => 'Error desconocido.'];

// 1. Leer el cuerpo de la petición (que será un JSON)
$json_data = file_get_contents('php://input');
$data = json_decode($json_data, true);

if ($data && isset($data['calendario'])) {
    $calendario = $data['calendario'];

    // Iniciar una transacción para asegurar la integridad de los datos
    $conn->begin_transaction();

    try {
        // 2. Preparamos las sentencias una sola vez
        $delete_stmt = $conn->prepare("DELETE FROM cronogramas WHERE fecha_evento = ?");
        $insert_stmt = $conn->prepare("INSERT INTO cronogramas (fecha_evento, hora_inicio, hora_fin, titulo_programa) VALUES (?, ?, ?, ?)");

        foreach ($calendario as $fecha => $programas) {
            // 3. Borrar todos los cronogramas existentes para esta fecha
            $delete_stmt->bind_param("s", $fecha);
            $delete_stmt->execute();

            // 4. Insertar los nuevos cronogramas
            foreach ($programas as $programa) {
                // Extraer hora de inicio y fin
                list($inicio, $fin) = explode(' - ', $programa['hora']);
                $nombre = $programa['nombre'];

                $insert_stmt->bind_param("ssss", $fecha, $inicio, $fin, $nombre);
                $insert_stmt->execute();
            }
        }

        // 5. Si todo fue bien, confirmar los cambios
        $conn->commit();
        $response = ['success' => true, 'message' => '¡Cronogramas guardados con éxito!'];

    } catch (mysqli_sql_exception $exception) {
        // Si algo falla, revertir todos los cambios
        $conn->rollback();
        $response = ['success' => false, 'message' => 'Error en la base de datos: ' . $exception->getMessage()];
    }
} else {
    $response = ['success' => false, 'message' => 'No se recibieron datos válidos.'];
}

echo json_encode($response);
?>