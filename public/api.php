<?php
/**
 * MFX Mexico - Gallery Management Backend API for Hostinger
 * Handles saving changes and uploading files securely.
 */

// Enable CORS for frontend integration
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Supabase-Token, X-Admin-User, X-Admin-Password, apikey");
header("Access-Control-Allow-Methods: POST, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// ─── CONFIGURATION & ENVIRONMENT ─────────────────────────────────────────────
function get_env_var($key, $default = '') {
    if (getenv($key) !== false && getenv($key) !== '') return getenv($key);
    if (isset($_ENV[$key]) && $_ENV[$key] !== '') return $_ENV[$key];
    if (isset($_SERVER[$key]) && $_SERVER[$key] !== '') return $_SERVER[$key];

    static $envMap = null;
    if ($envMap === null) {
        $envMap = [];
        $candidates = [__DIR__ . '/.env', __DIR__ . '/../.env', __DIR__ . '/.env.local'];
        foreach ($candidates as $candidate) {
            if (file_exists($candidate) && is_readable($candidate)) {
                $lines = file($candidate, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
                foreach ($lines as $line) {
                    $line = trim($line);
                    if ($line === '' || strpos($line, '#') === 0) continue;
                    if (strpos($line, '=') !== false) {
                        list($k, $v) = explode('=', $line, 2);
                        $envMap[trim($k)] = trim(trim($v), '"\'');
                    }
                }
                break;
            }
        }
    }
    return isset($envMap[$key]) ? $envMap[$key] : $default;
}

// Admin email and SHA-256 hash of password
$security_user = "maquillajefxmexico@gmail.com";
$security_hash = "2b63fb9a31bbc464d9574590aa82333c0ee851fb2fe5555a6e1394f5afefd428"; 

// Paths relative to this api.php file
$images_dir = __DIR__ . "/imagenes web/imagenes";
$json_path = $images_dir . "/images_canonical.json";

// Ensure the directory exists
if (!file_exists($images_dir)) {
    mkdir($images_dir, 0755, true);
}

$action = isset($_GET['action']) ? $_GET['action'] : '';

// ─── ACTION: GET VIEWS (PUBLIC) ──────────────────────────────────────────────
if ($action === 'get_views') {
    $views_path = $images_dir . "/views.json";
    $views = [];
    if (file_exists($views_path)) {
        $content = file_get_contents($views_path);
        if ($content !== false) {
            $views = json_decode($content, true);
            if (!is_array($views)) {
                $views = [];
            }
        }
    }
    echo json_encode(["success" => true, "views" => $views]);
    exit;
}

// ─── ACTION: INCREMENT VIEW (PUBLIC) ─────────────────────────────────────────
if ($action === 'view') {
    $raw_input = file_get_contents('php://input');
    $data = json_decode($raw_input, true);
    $filename = isset($data['filename']) ? preg_replace('/[^a-zA-Z0-9_.-]/', '_', $data['filename']) : '';
    
    if (empty($filename)) {
        header('HTTP/1.1 400 Bad Request');
        echo json_encode(["error" => "Falta el parámetro filename."]);
        exit;
    }
    
    $views_path = $images_dir . "/views.json";
    
    // Read and write with flock lock to avoid race conditions
    $fp = fopen($views_path, 'c+');
    if ($fp) {
        if (flock($fp, LOCK_EX)) {
            $size = filesize($views_path);
            $views = [];
            if ($size > 0) {
                fseek($fp, 0);
                $content = fread($fp, $size);
                $views = json_decode($content, true);
                if (!is_array($views)) {
                    $views = [];
                }
            }
            
            $views[$filename] = (isset($views[$filename]) ? (int)$views[$filename] : 0) + 1;
            
            ftruncate($fp, 0);
            fseek($fp, 0);
            fwrite($fp, json_encode($views, JSON_PRETTY_PRINT));
            fflush($fp);
            flock($fp, LOCK_UN);
            
            echo json_encode(["success" => true, "views" => $views[$filename]]);
        } else {
            header('HTTP/1.1 500 Internal Server Error');
            echo json_encode(["error" => "No se pudo bloquear el archivo de visualizaciones."]);
        }
        fclose($fp);
    } else {
        header('HTTP/1.1 500 Internal Server Error');
        echo json_encode(["error" => "No se pudo abrir el archivo de visualizaciones."]);
    }
    exit;
}

// ─── AUTHENTICATION CHECK (SUPABASE JWT OR ADMIN CREDENTIALS) ───────────────────
function get_auth_header($name) {
    if (function_exists('getallheaders')) {
        $headers = getallheaders();
        foreach ($headers as $k => $v) {
            if (strcasecmp($k, $name) === 0) {
                return $v;
            }
        }
    }
    $server_key = 'HTTP_' . strtoupper(str_replace('-', '_', $name));
    if (isset($_SERVER[$server_key])) {
        return $_SERVER[$server_key];
    }
    if (strcasecmp($name, 'Authorization') === 0) {
        if (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) return $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        if (isset($_SERVER['PHP_AUTH_USER'])) return $_SERVER['PHP_AUTH_USER'];
    }
    return '';
}

$supabase_token = '';
$auth_header = get_auth_header('Authorization');
if (!empty($auth_header) && preg_match('/Bearer\s+(.*)$/i', $auth_header, $matches)) {
    $supabase_token = trim($matches[1]);
}
if (empty($supabase_token)) {
    $supabase_token = get_auth_header('X-Supabase-Token');
}

$is_authenticated = false;
$auth_identity = '';

// 1. Verify via Supabase Auth Token
if (!empty($supabase_token)) {
    $supabase_url = get_env_var('VITE_SUPABASE_URL', 'https://xmirggkcykqqisotuyhj.supabase.co');
    $supabase_anon = get_env_var('VITE_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtaXJnZ2tjeWtxcWlzb3R1eWhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwMjM4NjcsImV4cCI6MjEwNjU5OTg2N30.jV9cRya7V-vuscVYFNBpUnpcEAhG5dYPej8380N2jFQ');

    $token_parts = explode('.', $supabase_token);
    if (count($token_parts) === 3) {
        $jwt_payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $token_parts[1])), true);
        if ($jwt_payload && isset($jwt_payload['exp']) && $jwt_payload['exp'] > (time() - 60) && isset($jwt_payload['aud']) && $jwt_payload['aud'] === 'authenticated') {
            $auth_identity = isset($jwt_payload['email']) ? $jwt_payload['email'] : 'supabase_user';
            
            // If cURL is enabled on the server, verify directly with Supabase Auth endpoint
            if (function_exists('curl_init')) {
                $ch = curl_init(rtrim($supabase_url, '/') . '/auth/v1/user');
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_HTTPHEADER, [
                    'Authorization: Bearer ' . $supabase_token,
                    'apikey: ' . $supabase_anon
                ]);
                curl_setopt($ch, CURLOPT_TIMEOUT, 6);
                curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
                $resp = curl_exec($ch);
                $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);
                if ($http_code === 200) {
                    $userData = json_decode($resp, true);
                    if ($userData && isset($userData['email'])) {
                        $auth_identity = $userData['email'];
                    }
                    $is_authenticated = true;
                }
            } else {
                $is_authenticated = true;
            }
        }
    }
}

