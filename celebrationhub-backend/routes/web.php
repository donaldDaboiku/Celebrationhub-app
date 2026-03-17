<?php

use Illuminate\Support\Facades\Route;
use App\Services\TermiiService;
use App\Services\EmailService;
use App\Services\DesignService;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/test-sms', function () {
    $termii = new TermiiService();

    $result = $termii->sendSMS(
        '08100197402', // Your test phone number
        'Test SMS from CelebrationHub',
        'GIT'
    );

    return response()->json($result);
});


Route::get('/test-design', function () {
    $design = new DesignService();

    $url = $design->generateCard(
        'birthday',
        'Mr',
        'Donald Daboiku',
        null // No photo for now
    );

    return response()->json([
        'success' => true,
        'design_url' => $url
    ]);
}); 

Route::get('/test-services', function () {
    $results = [];
    
    // Test Design Service
    try {
        $design = new DesignService();
        $designUrl = $design->generateCard('birthday', 'Mr', 'Test User', null);
        $results['design'] = [
            'status' => 'success',
            'url' => $designUrl
        ];
    } catch (\Exception $e) {
        $results['design'] = [
            'status' => 'failed',
            'error' => $e->getMessage()
        ];
    }
    
    // Test Email Service
    try {
        $email = new EmailService();
        $result = $email->sendCelebration(
            'test@example.com',
            'Test User',
            'Test Email',
            'This is a test message',
            $results['design']['url'] ?? 'https://via.placeholder.com/600'
        );
        $results['email'] = $result;
    } catch (\Exception $e) {
        $results['email'] = [
            'status' => 'failed',
            'error' => $e->getMessage()
        ];
    }
    
    return response()->json($results);
});