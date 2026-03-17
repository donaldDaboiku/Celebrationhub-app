<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class TemplateController extends Controller
{
    public function index()
    {
        // For now, return hardcoded templates
        // Later, you can store these in a database
        
        $templates = [
            [
                'id' => 1,
                'name' => 'Classic Blue Birthday',
                'type' => 'birthday',
                'description' => 'Timeless blue design with balloons',
                'previewUrl' => 'https://via.placeholder.com/600x400/4f46e5/ffffff?text=Classic+Blue',
                'backgroundUrl' => '/storage/templates/classic-blue-bg.png',
                'isPublic' => true
            ],
            [
                'id' => 2,
                'name' => 'Elegant Purple',
                'type' => 'birthday',
                'description' => 'Sophisticated purple theme',
                'previewUrl' => 'https://via.placeholder.com/600x400/9333ea/ffffff?text=Elegant+Purple',
                'backgroundUrl' => '/storage/templates/elegant-purple-bg.png',
                'isPublic' => true
            ],
            [
                'id' => 5,
                'name' => 'Golden Anniversary',
                'type' => 'anniversary',
                'description' => 'Luxurious gold design for anniversaries',
                'previewUrl' => 'https://via.placeholder.com/600x400/fbbf24/ffffff?text=Golden+Anniversary',
                'backgroundUrl' => '/storage/templates/golden-anniversary-bg.png',
                'isPublic' => true
            ]
        ];
        
        // Get user's organization settings
        // $org = auth()->user()->organization;
        
        return response()->json([
            'templates' => $templates,
            'currentDefaults' => [
                'birthday' => 1, // You'll store this in organization settings
                'anniversary' => 5
            ]
        ]);
    }
    
    public function setDefault($templateId, Request $request)
    {
        $request->validate([
            'type' => 'required|in:birthday,anniversary'
        ]);
        
        $type = $request->input('type');
        
        // Later: Update organization settings
        // $org = auth()->user()->organization;
        // $settings = $org->settings ?? [];
        // $settings["default_{$type}_template"] = $templateId;
        // $org->settings = $settings;
        // $org->save();
        
        return response()->json([
            'success' => true,
            'message' => "Template set as default for {$type}s"
        ]);
    }
    
    public function preview($templateId)
    {
        // Later: Generate actual preview with member data
        
        return response()->json([
            'previewUrl' => "https://via.placeholder.com/800x600/4f46e5/ffffff?text=Preview+Template+{$templateId}"
        ]);
    }
}