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
$nextStatusMap = ['pba' => 'pending_cfo', 'cfo' => 'pending_coo', 'coo' => 'approved'];

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

$newStatus = $nextStatusMap[$role];

// Record the approval action
$approvalStmt = $pdo->prepare('INSERT INTO approvals (request_id, approver_id, role, action, comment) VALUES (?, ?, ?, ?, ?)');
$approvalStmt->execute([$requestId, $approverId, $role, 'approved', $comment ?: null]);

// Move the request to the next stage
$updateStmt = $pdo->prepare('UPDATE requests SET status = ? WHERE id = ?');
$updateStmt->execute([$newStatus, $requestId]);

// Audit log
$auditStmt = $pdo->prepare('INSERT INTO audit_logs (user_id, request_id, action, description) VALUES (?, ?, ?, ?)');
$auditStmt->execute([$approverId, $requestId, 'approve_request', "Approved request as " . strtoupper($role)]);

// Notify the requester
$notifStmt = $pdo->prepare('INSERT INTO notifications (user_id, request_id, title, message) VALUES (?, ?, ?, ?)');
$notifStmt->execute([
    $request['requester_id'],
    $requestId,
    'Request Approved',
    "Your request \"{$request['subject']}\" was approved by " . strtoupper($role) . "."
]);

// Notify the next approver(s) in line, if the workflow isn't finished yet
if ($newStatus !== 'approved') {
    $nextRoleMap = ['pending_cfo' => 'cfo', 'pending_coo' => 'coo'];
    $nextRole = $nextRoleMap[$newStatus] ?? null;

    if ($nextRole) {
        $nextApprovers = $pdo->prepare('SELECT id FROM users WHERE role = ? AND account_status = "active"');
        $nextApprovers->execute([$nextRole]);
        foreach ($nextApprovers->fetchAll() as $approver) {
            $notifStmt->execute([
                $approver['id'],
                $requestId,
                'New Request Awaiting Review',
                "Request \"{$request['subject']}\" is now awaiting your review."
            ]);
        }
    }
}

echo json_encode(['success' => true, 'message' => 'Request approved successfully.']);