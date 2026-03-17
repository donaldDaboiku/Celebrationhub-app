<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Celebration</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 32px;
        }
        .content {
            padding: 40px 20px;
            text-align: center;
        }
        .content p {
            font-size: 18px;
            color: #333;
            margin-bottom: 20px;
        }
        .design-image {
            max-width: 100%;
            height: auto;
            border-radius: 10px;
            margin: 20px 0;
        }
        .footer {
            background: #f9f9f9;
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Celebration! 🎉</h1>
        </div>
        
        <div class="content">
            <p>Dear {{ $name }},</p>
            
            <p>{!! nl2br(e($message)) !!}</p>
            
            @if($designUrl)
            <img src="{{ $designUrl }}" alt="Celebration Design" class="design-image">
            @endif
            
            <p style="margin-top: 30px;">
                <strong>With love and prayers,<br>
                Your Church Family 💙</strong>
            </p>
        </div>
        
        <div class="footer">
            <p>This is an automated message from CelebrationHub</p>
            <p>Powered by CelebrationHub</p>
        </div>
    </div>
</body>
</html>