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
$requestId = $input['id'] ?? null;

if (!$requestId || !is_numeric($requestId)) {
    echo json_encode(['success' => false, 'message' => 'Invalid request ID.']);
    exit;
}

$stmt = $pdo->prepare('SELECT * FROM requests WHERE id = ?');
$stmt->execute([$requestId]);
$request = $stmt->fetch();

if (!$request) {
    echo json_encode(['success' => false, 'message' => 'Request not found.']);
    exit;
}

if ($request['requester_id'] != $_SESSION['user_id']) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'You do not have permission to cancel this request.']);
    exit;
}

if ($request['status'] !== 'pending_pba') {
    echo json_encode(['success' => false, 'message' => 'This request can no longer be cancelled since it has already entered the approval process.']);
    exit;
}

$updateStmt = $pdo->prepare("UPDATE requests SET status = 'cancelled' WHERE id = ?");
$updateStmt->execute([$requestId]);

echo json_encode(['success' => true, 'message' => 'Request cancelled successfully.']);