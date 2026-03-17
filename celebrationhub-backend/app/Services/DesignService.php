<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class DesignService
{
    protected $manager;

    public function __construct()
    {
        $this->manager = new ImageManager(new Driver());
    }

    /**
     * Generate celebration card
     */
    public function generateCard(
        string $type,
        string $title,
        string $name,
        ?string $photoUrl = null
    ): string {
        try {
            // Load template
            $templatePath = $this->getTemplatePath($type);

            // Check if template exists
            if (!file_exists($templatePath)) {
                // Create a simple colored background as fallback
                $image = $this->manager->create(1080, 1080)
                    ->fill('#667eea');
            } else {
                $image = $this->manager->read($templatePath);
            }

            // Add text - Name (centered, near bottom)
            $fullName = trim($title . ' ' . $name);

            // For now, we'll create a simple design
            // You can enhance this later with custom fonts and positioning

            // Save to storage
            $filename = 'designs/' . Str::random(40) . '.png';
            $path = storage_path('app/public/' . $filename);

            // Ensure directory exists
            $directory = dirname($path);
            if (!file_exists($directory)) {
                mkdir($directory, 0755, true);
            }

            $image->save($path);

            // Return public URL
            return asset('storage/' . $filename);
        } catch (\Exception $e) {
            Log::error('Design generation failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            // Return placeholder image
            return 'https://via.placeholder.com/1080x1080/667eea/ffffff?text=' . urlencode($name);
        }
    }

    /**
     * Get template path based on celebration type
     */
    protected function getTemplatePath(string $type): string
    {
        $templates = [
            'birthday' => public_path('templates/birthday-template.png'),
            'anniversary' => public_path('templates/anniversary-template.png'),
        ];

        return $templates[$type] ?? $templates['birthday'];
    }
}
