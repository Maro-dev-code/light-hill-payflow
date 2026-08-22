<?php
session_start();
require_once '../config/database.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Not authenticated.']);
    exit;
}

if ($_SESSION['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'You do not have permission to view this.']);
    exit;
}

$stmt = $pdo->prepare('
    SELECT audit_logs.*, users.name as user_name
    FROM audit_logs
    JOIN users ON audit_logs.user_id = users.id
    ORDER BY audit_logs.created_at DESC
    LIMIT 200
');
$stmt->execute();
$logs = $stmt->fetchAll();

echo json_encode(['success' => true, 'logs' => $logs]);