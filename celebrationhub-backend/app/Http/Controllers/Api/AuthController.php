<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Models\User;
use App\Services\AuthService;
use App\Services\EmailService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(private AuthService $authService)
    {
    }

    public function register(RegisterRequest $request)
    {
        $result = $this->authService->register($request->validated());

        return ApiResponse::success(
            $this->formatAuthPayload($result['user'], $result['organization'], $result['token']),
            'Organization registered successfully',
            201
        );
    }

    public function login(LoginRequest $request)
    {
        $result = $this->authService->login($request->validated());

        if (! $result) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        return ApiResponse::success(
            $this->formatAuthPayload($result['user'], $result['organization'], $result['token']),
            'Logged in successfully'
        );
    }

    public function me(Request $request)
    {
        $user = $request->user()->load(['organization.activeSubscription']);

        return ApiResponse::success([
            'id' => $user->id,
            'email' => $user->email,
            'name' => $user->name,
            'role' => $user->role,
            'organization' => [
                'id' => $user->organization->id,
                'name' => $user->organization->name,
                'slug' => $user->organization->slug,
                'logo_url' => $user->organization->logo_url,
                'subscription' => $user->organization->activeSubscription,
            ],
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return ApiResponse::success(null, 'Logged out successfully');
    }

    public function forgotPassword(Request $request, EmailService $emailService)
    {
        $validated = $request->validate([
            'email' => 'required|email',
        ]);

        $user = User::with('organization')->where('email', $validated['email'])->first();

        if ($user) {
            $token = Str::upper(Str::random(8));

            DB::table('password_reset_tokens')->updateOrInsert(
                ['email' => $user->email],
                [
                    'token' => Hash::make($token),
                    'created_at' => now(),
                ]
            );

            $frontendBase = rtrim((string) env('FRONTEND_URL', 'http://localhost:3000'), '/');
            $resetUrl = $frontendBase . '/reset-access?email=' . urlencode($user->email);

            $emailService->sendAccessReset(
                $user->email,
                $user->name,
                $token,
                $resetUrl,
                $user->organization
            );
        }

        return ApiResponse::success(
            null,
            'If that email exists, a reset code has been sent.'
        );
    }

    public function resetAccess(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'token' => 'required|string|min:6|max:32',
            'name' => 'nullable|string|min:2|max:255',
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        $resetRecord = DB::table('password_reset_tokens')->where('email', $validated['email'])->first();

        if (! $resetRecord) {
            throw ValidationException::withMessages([
                'email' => ['No reset request was found for that email address.'],
            ]);
        }

        if (now()->diffInMinutes($resetRecord->created_at) > 60) {
            DB::table('password_reset_tokens')->where('email', $validated['email'])->delete();

            throw ValidationException::withMessages([
                'token' => ['This reset code has expired. Request a new one and try again.'],
            ]);
        }

        if (! Hash::check($validated['token'], $resetRecord->token)) {
            throw ValidationException::withMessages([
                'token' => ['The reset code is invalid.'],
            ]);
        }

        $user = User::where('email', $validated['email'])->firstOrFail();

        $user->forceFill([
            'name' => $validated['name'] ?: $user->name,
            'password' => Hash::make($validated['password']),
        ])->save();

        DB::table('password_reset_tokens')->where('email', $validated['email'])->delete();
        DB::table('personal_access_tokens')->where('tokenable_type', User::class)->where('tokenable_id', $user->id)->delete();

        return ApiResponse::success(
            null,
            'Account access updated successfully. You can now sign in with your email and new password.'
        );
    }

    private function formatAuthPayload(User $user, $organization, string $token): array
    {
        return [
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'name' => $user->name,
                'role' => $user->role,
            ],
            'organization' => [
                'id' => $organization->id,
                'name' => $organization->name,
                'slug' => $organization->slug,
                'logo_url' => $organization->logo_url,
            ],
            'token' => $token,
        ];
    }
}
