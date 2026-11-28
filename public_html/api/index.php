<?php
// Hostinger API Bridge to Node.js backend
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$requestUri = $_SERVER['REQUEST_URI'] ?? '';
// Strip /api prefix to get the route path
$path = preg_replace('#^.*?/api#', '', $requestUri);
if (empty($path) || $path === '/') {
    $path = '/health';
}

// Ports where Node.js backend may be listening
$ports = [5000, 3000, 8080];
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$body = file_get_contents('php://input');

$headers = [];
if (function_exists('getallheaders')) {
    foreach (getallheaders() as $name => $value) {
        if (strtolower($name) !== 'host' && strtolower($name) !== 'content-length') {
            $headers[] = "$name: $value";
        }
    }
}
if (!empty($body)) {
    $headers[] = 'Content-Length: ' . strlen($body);
    if (!isset($_SERVER['CONTENT_TYPE'])) {
        $headers[] = 'Content-Type: application/json';
    }
}

$response = false;
$httpCode = 502;
$connectedPort = null;

foreach ($ports as $port) {
    $url = "http://127.0.0.1:$port/api" . $path;
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    if (!empty($body)) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    }
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 20);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 2);

    $result = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($code > 0) {
        $response = $result;
        $httpCode = $code;
        $connectedPort = $port;
        break;
    }
}

if ($response !== false) {
    http_response_code($httpCode);
    header('Content-Type: application/json; charset=utf-8');
    echo $response;
    exit;
}

// Fallback if local Node.js is not responding on checked ports
http_response_code(503);
header('Content-Type: application/json; charset=utf-8');
echo json_encode([
    'message' => 'Backend Node.js service is not running on Hostinger.',
    'detail' => 'Please open Hostinger hPanel -> Node.js and click Start Application.',
    'ports_checked' => $ports,
    'route' => $path
]);
