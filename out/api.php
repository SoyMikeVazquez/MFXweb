<?php
/**
 * MFX Mexico - Gallery Management Backend API for Hostinger
 * Handles saving changes and uploading files securely.
 */

// Enable CORS for frontend integration
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, X-Admin-User, X-Admin-Password");
header("Access-Control-Allow-Methods: POST, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// ─── CONFIGURATION ───────────────────────────────────────────────────────────
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

// ─── AUTHENTICATION CHECK (FOR ADMIN ACTIONS ONLY) ───────────────────────────
$headers = getallheaders();
$admin_user = isset($headers['X-Admin-User']) ? $headers['X-Admin-User'] : '';
$admin_password = isset($headers['X-Admin-Password']) ? $headers['X-Admin-Password'] : '';

if (empty($admin_user) || empty($admin_password) || $admin_user !== $security_user || hash("sha256", $admin_password) !== $security_hash) {
    header('HTTP/1.1 401 Unauthorized');
    echo json_encode(["error" => "Usuario o contraseña de administrador incorrectos."]);
    exit;
}

// ─── ACTION: VERIFY PASSWORD ─────────────────────────────────────────────────
if ($action === 'verify') {
    echo json_encode(["success" => true, "message" => "Autenticado correctamente."]);
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
        "order" => $maxOrder + 1
    ];
    
    $gallery[] = $newEntry;
    
    // Save JSON
    file_put_contents($json_path, json_encode($gallery, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
    
    echo json_encode(["success" => true, "data" => $newEntry]);
    exit;
}

header('HTTP/1.1 404 Not Found');
echo json_encode(["error" => "Acción no encontrada."]);
exit;
