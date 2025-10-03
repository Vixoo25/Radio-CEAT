<?php
header('Content-Type: application/json');
require_once 'conn.php'; // Reutilizamos la conexión a la BD

$response = ['success' => false, 'message' => 'Acción no válida.'];

// --- Configuración de directorios ---
$noticiasServerDir = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'noticias' . DIRECTORY_SEPARATOR;
$noticiasWebDir = 'Conecctions/noticias/';

// Asegurarse de que el directorio de noticias exista y tenga permisos
if (!is_dir($noticiasServerDir)) {
    mkdir($noticiasServerDir, 0777, true);
}

// --- Determinar la acción ---
$action = $_POST['action'] ?? $_GET['action'] ?? 'save';

switch ($action) {
    case 'get':
        $id = isset($_GET['id']) ? intval($_GET['id']) : null;
        if ($id) {
            // Obtener una sola noticia por ID
            $stmt = $conn->prepare("SELECT id, titulo, fecha, url, imagen FROM noticias WHERE id = ?");
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $result = $stmt->get_result()->fetch_assoc();
            if ($result) {
                $result['imagen_url'] = $noticiasWebDir . $result['imagen'];
            }
            echo json_encode($result);
        } else {
            // Obtener todas las noticias, ordenadas por fecha descendente
            $result = $conn->query("SELECT id, titulo, fecha, url, imagen FROM noticias ORDER BY fecha DESC");
            $noticias = [];
            while ($row = $result->fetch_assoc()) {
                $row['imagen_url'] = $noticiasWebDir . $row['imagen'];
                $noticias[] = $row;
            }
            echo json_encode($noticias);
        }
        exit;

    case 'save': // Esta acción maneja tanto la creación como la actualización
        $id = isset($_POST['id']) ? intval($_POST['id']) : null;
        $titulo = $_POST['titulo'] ?? '';
        $fecha = $_POST['fecha'] ?? '';
        $url = $_POST['url'] ?? '';
        $imagen_nombre = null;

        // --- Manejo de la subida de imagen ---
        if (isset($_FILES['imagen']) && $_FILES['imagen']['error'] === UPLOAD_ERR_OK) {
            $file = $_FILES['imagen'];
            // Generar un nombre de archivo único para evitar sobreescrituras
            $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
            $imagen_nombre = 'noticia_' . time() . '.' . $extension;
            $destination = $noticiasServerDir . $imagen_nombre;

            if (!move_uploaded_file($file['tmp_name'], $destination)) {
                $response['message'] = 'Error al mover la imagen subida.';
                echo json_encode($response);
                exit;
            }

            // Si estamos actualizando y se sube una nueva imagen, borrar la antigua
            if ($id) {
                $stmt = $conn->prepare("SELECT imagen FROM noticias WHERE id = ?");
                $stmt->bind_param("i", $id);
                $stmt->execute();
                $old_image = $stmt->get_result()->fetch_assoc()['imagen'];
                if ($old_image && file_exists($noticiasServerDir . $old_image)) {
                    unlink($noticiasServerDir . $old_image);
                }
            }
        }

        // --- Interacción con la Base de Datos ---
        if ($id) { // Actualizar noticia existente
            if ($imagen_nombre) { // Si se subió una nueva imagen
                $stmt = $conn->prepare("UPDATE noticias SET titulo = ?, fecha = ?, url = ?, imagen = ? WHERE id = ?");
                $stmt->bind_param("ssssi", $titulo, $fecha, $url, $imagen_nombre, $id);
            } else { // Si no se subió imagen, no se actualiza ese campo
                $stmt = $conn->prepare("UPDATE noticias SET titulo = ?, fecha = ?, url = ? WHERE id = ?");
                $stmt->bind_param("sssi", $titulo, $fecha, $url, $id);
            }
            $success = $stmt->execute();
            $response['message'] = $success ? 'Noticia actualizada con éxito.' : 'Error al actualizar la noticia.';

        } else { // Crear nueva noticia
            if (!$imagen_nombre) {
                $response['message'] = 'La imagen es obligatoria para una nueva noticia.';
                echo json_encode($response);
                exit;
            }
            $stmt = $conn->prepare("INSERT INTO noticias (titulo, fecha, url, imagen) VALUES (?, ?, ?, ?)");
            $stmt->bind_param("ssss", $titulo, $fecha, $url, $imagen_nombre);
            $success = $stmt->execute();
            $response['message'] = $success ? 'Noticia guardada con éxito.' : 'Error al guardar la noticia.';
        }

        $response['success'] = $success;
        break;

    case 'delete':
        $id = isset($_POST['id']) ? intval($_POST['id']) : null;
        if ($id) {
            // Primero, obtener el nombre de la imagen para poder borrar el archivo
            $stmt_select = $conn->prepare("SELECT imagen FROM noticias WHERE id = ?");
            $stmt_select->bind_param("i", $id);
            $stmt_select->execute();
            $imagen_a_borrar = $stmt_select->get_result()->fetch_assoc()['imagen'];

            // Segundo, borrar el registro de la base de datos
            $stmt_delete = $conn->prepare("DELETE FROM noticias WHERE id = ?");
            $stmt_delete->bind_param("i", $id);
            if ($stmt_delete->execute()) {
                // Si se borró de la BD, borrar el archivo de imagen del servidor
                if ($imagen_a_borrar && file_exists($noticiasServerDir . $imagen_a_borrar)) {
                    unlink($noticiasServerDir . $imagen_a_borrar);
                }
                $response = ['success' => true, 'message' => 'Noticia eliminada con éxito.'];
            } else {
                $response['message'] = 'Error al eliminar la noticia de la base de datos.';
            }
        } else {
            $response['message'] = 'No se proporcionó un ID para eliminar.';
        }
        break;
}

echo json_encode($response);
?>
