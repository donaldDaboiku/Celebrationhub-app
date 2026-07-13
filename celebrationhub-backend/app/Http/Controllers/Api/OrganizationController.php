<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class OrganizationController extends Controller
{
    public function settings(Request $request)
    {
        $organization = $request->user()->organization;

        return ApiResponse::success([
            'id' => $organization->id,
            'name' => $organization->name,
            'slug' => $organization->slug,
            'email' => $organization->email,
            'phone' => $organization->phone,
            'logo_url' => $organization->logo_url,
            'settings' => $organization->settings,
        ]);
    }

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
            'settings.member_fields' => 'sometimes|array',
            'settings.member_fields.department_label' => 'nullable|string|max:80',
            'settings.member_fields.designation_label' => 'nullable|string|max:80',
            'settings.member_fields.unit_label' => 'nullable|string|max:80',
            'settings.messaging' => 'sometimes|array',
            'settings.messaging.email_enabled' => 'sometimes|boolean',
            'settings.messaging.sms_enabled' => 'sometimes|boolean',
            'settings.messaging.whatsapp_enabled' => 'sometimes|boolean',
            'settings.messaging.primary_channel' => 'sometimes|string|in:email,sms,whatsapp',
            'settings.integrations' => 'sometimes|array',
            'settings.integrations.email' => 'sometimes|array',
            'settings.integrations.email.mailer' => 'nullable|string|max:50',
            'settings.integrations.email.host' => 'nullable|string|max:255',
            'settings.integrations.email.port' => 'nullable|integer|min:1|max:65535',
            'settings.integrations.email.username' => 'nullable|string|max:255',
            'settings.integrations.email.password' => 'nullable|string|max:255',
            'settings.integrations.email.encryption' => 'nullable|string|max:50',
            'settings.integrations.email.from_address' => 'nullable|email',
            'settings.integrations.email.from_name' => 'nullable|string|max:255',
            'settings.integrations.sms' => 'sometimes|array',
            'settings.integrations.sms.provider' => 'nullable|string|max:100',
            'settings.integrations.sms.sender_id' => 'nullable|string|max:100',
            'settings.integrations.whatsapp' => 'sometimes|array',
            'settings.integrations.whatsapp.provider' => 'nullable|string|max:100',
            'settings.integrations.whatsapp.sender_id' => 'nullable|string|max:100',
            'settings.integrations.whatsapp.phone_number' => 'nullable|string|max:50',
            'settings.socials' => 'sometimes|array',
            'settings.socials.facebook_page_url' => 'nullable|string|max:255',
            'settings.socials.instagram_handle' => 'nullable|string|max:255',
            'settings.socials.x_handle' => 'nullable|string|max:255',
            'settings.socials.youtube_url' => 'nullable|string|max:255',
            'settings.socials.telegram_link' => 'nullable|string|max:255',
            'settings.socials.tiktok_handle' => 'nullable|string|max:255',
            'settings.socials.website_url' => 'nullable|string|max:255',
        ]);

        $organization = $request->user()->organization;

        if (isset($validated['name'])) {
            $organization->name = $validated['name'];
        }
        if (isset($validated['email'])) {
            $organization->email = $validated['email'];
        }
        if (isset($validated['phone'])) {
            $organization->phone = $validated['phone'];
        }

        if (isset($validated['settings'])) {
            $currentSettings = $organization->settings ?? [];
            $organization->settings = array_replace_recursive($currentSettings, $validated['settings']);
        }

        $organization->save();

        return ApiResponse::success($organization, 'Settings updated successfully');
    }

    public function uploadLogo(Request $request)
    {
        $request->validate([
            'logo' => 'required|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        $organization = $request->user()->organization;

        if (! is_dir(public_path('logos'))) {
            mkdir(public_path('logos'), 0755, true);
        }

        if ($organization->logo_url) {
            $oldPath = parse_url($organization->logo_url, PHP_URL_PATH);
            $oldAbsolutePath = $oldPath ? public_path(ltrim($oldPath, '/')) : null;

            if ($oldAbsolutePath && str_starts_with($oldAbsolutePath, public_path('logos')) && file_exists($oldAbsolutePath)) {
                unlink($oldAbsolutePath);
            }
        }

        $file = $request->file('logo');
        $filename = 'org-' . $organization->id . '-' . Str::lower(Str::random(10)) . '.' . $file->getClientOriginalExtension();
        $file->move(public_path('logos'), $filename);

        $organization->logo_url = asset('logos/' . $filename);
        $organization->save();

        return ApiResponse::success(['logo_url' => $organization->logo_url], 'Logo uploaded successfully');
    }

    public function removeLogo(Request $request)
    {
        $organization = $request->user()->organization;

        if ($organization->logo_url) {
            $oldPath = parse_url($organization->logo_url, PHP_URL_PATH);
            $oldAbsolutePath = $oldPath ? public_path(ltrim($oldPath, '/')) : null;

            if ($oldAbsolutePath && str_starts_with($oldAbsolutePath, public_path('logos')) && file_exists($oldAbsolutePath)) {
                unlink($oldAbsolutePath);
            }
        }

        $organization->logo_url = null;
        $organization->save();

        return ApiResponse::success(['logo_url' => null], 'Logo removed successfully');
    }

    public function updateMessageTemplates(Request $request)
    {
        $validated = $request->validate([
            'birthday_template' => 'sometimes|string|max:500',
            'anniversary_template' => 'sometimes|string|max:500',
            'custom_signature' => 'sometimes|string|max:200',
        ]);

        $organization = $request->user()->organization;
        $settings = $organization->settings ?? [];

        if (! isset($settings['messages'])) {
            $settings['messages'] = [];
        }

        $settings['messages'] = array_merge($settings['messages'], $validated);

        $organization->settings = $settings;
        $organization->save();

        return ApiResponse::success($settings['messages'], 'Message templates updated successfully');
    }
}
