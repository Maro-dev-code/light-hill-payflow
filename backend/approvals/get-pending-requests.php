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

$statusMap = [
    'pba' => 'pending_pba',
    'cfo' => 'pending_cfo',
    'coo' => 'pending_coo',
];

if (!isset($statusMap[$role])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'This role does not have approval permissions.']);
    exit;
}

$targetStatus = $statusMap[$role];

$stmt = $pdo->prepare('
    SELECT requests.*, users.name as requester_name 
    FROM requests 
    JOIN users ON requests.requester_id = users.id 
    WHERE requests.status = ? 
    ORDER BY requests.created_at ASC
');
$stmt->execute([$targetStatus]);
$requests = $stmt->fetchAll();

echo json_encode(['success' => true, 'requests' => $requests, 'role' => $role]);