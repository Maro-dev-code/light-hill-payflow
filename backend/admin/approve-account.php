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

if (!$userId || !is_numeric($userId)) {
    echo json_encode(['success' => false, 'message' => 'Invalid user ID.']);
    exit;
}

$stmt = $pdo->prepare("UPDATE users SET account_status = 'active' WHERE id = ? AND account_status = 'pending'");
$stmt->execute([$userId]);

if ($stmt->rowCount() === 0) {
    echo json_encode(['success' => false, 'message' => 'Account not found or already processed.']);
    exit;
}

$auditStmt = $pdo->prepare('INSERT INTO audit_logs (user_id, action, description) VALUES (?, ?, ?)');
$auditStmt->execute([$_SESSION['user_id'], 'approve_account', "Approved account for user ID $userId"]);

echo json_encode(['success' => true, 'message' => 'Account approved.']);