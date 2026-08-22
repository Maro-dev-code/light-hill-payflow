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
    echo json_encode(['success' => false, 'message' => 'You do not have permission to do this.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$userId = $input['id'] ?? null;
$action = $input['action'] ?? null;

if (!$userId || !is_numeric($userId) || !in_array($action, ['deactivate', 'activate'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid request.']);
    exit;
}

if ($userId == $_SESSION['user_id']) {
    echo json_encode(['success' => false, 'message' => 'You cannot deactivate your own account.']);
    exit;
}

$newStatus = $action === 'deactivate' ? 'deactivated' : 'active';

$stmt = $pdo->prepare('UPDATE users SET account_status = ? WHERE id = ?');
$stmt->execute([$newStatus, $userId]);

$auditStmt = $pdo->prepare('INSERT INTO audit_logs (user_id, action, description) VALUES (?, ?, ?)');
$auditStmt->execute([$_SESSION['user_id'], $action . '_user', ucfirst($action) . "d user ID $userId"]);

echo json_encode(['success' => true, 'message' => 'User status updated.']);