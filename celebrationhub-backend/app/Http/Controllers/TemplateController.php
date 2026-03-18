<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Template;

class TemplateController extends Controller
{
    public function index(Request $request)
    {
        $orgId = $request->user()->organization_id;
        $org   = $request->user()->organization;

        // Public system templates + this org's custom templates
        $templates = Template::where('is_public', true)
            ->orWhere('organization_id', $orgId)
            ->orderBy('type')
            ->orderBy('name')
            ->get();

        $settings = $org->settings ?? [];
        $defaults = $settings['default_templates'] ?? [
            'birthday'    => null,
            'anniversary' => null,
        ];

        return response()->json([
            'templates'       => $templates,
            'currentDefaults' => $defaults,
        ]);
    }

    public function setDefault(Request $request, $templateId)
    {
        $request->validate([
            'type' => 'required|in:birthday,anniversary',
        ]);

        $type = $request->input('type');
        $org  = $request->user()->organization;

        $settings = $org->settings ?? [];

        if (! isset($settings['default_templates'])) {
            $settings['default_templates'] = [];
        }

        $settings['default_templates'][$type] = (int) $templateId;
        $org->settings = $settings;
        $org->save();

        return response()->json([
            'success' => true,
            'message' => "Template set as default for {$type}s",
        ]);
    }

    public function preview($templateId)
    {
        $template = Template::findOrFail($templateId);

        return response()->json([
            'previewUrl' => $template->preview_url
                ?? "https://via.placeholder.com/800x600/4f46e5/ffffff?text=Preview+{$templateId}",
        ]);
    }
}
