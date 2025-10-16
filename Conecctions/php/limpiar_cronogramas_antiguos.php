<?php
if (empty($conn)) {
    require_once 'conn.php'; // Reutilizamos la conexión a la base de datos solo si no existe
}

// Preparamos la consulta SQL para eliminar los registros.
// CURDATE() obtiene la fecha actual.
// INTERVAL 7 DAY define el período de una semana.
// La consulta borrará todos los cronogramas donde 'fecha_evento' sea más antigua que "hoy - 7 días".
$stmt = $conn->prepare("DELETE FROM cronogramas WHERE fecha_evento < CURDATE() - INTERVAL 7 DAY");

if ($stmt) {
    $stmt->execute();
    // Opcional: Puedes registrar cuántos registros se eliminaron.
    $filas_afectadas = $stmt->affected_rows;
    // echo "Limpieza completada. Se eliminaron " . $filas_afectadas . " cronogramas antiguos.";
    $stmt->close();
} else {
    // Opcional: Registrar el error si algo sale mal.
    error_log("Error al preparar la consulta de limpieza: " . $conn->error);
}
?>