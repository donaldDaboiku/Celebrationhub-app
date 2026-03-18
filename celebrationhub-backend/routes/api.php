<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\TemplateController;
use App\Http\Controllers\Api\AuthController;
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

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'app' => 'CelebrationHub API',
        'timestamp' => now(),
    ]);
});

// Webhook route (must be public for external service)
Route::post('/credits/webhook', 'App\\Http\\Controllers\\CreditController@paystackWebhook');

/*
|--------------------------------------------------------------------------
| Protected routes — ALL require valid Sanctum token
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    // --- Auth ---
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // --- Members CRUD ---
    Route::apiResource('members', MemberController::class);
    Route::get('members/upcoming', [MemberController::class, 'upcoming']);

    // --- Member Import / Export ---
    Route::prefix('members')->group(function () {
        Route::get('import/template', [MemberImportController::class, 'downloadTemplate']);
        Route::post('import', [MemberImportController::class, 'import']);
        Route::get('export', [MemberImportController::class, 'export']);
    });

    // --- Organization settings ---
    Route::prefix('organization')->group(function () {
        Route::get('settings', [OrganizationController::class, 'settings']);
        Route::patch('settings', [OrganizationController::class, 'updateSettings']);
        Route::post('logo', [OrganizationController::class, 'uploadLogo']);
        Route::patch('messages', [OrganizationController::class, 'updateMessageTemplates']);
    });

    // --- Campaigns ---
    Route::prefix('campaigns')->group(function () {
        Route::get('/', [CampaignController::class, 'index']);
        Route::post('/', [CampaignController::class, 'store']);
        Route::get('{campaign}', [CampaignController::class, 'show']);
        Route::post('{campaign}/send', [CampaignController::class, 'send']);
    });

    // --- Analytics ---
    Route::get('/analytics/dashboard', [AnalyticsController::class, 'dashboard']);

    // --- Templates ---
    Route::get('/templates', [TemplateController::class, 'index']);
    Route::post('/templates/{id}/set-default', [TemplateController::class, 'setDefault']);
    Route::get('/templates/{id}/preview', [TemplateController::class, 'preview']);

    // --- Credits ---
    Route::get('/credits/balance', 'App\\Http\\Controllers\\CreditController@balance');
    Route::get('/credits/transactions', 'App\\Http\\Controllers\\CreditController@transactions');
    Route::post('/credits/purchase', 'App\\Http\\Controllers\\CreditController@purchase');
});
