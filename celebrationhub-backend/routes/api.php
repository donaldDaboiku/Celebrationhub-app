<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\CreditController;
use App\Http\Controllers\TemplateController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CelebrationController;
use App\Http\Controllers\Api\MemberController;
use App\Http\Controllers\Api\MemberImportController;
use App\Http\Controllers\Api\OrganizationController;
use App\Http\Controllers\Api\CampaignController;

/*
|--------------------------------------------------------------------------
| Public routes (no auth required)
|--------------------------------------------------------------------------
*/
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/auth/reset-access', [AuthController::class, 'resetAccess']);

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'app' => 'CelebrationHub API',
        'timestamp' => now(),
    ]);
});

// Webhook route (must be public for external service)
Route::post('/credits/webhook', [CreditController::class, 'paystackWebhook']);

/*
|--------------------------------------------------------------------------
| Protected routes — ALL require valid Sanctum token
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    // --- Auth ---
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // --- Member Import / Export ---
    Route::get('members/upcoming', [MemberController::class, 'upcoming']);
    Route::prefix('members')->group(function () {
        Route::get('import/template', [MemberImportController::class, 'downloadTemplate']);
        Route::post('import', [MemberImportController::class, 'import']);
        Route::get('export', [MemberImportController::class, 'export']);
        Route::post('{member}/photo', [MemberController::class, 'uploadPhoto']);
        Route::delete('{member}/photo', [MemberController::class, 'removePhoto']);
    });
    Route::apiResource('members', MemberController::class);

    // --- Organization settings ---
    Route::prefix('organization')->group(function () {
        Route::get('settings', [OrganizationController::class, 'settings']);
        Route::patch('settings', [OrganizationController::class, 'updateSettings']);
        Route::post('logo', [OrganizationController::class, 'uploadLogo']);
        Route::delete('logo', [OrganizationController::class, 'removeLogo']);
        Route::patch('messages', [OrganizationController::class, 'updateMessageTemplates']);
    });

    // --- Campaigns ---
    Route::prefix('campaigns')->group(function () {
        Route::get('/', [CampaignController::class, 'index']);
        Route::post('/', [CampaignController::class, 'store']);
        Route::get('{campaign}', [CampaignController::class, 'show']);
        Route::patch('{campaign}/archive', [CampaignController::class, 'archive']);
        Route::post('{campaign}/send', [CampaignController::class, 'send']);
        Route::post('{campaign}/resend-failed', [CampaignController::class, 'resendFailed']);
        Route::delete('{campaign}', [CampaignController::class, 'destroy']);
    });

    // --- Manual celebration sends / resend history ---
    Route::get('/celebrations', [CelebrationController::class, 'index']);
    Route::post('/celebrations', [CelebrationController::class, 'store']);
    Route::post('/celebrations/{celebration}/resend', [CelebrationController::class, 'resend']);

    // --- Analytics ---
    Route::get('/analytics/dashboard', [AnalyticsController::class, 'dashboard']);

    // --- Templates ---
    Route::get('/templates', [TemplateController::class, 'index']);
    Route::post('/templates', [TemplateController::class, 'store']);
    Route::post('/templates/{id}/set-default', [TemplateController::class, 'setDefault']);
    Route::get('/templates/{id}/preview', [TemplateController::class, 'preview']);
    Route::get('/templates/{id}', [TemplateController::class, 'show']);
    Route::patch('/templates/{id}', [TemplateController::class, 'update']);
    Route::delete('/templates/{id}', [TemplateController::class, 'destroy']);

    // --- Credits ---
    Route::get('/credits', [CreditController::class, 'index']);
    Route::get('/credits/balance', [CreditController::class, 'balance']);
    Route::get('/credits/transactions', [CreditController::class, 'transactions']);
    Route::post('/credits/purchase', [CreditController::class, 'purchase']);
});
