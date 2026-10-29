<?php
namespace App\Services;
use Illuminate\Support\Facades\{Http, Log};

class WhatsappService {
    public function send(string $phone, string $message): void {
        $config=config('shop.whatsapp');
        if (!$config['token'] || !$config['phone_id'] || !$config['template']) return;
        $response=Http::withToken($config['token'])->asJson()->timeout(15)->post(
            "https://graph.facebook.com/{$config['version']}/{$config['phone_id']}/messages",
            ['messaging_product'=>'whatsapp','to'=>preg_replace('/\D/','',$phone),'type'=>'template','template'=>['name'=>$config['template'],'language'=>['code'=>'fr'],'components'=>[['type'=>'body','parameters'=>[['type'=>'text','text'=>$message]]]]]]
        );
        if($response->failed()) { Log::error('WhatsApp notification failed',['status'=>$response->status()]); $response->throw(); }
    }
}
