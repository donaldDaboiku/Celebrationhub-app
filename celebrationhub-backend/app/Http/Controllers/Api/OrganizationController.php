<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class OrganizationController extends Controller
{
    /**
     * Get organization settings
     */
    public function settings(Request $request)
    {
        $organization = $request->user()->organization;

        return response()->json([
            'success' => true,
            'data' => [
                'name' => $organization->name,
                'slug' => $organization->slug,
                'email' => $organization->email,
                'phone' => $organization->phone,
                'logo_url' => $organization->logo_url,
                'settings' => $organization->settings,
            ],
        ]);
    }

    /**
     * Update organization settings
     */
    public function updateSettings(Request $request)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email',
            'phone' => 'sometimes|string|max:50',
            'settings' => 'sometimes|array',
            'settings.timezone' => 'sometimes|string',
            'settings.send_time' => 'sometimes|string',
            'settings.branding' => 'sometimes|array',
            'settings.branding.primary_color' => 'sometimes|string',
            'settings.branding.secondary_color' => 'sometimes|string',
            'settings.messaging' => 'sometimes|array',
        ]);

        $organization = $request->user()->organization;

        // Update basic info
        if (isset($validated['name'])) {
            $organization->name = $validated['name'];
        }
        if (isset($validated['email'])) {
            $organization->email = $validated['email'];
        }
        if (isset($validated['phone'])) {
            $organization->phone = $validated['phone'];
        }

        // Update settings (merge with existing)
        if (isset($validated['settings'])) {
            $currentSettings = $organization->settings ?? [];
            $organization->settings = array_merge($currentSettings, $validated['settings']);
        }

        $organization->save();

        return response()->json([
            'success' => true,
            'message' => 'Settings updated successfully',
            'data' => $organization,
        ]);
    }

    /**
     * Upload logo
     */
    public function uploadLogo(Request $request)
    {
        $request->validate([
            'logo' => 'required|image|mimes:jpeg,png,jpg|max:2048', // 2MB max
        ]);

        $organization = $request->user()->organization;

        // Delete old logo if exists
        if ($organization->logo_url) {
            $oldPath = str_replace(asset('storage/'), '', $organization->logo_url);
            Storage::disk('public')->delete($oldPath);
        }

        // Store new logo
        $path = $request->file('logo')->store('logos', 'public');
        $organization->logo_url = asset('storage/' . $path);
        $organization->save();

        return response()->json([
            'success' => true,
            'message' => 'Logo uploaded successfully',
            'data' => [
                'logo_url' => $organization->logo_url,
            ],
        ]);
    }

    /**
     * Update message templates
     */
    public function updateMessageTemplates(Request $request)
    {
        $validated = $request->validate([
            'birthday_template' => 'sometimes|string|max:500',
            'anniversary_template' => 'sometimes|string|max:500',
            'custom_signature' => 'sometimes|string|max:200',
        ]);

        $organization = $request->user()->organization;
        $settings = $organization->settings ?? [];

        if (!isset($settings['messages'])) {
            $settings['messages'] = [];
        }

        $settings['messages'] = array_merge(
            $settings['messages'],
            $validated
        );

        $organization->settings = $settings;
        $organization->save();

        return response()->json([
            'success' => true,
            'message' => 'Message templates updated successfully',
            'data' => $settings['messages'],
        ]);
    }
}