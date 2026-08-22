<?php
session_start();
require_once '../config/database.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Not authenticated.']);
    exit;
}

if ($_SESSION['role'] !== 'accountant') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'You do not have permission to view this.']);
    exit;
}

$stmt = $pdo->prepare('
    SELECT requests.*, users.name as requester_name 
    FROM requests 
    JOIN users ON requests.requester_id = users.id 
    WHERE requests.status = "approved" 
    ORDER BY requests.updated_at ASC
');
$stmt->execute();
$requests = $stmt->fetchAll();

echo json_encode(['success' => true, 'requests' => $requests]);