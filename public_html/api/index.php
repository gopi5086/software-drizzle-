<?php
// Hostinger API Bridge to Node.js backend
// Routes all /api/* requests to the local Node.js process

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$requestUri = $_SERVER['REQUEST_URI'] ?? '';
// Strip /api prefix to get the route path (handle subdomain paths too)
$path = preg_replace('#^(.*?)/api#', '', $requestUri);
if (empty($path) || $path === '/') {
    $path = '/health';
}

// Remove query string from path (keep it separate)
$queryString = '';
if (strpos($path, '?') !== false) {
    list($path, $queryString) = explode('?', $path, 2);
}

// Try to read the port the Node.js process wrote to file on startup
$portFromFile = null;
$portFileCandidates = [
    __DIR__ . '/.node_port',
    dirname(__DIR__) . '/.node_port',
    dirname(__DIR__) . '/public_html/.node_port',
    '/home/u853918251/domains/brilliant-lightcoral-crane-93.hostingersite.com/public_html/.node_port',
];
foreach ($portFileCandidates as $pf) {
    if (file_exists($pf)) {
        $portFromFile = (int)trim(file_get_contents($pf));
        break;
    }
}

// Build ports list - put discovered port first, then fallbacks
$fallbackPorts = [3000, 5000, 8080, 3001, 8000, 4000, 8888, 9000];
if ($portFromFile) {
    $ports = array_unique(array_merge([$portFromFile], $fallbackPorts));
} else {
    $ports = $fallbackPorts;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$body = file_get_contents('php://input');

$headers = [];
if (function_exists('getallheaders')) {
    foreach (getallheaders() as $name => $value) {
        $nameLower = strtolower($name);
        if ($nameLower !== 'host' && $nameLower !== 'content-length' && $nameLower !== 'transfer-encoding') {
            $headers[] = "$name: $value";
        }
    }
}
if (!empty($body)) {
    $headers[] = 'Content-Length: ' . strlen($body);
    if (empty($_SERVER['CONTENT_TYPE'])) {
        $headers[] = 'Content-Type: application/json';
    }
}

$response = false;
$httpCode = 503;
$connectedPort = null;
$triedPorts = [];

foreach ($ports as $port) {
    $urlPath = $queryString ? "/api{$path}?{$queryString}" : "/api{$path}";
    $url = "http://127.0.0.1:{$port}{$urlPath}";
    $triedPorts[] = $port;

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    if (!empty($body)) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    }
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 25);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 2);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

    $rawResponse = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($code > 0 && !$curlError) {
        $responseHeaders = substr($rawResponse, 0, $headerSize);
        $response = substr($rawResponse, $headerSize);
        $httpCode = $code;
        $connectedPort = $port;

        // Forward useful response headers from Node.js
        foreach (explode("\r\n", $responseHeaders) as $line) {
            $lineLower = strtolower($line);
            if (strpos($lineLower, 'content-type:') === 0 ||
                strpos($lineLower, 'x-') === 0) {
                header($line, false);
            }
        }
        break;
    }
}

if ($response !== false) {
    http_response_code($httpCode);
    if (!headers_sent()) {
        header('Content-Type: application/json; charset=utf-8');
    }
    echo $response;
    exit;
}

// Node.js is not running - return helpful error
http_response_code(503);
header('Content-Type: application/json; charset=utf-8');
echo json_encode([
    'error' => 'Backend service unavailable',
    'message' => 'Node.js backend is not running. Please start it in Hostinger hPanel > Node.js.',
    'ports_tried' => $triedPorts,
    'route' => $path,
    'port_file_found' => $portFromFile ? "yes (port $portFromFile)" : 'no',
    'hint' => 'Go to hPanel -> Websites -> Manage -> Node.js -> Start Application'
]);
