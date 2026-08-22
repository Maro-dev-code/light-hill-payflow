<?php
session_start();
require_once '../config/database.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Not authenticated.']);
    exit;
}

$role = $_SESSION['role'];
$approverId = $_SESSION['user_id'];

$statusMap = ['pba' => 'pending_pba', 'cfo' => 'pending_cfo', 'coo' => 'pending_coo'];

if (!isset($statusMap[$role])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'You do not have approval permissions.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$requestId = $input['id'] ?? null;
$comment = trim($input['comment'] ?? '');

if (!$requestId || !is_numeric($requestId)) {
    echo json_encode(['success' => false, 'message' => 'Invalid request ID.']);
    exit;
}

if (empty($comment)) {
    echo json_encode(['success' => false, 'message' => 'A reason is required to reject a request.']);
    exit;
}

$stmt = $pdo->prepare('SELECT * FROM requests WHERE id = ?');
$stmt->execute([$requestId]);
$request = $stmt->fetch();

if (!$request) {
    echo json_encode(['success' => false, 'message' => 'Request not found.']);
    exit;
}

if ($request['status'] !== $statusMap[$role]) {
    echo json_encode(['success' => false, 'message' => 'This request is not currently awaiting your approval.']);
    exit;
}

$approvalStmt = $pdo->prepare('INSERT INTO approvals (request_id, approver_id, role, action, comment) VALUES (?, ?, ?, ?, ?)');
$approvalStmt->execute([$requestId, $approverId, $role, 'rejected', $comment]);

$updateStmt = $pdo->prepare("UPDATE requests SET status = 'rejected', rejection_reason = ? WHERE id = ?");
$updateStmt->execute([$comment, $requestId]);

$auditStmt = $pdo->prepare('INSERT INTO audit_logs (user_id, request_id, action, description) VALUES (?, ?, ?, ?)');
$auditStmt->execute([$approverId, $requestId, 'reject_request', "Rejected request as " . strtoupper($role) . ": $comment"]);

$notifStmt = $pdo->prepare('INSERT INTO notifications (user_id, request_id, title, message) VALUES (?, ?, ?, ?)');
$notifStmt->execute([
    $request['requester_id'],
    $requestId,
    'Request Rejected',
    "Your request \"{$request['subject']}\" was rejected: $comment"
]);

echo json_encode(['success' => true, 'message' => 'Request rejected.']);