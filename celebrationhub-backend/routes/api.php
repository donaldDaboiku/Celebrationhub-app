<?php 

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\TemplateController;
use App\Http\Controllers\CreditController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\MemberController; 

// Public routes
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    
    // Members
    Route::apiResource('members', MemberController::class);
    Route::get('members/upcoming', [MemberController::class, 'upcoming']);
});
// Add inside auth:sanctum middleware group
Route::prefix('members')->group(function () {
    // Import/Export
    Route::get('import/template', [App\Http\Controllers\Api\MemberImportController::class, 'downloadTemplate']);
    Route::post('import', [App\Http\Controllers\Api\MemberImportController::class, 'import']);
    Route::get('export', [App\Http\Controllers\Api\MemberImportController::class, 'export']);
});
// Add inside auth:sanctum middleware group
Route::prefix('organization')->group(function () {
    Route::get('settings', [App\Http\Controllers\Api\OrganizationController::class, 'settings']);
    Route::patch('settings', [App\Http\Controllers\Api\OrganizationController::class, 'updateSettings']);
    Route::post('logo', [App\Http\Controllers\Api\OrganizationController::class, 'uploadLogo']);
    Route::patch('messages', [App\Http\Controllers\Api\OrganizationController::class, 'updateMessageTemplates']);
});
// Add inside auth:sanctum middleware group
Route::prefix('campaigns')->group(function () {
    Route::get('/', [App\Http\Controllers\Api\CampaignController::class, 'index']);
    Route::post('/', [App\Http\Controllers\Api\CampaignController::class, 'store']);
    Route::get('{campaign}', [App\Http\Controllers\Api\CampaignController::class, 'show']);
    Route::post('{campaign}/send', [App\Http\Controllers\Api\CampaignController::class, 'send']);
});

// Analytics endpoints
Route::get('/analytics/dashboard', [AnalyticsController::class, 'dashboard']);

// Template endpoints
Route::get('/templates', [TemplateController::class, 'index']);
Route::post('/templates/{id}/set-default', [TemplateController::class, 'setDefault']);
Route::get('/templates/{id}/preview', [TemplateController::class, 'preview']);

// Credit endpoints
Route::get('/credits/balance', [CreditController::class, 'balance']);
Route::get('/credits/transactions', [CreditController::class, 'transactions']);
Route::post('/credits/purchase', [CreditController::class, 'purchase']);
Route::post('/credits/webhook', [CreditController::class, 'paystackWebhook']);
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'app' => 'CelebrationHub API',
        'timestamp' => now(),
    ]);
});
