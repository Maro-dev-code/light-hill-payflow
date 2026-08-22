<?php
require_once __DIR__ . '/../../vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

function sendOTPEmail($toEmail, $toName, $otp) {
    $mail = new PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host = 'smtp.gmail.com';
        $mail->SMTPAuth = true;
        $mail->Username = 'YOUR_EMAIL@gmail.com';
        $mail->Password = 'YOUR_APP_PASSWORD';
        $mail->SMTPSecure = 'tls';
        $mail->Port = 587;
        $mail->setFrom('YOUR_EMAIL@gmail.com', 'Light Hill PayFlow');
        $mail->addAddress($toEmail, $toName);
        $mail->isHTML(true);
        $mail->Subject = 'Your Light Hill PayFlow Verification Code';
        $mail->Body = "<h2>Verify Your Email</h2><p>Hi {$toName},</p><p>Your code is:</p><h1>{$otp}</h1>";
        $mail->send();
        return true;
    } catch (Exception $e) {
        error_log('Mailer Error: ' . $mail->ErrorInfo);
        return false;
    }
}

// Copy this file to mailer.php and fill in your real Gmail credentials.