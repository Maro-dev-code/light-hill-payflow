<?php
session_start();
require_once '../config/database.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Not authenticated.']);
    exit;
}

$approverId = $_SESSION['user_id'];

$stmt = $pdo->prepare('
    SELECT requests.*, users.name as requester_name, 
           approvals.action as my_action, approvals.comment as my_comment, approvals.created_at as acted_at
    FROM approvals
    JOIN requests ON approvals.request_id = requests.id
    JOIN users ON requests.requester_id = users.id
    WHERE approvals.approver_id = ?
    ORDER BY approvals.created_at DESC
');
$stmt->execute([$approverId]);
$history = $stmt->fetchAll();

echo json_encode(['success' => true, 'requests' => $history]);