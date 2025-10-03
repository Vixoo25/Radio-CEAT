<?php
session_start(); // Iniciar sesión para manejar el estado del usuario
header('Content-Type: application/json');
require_once 'conn.php';

$response = ['success' => false, 'message' => 'Petición no válida.'];

// 1. Leer los datos JSON enviados desde JavaScript
$data = json_decode(file_get_contents('php://input'), true);

if ($data && isset($data['username']) && isset($data['password'])) {
    $username = $data['username'];
    $password = $data['password'];

    // 2. Preparar la consulta para buscar al usuario
    $stmt = $conn->prepare("SELECT password_hash, role FROM usuarios WHERE username = ?");
    if ($stmt) {
        $stmt->bind_param("s", $username);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 1) {
            $user = $result->fetch_assoc();
            
            // 3. Verificar la contraseña encriptada
            if (password_verify($password, $user['password_hash'])) {
                // Contraseña correcta
                $response['success'] = true;
                $response['message'] = 'Inicio de Sesión Exitoso';
                $response['role'] = $user['role']; // Devolvemos el rol para que JS sepa qué modal abrir
            } else {
                // Contraseña incorrecta
                $response['message'] = 'Usuario y/o Contraseña incorrectos, intente nuevamente';
            }
        } else {
            // Usuario no encontrado
            $response['message'] = 'Usuario y/o Contraseña incorrectos, intente nuevamente';
        }
        $stmt->close();
    } else {
        $response['message'] = 'Error en la preparación de la consulta.';
    }
}

$conn->close();
echo json_encode($response);
?>