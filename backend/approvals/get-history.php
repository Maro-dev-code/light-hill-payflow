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

$stmt = $pdo->prepare('
    SELECT requests.*, requester.name as requester_name, 
           approvals.action as my_action, approvals.comment as my_comment, approvals.created_at as acted_at,
           approver.name as approver_name
    FROM approvals
    JOIN requests ON approvals.request_id = requests.id
    JOIN users AS requester ON requests.requester_id = requester.id
    JOIN users AS approver ON approvals.approver_id = approver.id
    WHERE approvals.role = ?
    ORDER BY approvals.created_at DESC
');
$stmt->execute([$role]);
$history = $stmt->fetchAll();

echo json_encode(['success' => true, 'requests' => $history]);