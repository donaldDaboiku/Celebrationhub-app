<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

   'termii' => [
        'api_key' => env('TERMII_API_KEY'),
        'sender_id' => env('TERMII_SENDER_ID', 'CelebHub'),
        'base_url' => 'https://api.ng.termii.com/api',
    ],

    'whatsapp_meta' => [
        'phone_number_id' => env('WHATSAPP_PHONE_NUMBER_ID'),
        'business_account_id' => env('WHATSAPP_BUSINESS_ACCOUNT_ID'),
        'access_token' => env('WHATSAPP_ACCESS_TOKEN'),
    ],

    'facebook' => [
        'page_id' => env('FACEBOOK_PAGE_ID'),
        'page_access_token' => env('FACEBOOK_PAGE_ACCESS_TOKEN'),
    ],

    'instagram' => [
        'business_account_id' => env('INSTAGRAM_BUSINESS_ACCOUNT_ID'),
        'access_token' => env('INSTAGRAM_ACCESS_TOKEN'),
    ],

    'telegram' => [
        'bot_token' => env('TELEGRAM_BOT_TOKEN'),
        'chat_id' => env('TELEGRAM_CHAT_ID'),
    ],

    'x' => [
        'api_key' => env('X_API_KEY'),
        'api_secret' => env('X_API_SECRET'),
        'access_token' => env('X_ACCESS_TOKEN'),
        'access_token_secret' => env('X_ACCESS_TOKEN_SECRET'),
    ],

    'paystack' => [
    'public_key' => env('PAYSTACK_PUBLIC_KEY'),
    'secret_key' => env('PAYSTACK_SECRET_KEY'),
    ],
];
