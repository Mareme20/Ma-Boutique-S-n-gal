<?php
namespace App\Services;
use Illuminate\Support\Facades\{Cache, Http, Log};

/** Orange SMS API (Sénégal). Remplaçable par Hub2/Twilio sans toucher au reste. */
class SmsService {
    private function token(): string {
        return Cache::remember('orange_sms_token', 3000, function () {
            $c = config('shop.sms');
            return Http::withBasicAuth($c['client_id'], $c['client_secret'])->asForm()
                ->post('https://api.orange.com/oauth/v3/token', ['grant_type' => 'client_credentials'])
                ->throw()->json('access_token');
        });
    }
    public function send(string $phone, string $message): void {
        $credentials=config('shop.sms');
        if (!$credentials['client_id'] || !$credentials['client_secret'] || !$credentials['sender']) return;
        $sender = config('shop.sms.sender');
        $res = Http::withToken($this->token())->asJson()->post(
            'https://api.orange.com/smsmessaging/v1/outbound/'.rawurlencode('tel:'.$sender).'/requests',
            ['outboundSMSMessageRequest' => [
                'address' => 'tel:'.$phone,
                'senderAddress' => 'tel:'.$sender,
                'outboundSMSTextMessage' => ['message' => $message],
            ]]
        );
        if ($res->failed()) { Log::error('SMS failed', ['phone' => $phone, 'body' => $res->body()]); $res->throw(); }
    }
}
