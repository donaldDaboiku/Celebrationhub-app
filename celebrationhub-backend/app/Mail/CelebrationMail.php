<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class CelebrationMail extends Mailable
{
    use Queueable, SerializesModels;

    public $user;
    public $messageText;

    /**
     * Create a new message instance.
     */
    public function __construct($user, $messageText)
    {
        $this->user = $user;
        $this->messageText = $messageText;
    }

    /**
     * Build the message.
     */
    public function build()
    {
        return $this->subject($this->messageText)
                    ->markdown('emails.celebration')
                    ->with([
                        'name' => $this->user->name,
                        'messageText' => $this->messageText,
                    ]);
    }
}
