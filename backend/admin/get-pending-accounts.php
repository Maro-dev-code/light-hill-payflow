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

$stmt = $pdo->prepare("SELECT id, name, email, phone, position, role, created_at FROM users WHERE account_status = 'pending' ORDER BY created_at ASC");
$stmt->execute();
$accounts = $stmt->fetchAll();

echo json_encode(['success' => true, 'accounts' => $accounts]);