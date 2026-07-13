<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Models\Template;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class TemplateController extends Controller
{
    public function index(Request $request)
    {
        $this->ensurePublicTemplates();

        $orgId = $request->user()->organization_id;
        $org = $request->user()->organization;

        $templates = Template::where('is_public', true)
            ->orWhere('organization_id', $orgId)
            ->orderBy('type')
            ->orderBy('name')
            ->get();

        $settings = $org->settings ?? [];
        $defaults = $settings['default_templates'] ?? [
            'birthday' => null,
            'anniversary' => null,
        ];

        return ApiResponse::success([
            'templates' => $templates,
            'currentDefaults' => $defaults,
        ]);
    }

    public function show(Request $request, $templateId)
    {
        return ApiResponse::success($this->findAccessibleTemplate($request, $templateId));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:birthday,anniversary',
            'description' => 'nullable|string|max:500',
            'preview_url' => 'nullable|url|max:2048',
            'background_url' => 'nullable|url|max:2048',
        ]);

        $template = Template::create([
            ...$validated,
            'organization_id' => $request->user()->organization_id,
            'is_public' => false,
        ]);

        return ApiResponse::success($template, 'Template created successfully', 201);
    }

    public function update(Request $request, $templateId)
    {
        $template = $this->findOwnedTemplate($request, $templateId);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'type' => 'sometimes|required|in:birthday,anniversary',
            'description' => 'nullable|string|max:500',
            'preview_url' => 'nullable|url|max:2048',
            'background_url' => 'nullable|url|max:2048',
        ]);

        $template->update($validated);

        return ApiResponse::success($template->fresh(), 'Template updated successfully');
    }

    public function destroy(Request $request, $templateId)
    {
        $template = $this->findOwnedTemplate($request, $templateId);
        $template->delete();

        return ApiResponse::success(null, 'Template deleted successfully');
    }

    public function setDefault(Request $request, $templateId)
    {
        $request->validate([
            'type' => 'required|in:birthday,anniversary',
        ]);

        $type = $request->input('type');
        $org = $request->user()->organization;
        $template = $this->findAccessibleTemplate($request, $templateId);

        if ($template->type !== $type) {
            throw ValidationException::withMessages([
                'type' => ['Selected template does not match the requested celebration type.'],
            ]);
        }

        $settings = $org->settings ?? [];

        if (! isset($settings['default_templates'])) {
            $settings['default_templates'] = [];
        }

        $settings['default_templates'][$type] = (int) $templateId;
        $org->settings = $settings;
        $org->save();

        return ApiResponse::success(null, "Template set as default for {$type}s");
    }

    public function preview(Request $request, $templateId)
    {
        $template = $this->findAccessibleTemplate($request, $templateId);

        return ApiResponse::success([
            'previewUrl' => $template->preview_url
                ?? $template->background_url
                ?? "https://via.placeholder.com/800x600/4f46e5/ffffff?text=Preview+{$templateId}",
        ]);
    }

    private function findAccessibleTemplate(Request $request, $templateId): Template
    {
        return Template::where('id', $templateId)
            ->where(function ($query) use ($request) {
                $query->where('is_public', true)
                    ->orWhere('organization_id', $request->user()->organization_id);
            })
            ->firstOrFail();
    }

    private function findOwnedTemplate(Request $request, $templateId): Template
    {
        return Template::where('id', $templateId)
            ->where('organization_id', $request->user()->organization_id)
            ->where('is_public', false)
            ->firstOrFail();
    }

    private function ensurePublicTemplates(): void
    {
        $defaults = [
            [
                'name' => 'Warm Sunrise Birthday',
                'type' => 'birthday',
                'description' => 'A cheerful sunrise card for birthday celebrations.',
                'preview_url' => 'https://via.placeholder.com/800x600/f59e0b/ffffff?text=Warm+Sunrise+Birthday',
                'background_url' => 'https://via.placeholder.com/1200x900/f59e0b/ffffff?text=Warm+Sunrise',
                'is_public' => true,
            ],
            [
                'name' => 'Confetti Joy Birthday',
                'type' => 'birthday',
                'description' => 'A bright confetti design that feels festive and modern.',
                'preview_url' => 'https://via.placeholder.com/800x600/2563eb/ffffff?text=Confetti+Joy+Birthday',
                'background_url' => 'https://via.placeholder.com/1200x900/2563eb/ffffff?text=Confetti+Joy',
                'is_public' => true,
            ],
            [
                'name' => 'Golden Anniversary',
                'type' => 'anniversary',
                'description' => 'A warm gold layout for couples and milestone celebrations.',
                'preview_url' => 'https://via.placeholder.com/800x600/d97706/ffffff?text=Golden+Anniversary',
                'background_url' => 'https://via.placeholder.com/1200x900/d97706/ffffff?text=Golden+Anniversary',
                'is_public' => true,
            ],
            [
                'name' => 'Emerald Celebration',
                'type' => 'anniversary',
                'description' => 'A rich emerald style for elegant anniversary messaging.',
                'preview_url' => 'https://via.placeholder.com/800x600/047857/ffffff?text=Emerald+Celebration',
                'background_url' => 'https://via.placeholder.com/1200x900/047857/ffffff?text=Emerald+Celebration',
                'is_public' => true,
            ],
        ];

        foreach ($defaults as $default) {
            Template::firstOrCreate(
                [
                    'name' => $default['name'],
                    'type' => $default['type'],
                    'is_public' => true,
                ],
                $default
            );
        }
    }
}
