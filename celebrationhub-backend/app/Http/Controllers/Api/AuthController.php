<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\User;
use App\Models\Subscription;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Register new organization
     */
    public function register(Request $request)
    {
        $validated = $request->validate([
            'organization_name' => 'required|string|min:2|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'name' => 'required|string|min:2|max:255',
        ]);

        // Create slug from organization name
        $slug = Str::slug($validated['organization_name']);
        
        // Check if slug exists
        if (Organization::where('slug', $slug)->exists()) {
            $slug = $slug . '-' . Str::random(4);
        }

        // Create organization
        $organization = Organization::create([
            'name' => $validated['organization_name'],
            'slug' => $slug,
            'email' => $validated['email'],
            'settings' => [
                'timezone' => 'Africa/Lagos',
                'send_time' => '06:00',
                'branding' => [
                    'primary_color' => '#667eea',
                    'secondary_color' => '#764ba2',
                ],
                'messaging' => [
                    'email_enabled' => true,
                    'sms_enabled' => false,
                    'whatsapp_enabled' => false,
                ],
            ],
        ]);

        // Create admin user
        $user = User::create([
            'organization_id' => $organization->id,
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'admin',
        ]);

        // Create trial subscription
        Subscription::create([
            'organization_id' => $organization->id,
            'plan_tier' => 'starter',
            'status' => 'trial',
            'current_period_start' => now(),
            'current_period_end' => now()->addDays(14), // 14-day trial
        ]);

        // Generate token
        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Organization registered successfully',
            'data' => [
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
                ],
                'token' => $token,
            ],
        ], 201);
    }

    /**
     * Login user
     */
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Update last login
        $user->update(['last_login_at' => now()]);

        // Generate token
        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Logged in successfully',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'email' => $user->email,
                    'name' => $user->name,
                    'role' => $user->role,
                ],
                'organization' => [
                    'id' => $user->organization->id,
                    'name' => $user->organization->name,
                    'slug' => $user->organization->slug,
                ],
                'token' => $token,
            ],
        ]);
    }

    /**
     * Get authenticated user
     */
    public function me(Request $request)
    {
        $user = $request->user()->load(['organization.activeSubscription']);

        return response()->json([
            'success' => true,
            'data' => [
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
            ],
        ]);
    }

    /**
     * Logout user
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully',
        ]);
    }
}