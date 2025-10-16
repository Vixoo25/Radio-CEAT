<?php
session_start();
header('Content-Type: application/json');

$response = ['success' => false, 'message' => 'Acción no válida.'];

// Definimos dos tipos de rutas:
// 1. Ruta del servidor (absoluta) para que PHP pueda leer/escribir archivos.
$boletinServerDir = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'boletin' . DIRECTORY_SEPARATOR;
// 2. Ruta web (relativa) para que el navegador pueda encontrar el archivo.
$boletinWebDir = 'Conecctions/boletin/';

// Asegurarse de que el directorio exista
if (!is_dir($boletinServerDir)) {
    // Intentamos crear el directorio. Si falla, enviamos un error claro.
    if (!mkdir($boletinServerDir, 0777, true)) {
        $response['message'] = 'Error: No se pudo crear el directorio para el boletín. Verifique los permisos de la carpeta "Conecctions".';
        echo json_encode($response);
        exit;
    }
}

if (!is_writable($boletinServerDir)) {
    $response['message'] = 'Error: El directorio del boletín no tiene permisos de escritura. Verifique los permisos de la carpeta "Conecctions/boletin".';
    echo json_encode($response);
    exit;
}

$action = $_REQUEST['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

// --- Verificación de permisos para acciones de escritura ---
if ($method === 'POST') {
    if (!isset($_SESSION['user_logged_in']) || ($_SESSION['user_role'] !== 'noticias' && $_SESSION['user_role'] !== 'admin_total')) {
        echo json_encode(['success' => false, 'message' => 'Acceso denegado. No tienes permisos.']);
        exit;
    }
}

function get_current_boletin($dir) {
    $files = glob($dir . '*.pdf');
    if (count($files) > 0) {
        // Devuelve el primer PDF que encuentre
        return $files[0];
    }
    return null;
}

switch ($action) {
    case 'get':
        $currentFile = get_current_boletin($boletinServerDir);
        if ($currentFile) {
            $response = [
                'success' => true,
                'filename' => basename($currentFile),
                'filepath' => $boletinWebDir . basename($currentFile) . '?v=' . time() . '#toolbar=0' // Añadimos #toolbar=0 para ocultar la barra del visor PDF
            ];
        } else {
            $response = ['success' => false, 'message' => 'No se encontró ningún boletín.'];
        }
        break;

    case 'save':
        if (isset($_FILES['boletin_pdf'])) {
            $file = $_FILES['boletin_pdf'];

            // Validaciones básicas
            if ($file['error'] !== UPLOAD_ERR_OK) {
                $upload_errors = [
                    UPLOAD_ERR_INI_SIZE   => 'El archivo excede el tamaño máximo permitido por el servidor.',
                    UPLOAD_ERR_FORM_SIZE  => 'El archivo excede el tamaño máximo permitido en el formulario.',
                    UPLOAD_ERR_NO_FILE    => 'No se subió ningún archivo.',
                ];
                $response['message'] = $upload_errors[$file['error']] ?? 'Error desconocido al subir el archivo.';
                break;
            }
            if ($file['type'] !== 'application/pdf') {
                $response['message'] = 'El archivo debe ser un PDF.';
                break;
            }

            // Antes de guardar, eliminamos cualquier PDF existente para mantener solo uno
            $existing_files = glob($boletinServerDir . '*.pdf');
            foreach ($existing_files as $existing_file) {
                unlink($existing_file);
            }

            // Usamos un nombre de archivo fijo para simplificar
            $destination = $boletinServerDir . 'boletin_semanal.pdf';

            if (move_uploaded_file($file['tmp_name'], $destination)) {
                $response = [
                    'success' => true,
                    'message' => 'Boletín guardado con éxito.'
                ];
            } else {
                $response['message'] = 'Error final: No se pudo mover el archivo subido al directorio de destino. Verifique los permisos.';
            }
        } else {
            $response['message'] = 'No se recibió ningún archivo.';
        }
        break;

    case 'delete':
        $currentFile = get_current_boletin($boletinServerDir);
        if ($currentFile) {
            if (unlink($currentFile)) {
                $response = [
                    'success' => true,
                    'message' => 'Boletín eliminado con éxito.'
                ];
            } else {
                $response['message'] = 'No se pudo eliminar el archivo.';
            }
        } else {
            $response['message'] = 'No había ningún boletín para eliminar.';
        }
        break;
}

echo json_encode($response);
?>
