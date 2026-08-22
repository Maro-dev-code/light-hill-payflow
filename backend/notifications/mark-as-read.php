<?php
session_start();
require_once '../config/database.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Not authenticated.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$notifId = $input['id'] ?? null;

if (!$notifId || !is_numeric($notifId)) {
    echo json_encode(['success' => false, 'message' => 'Invalid notification ID.']);
    exit;
}

$stmt = $pdo->prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?');
$stmt->execute([$notifId, $_SESSION['user_id']]);

echo json_encode(['success' => true]);