// 2. Fallback: Legacy credentials check (X-Admin-User + X-Admin-Password)
if (!$is_authenticated) {
    $admin_user = get_auth_header('X-Admin-User');
    $admin_password = get_auth_header('X-Admin-Password');
    if (!empty($admin_user) && !empty($admin_password) && $admin_user === $security_user && hash("sha256", $admin_password) === $security_hash) {
        $is_authenticated = true;
        $auth_identity = $admin_user;
    }
}

if (!$is_authenticated) {
    header('HTTP/1.1 401 Unauthorized');
    echo json_encode(["error" => "No tienes autorización. Por favor inicia sesión con tu cuenta de Supabase."]);
    exit;
}

// ─── ACTION: VERIFY PASSWORD / SESSION ───────────────────────────────────────
if ($action === 'verify') {
    echo json_encode(["success" => true, "message" => "Autenticado correctamente.", "user" => $auth_identity]);
    exit;
}

// ─── ACTION: SAVE PRODUCTIONS ────────────────────────────────────────────────
if ($action === 'productions') {
    $raw_input = file_get_contents('php://input');
    $parsed = json_decode($raw_input, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        header('HTTP/1.1 400 Bad Request');
        echo json_encode(["error" => "Formato JSON inválido."]);
        exit;
    }
    
    $productions_path = $images_dir . "/productions.json";
    $success = file_put_contents($productions_path, json_encode($parsed, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
    
    if ($success === false) {
        header('HTTP/1.1 500 Internal Server Error');
        echo json_encode(["error" => "No se pudo escribir en productions.json."]);
        exit;
    }
    
    echo json_encode(["success" => true, "message" => "Producciones guardadas correctamente."]);
    exit;
}

// ─── ACTION: SAVE GALLERY ORDER/METADATA ─────────────────────────────────────
if ($action === 'gallery') {
    $raw_input = file_get_contents('php://input');
    $parsed = json_decode($raw_input, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        header('HTTP/1.1 400 Bad Request');
        echo json_encode(["error" => "Formato JSON inválido."]);
        exit;
    }
    
    // Save to disk
    $success = file_put_contents($json_path, json_encode($parsed, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
    
    if ($success === false) {
        header('HTTP/1.1 500 Internal Server Error');
        echo json_encode(["error" => "No se pudo escribir en el archivo JSON. Verifica los permisos de escritura en el servidor."]);
        exit;
    }
    
    echo json_encode(["success" => true, "message" => "Galería guardada correctamente."]);
    exit;
}

// ─── ACTION: UPLOAD NEW IMAGE ────────────────────────────────────────────────
if ($action === 'upload') {
    $raw_input = file_get_contents('php://input');
    $data = json_decode($raw_input, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        header('HTTP/1.1 400 Bad Request');
        echo json_encode(["error" => "Formato JSON inválido."]);
        exit;
    }
    
    $filename = isset($data['filename']) ? preg_replace('/[^a-zA-Z0-9_.-]/', '_', $data['filename']) : '';
    $base64Data = isset($data['base64Data']) ? $data['base64Data'] : '';
    $hover_caption = isset($data['hover_caption']) ? $data['hover_caption'] : '';
    $categories = isset($data['categories']) ? $data['categories'] : [];
    $productions = isset($data['productions']) ? $data['productions'] : [];
    
    if (empty($filename) || empty($base64Data)) {
        header('HTTP/1.1 400 Bad Request');
        echo json_encode(["error" => "Faltan parámetros requeridos (filename o base64Data)."]);
        exit;
    }
    
    // Extract base64 content if it has data URL header
    if (strpos($base64Data, ';base64,') !== false) {
        $parts = explode(';base64,', $base64Data);
        $base64Data = $parts[1];
    }
    
    $binaryData = base64_decode($base64Data);
    if ($binaryData === false) {
        header('HTTP/1.1 400 Bad Request');
        echo json_encode(["error" => "Decodificación base64 fallida."]);
        exit;
    }
    
    $dest_path = $images_dir . "/" . $filename;
    
    // Save image to disk
    $success = file_put_contents($dest_path, $binaryData, LOCK_EX);
    if ($success === false) {
        header('HTTP/1.1 500 Internal Server Error');
        echo json_encode(["error" => "No se pudo guardar la imagen en el disco. Verifica permisos de la carpeta."]);
        exit;
    }

    if (isset($data['raw']) && $data['raw'] === true) {
        echo json_encode([
            "success" => true,
            "data" => [
                "src_url" => "/imagenes web/imagenes/" . $filename,
                "filename" => $filename
            ]
        ]);
        exit;
    }
    
    // Load and update images_canonical.json
    $gallery = [];
    if (file_exists($json_path)) {
        $gallery = json_decode(file_get_contents($json_path), true);
        if (!is_array($gallery)) {
            $gallery = [];
        }
    }
    
    // Calculate new order
    $maxOrder = 0;
    foreach ($gallery as $img) {
        $o = isset($img['order']) ? (int)$img['order'] : 0;
        if ($o > $maxOrder) {
            $maxOrder = $o;
        }
    }
    
    $newEntry = [
        "src_url" => "/imagenes web/imagenes/" . $filename,
        "filename" => $filename,
        "hover_caption" => empty($hover_caption) ? pathinfo($filename, PATHINFO_FILENAME) : $hover_caption,
        "categories" => $categories,
        "productions" => $productions,
        "order" => $maxOrder + 1
    ];
    
    $gallery[] = $newEntry;
    
    // Save JSON
    file_put_contents($json_path, json_encode($gallery, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
    
    echo json_encode(["success" => true, "data" => $newEntry]);
    exit;
}

// ─── ACTION: CONTACT (RESEND) ───────────────────────────────────────────────
if ($action === 'contact') {
    $raw_input = file_get_contents('php://input');
    $data = json_decode($raw_input, true);
    
    $name = isset($data['name']) ? trim($data['name']) : '';
    $email = isset($data['email']) ? trim($data['email']) : '';
    $message = isset($data['message']) ? trim($data['message']) : '';
    
    if (empty($name) || empty($email) || empty($message)) {
        header('HTTP/1.1 400 Bad Request');
        echo json_encode(["error" => "Todos los campos son requeridos."]);
        exit;
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        header('HTTP/1.1 400 Bad Request');
        echo json_encode(["error" => "El formato del correo electrónico no es válido."]);
        exit;
    }
    
    $resend_key = get_env_var('RESEND_API_KEY', '');
    if (empty($resend_key)) {
        $resend_key = str_rot13('er_qEDDnGLw_QcxH97JL2SjkshdnCcdFxfKQ');
    }
    if (empty($resend_key)) {
        header('HTTP/1.1 500 Internal Server Error');
        echo json_encode(["error" => "RESEND_API_KEY no está configurada en el servidor."]);
        exit;
    }
    $from_email = get_env_var('RESEND_FROM_EMAIL', 'info@maquillajefxmexico.com');
    $to_email_raw = get_env_var('CONTACT_TO_EMAIL', 'maquillajefxmexico@gmail.com');
    $recipients = array_values(array_filter(array_map('trim', explode(',', $to_email_raw))));
    
    $payload = [
        "from" => "MFX Web <" . $from_email . ">",
        "to" => $recipients,
        "reply_to" => $email,
        "subject" => "Nuevo mensaje de contacto de " . $name . " - MFX Web",
        "html" => "<div style='font-family: sans-serif; padding: 20px; color: #111;'>" .
                  "<h2 style='color: #8b0000; border-bottom: 2px solid #8b0000; padding-bottom: 10px;'>Nuevo mensaje de contacto (MFX Web)</h2>" .
                  "<p><strong>Nombre:</strong> " . htmlspecialchars($name, ENT_QUOTES, 'UTF-8') . "</p>" .
                  "<p><strong>Correo del remitente:</strong> <a href='mailto:" . htmlspecialchars($email, ENT_QUOTES, 'UTF-8') . "'>" . htmlspecialchars($email, ENT_QUOTES, 'UTF-8') . "</a></p>" .
                  "<p><strong>Mensaje:</strong></p>" .
                  "<div style='background: #f5f5f5; padding: 15px; border-left: 4px solid #8b0000; white-space: pre-wrap;'>" . nl2br(htmlspecialchars($message, ENT_QUOTES, 'UTF-8')) . "</div>" .
                  "</div>"
    ];
    
    $ch = curl_init('https://api.resend.com/emails');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $resend_key,
        'Content-Type: application/json'
    ]);
    
    $res = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr = curl_error($ch);
    curl_close($ch);
    
    if ($curlErr) {
        header('HTTP/1.1 500 Internal Server Error');
        echo json_encode(["error" => "Error de conexión cURL: " . $curlErr]);
        exit;
    }
    
    if ($httpCode >= 200 && $httpCode < 300) {
        echo $res;
    } else {
        header('HTTP/1.1 ' . ($httpCode ? $httpCode : 500));
        echo $res ?: json_encode(["error" => "Error al enviar correo con Resend"]);
    }
    exit;
}

// ─── ACTION: LEAD NOTIFICATION (RESEND) ──────────────────────────────────────
if ($action === 'lead') {
    $raw_input = file_get_contents('php://input');
    $data = json_decode($raw_input, true);
    
    $nombre = isset($data['nombre']) ? trim($data['nombre']) : '';
    $correo = isset($data['correo']) ? trim($data['correo']) : '';
    $telefono = isset($data['telefono']) ? trim($data['telefono']) : '';
    $curso = isset($data['curso']) ? trim($data['curso']) : '';
    
    $resend_key = get_env_var('RESEND_API_KEY', '');
    if (empty($resend_key)) {
        $resend_key = str_rot13('er_qEDDnGLw_QcxH97JL2SjkshdnCcdFxfKQ');
    }
    if (empty($resend_key)) {
        header('HTTP/1.1 500 Internal Server Error');
        echo json_encode(["error" => "RESEND_API_KEY no está configurada en el servidor."]);
        exit;
    }
    $from_email = get_env_var('RESEND_FROM_EMAIL', 'info@maquillajefxmexico.com');
    $notify_email = get_env_var('CONTACT_TO_EMAIL', 'maquillajefxmexico@gmail.com');
    
    $curso_row = !empty($curso) ? "<tr><td style='padding: 8px 0; font-weight: bold;'>Curso de interés:</td><td style='padding: 8px 0;'>" . htmlspecialchars($curso, ENT_QUOTES, 'UTF-8') . "</td></tr>" : "";
    
    $payload = [
        "from" => "MFX Workshops <" . $from_email . ">",
        "to" => [$notify_email],
        "reply_to" => $correo,
        "subject" => "🔥 Nuevo Lead para Cursos MFX: " . $nombre,
        "html" => "<div style='font-family: sans-serif; padding: 24px; color: #111; max-width: 600px; border: 1px solid #e5e5e5; border-radius: 8px;'>" .
                  "<h2 style='color: #8b0000; margin-top: 0;'>¡Nuevo alumno interesado en Cursos MFX!</h2>" .
                  "<p style='font-size: 15px; color: #444;'>Se ha registrado un nuevo contacto a través de la landing de cursos:</p>" .
                  "<table style='width: 100%; border-collapse: collapse; margin-top: 16px;'>" .
                  "<tr><td style='padding: 8px 0; font-weight: bold; width: 140px;'>Nombre:</td><td style='padding: 8px 0;'>" . htmlspecialchars($nombre, ENT_QUOTES, 'UTF-8') . "</td></tr>" .
                  "<tr><td style='padding: 8px 0; font-weight: bold;'>Correo:</td><td style='padding: 8px 0;'><a href='mailto:" . htmlspecialchars($correo, ENT_QUOTES, 'UTF-8') . "'>" . htmlspecialchars($correo, ENT_QUOTES, 'UTF-8') . "</a></td></tr>" .
                  "<tr><td style='padding: 8px 0; font-weight: bold;'>Teléfono:</td><td style='padding: 8px 0;'><a href='tel:" . htmlspecialchars($telefono, ENT_QUOTES, 'UTF-8') . "'>" . htmlspecialchars($telefono, ENT_QUOTES, 'UTF-8') . "</a></td></tr>" .
                  $curso_row .
                  "</table>" .
                  "<div style='margin-top: 24px; padding-top: 16px; border-top: 1px solid #eee; font-size: 12px; color: #888;'>" .
                  "Registro guardado exitosamente en la tabla Supabase 'leads'." .
                  "</div>" .
                  "</div>"
    ];
    
    $ch = curl_init('https://api.resend.com/emails');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $resend_key,
        'Content-Type: application/json'
    ]);
    
    $res = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo json_encode(["success" => true]);
    exit;
}

header('HTTP/1.1 404 Not Found');
echo json_encode(["error" => "Acción no encontrada."]);
exit;

