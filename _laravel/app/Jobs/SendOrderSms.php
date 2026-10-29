<?php
namespace App\Jobs;
use App\Models\Order;
use App\Services\{SmsService, WhatsappService};
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendOrderSms implements ShouldQueue {
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;
    public int $tries = 3;
    public array $backoff = [30, 120];
    public function __construct(public Order $order, public string $event) {}
    public function handle(SmsService $sms, WhatsappService $whatsapp): void {
        $o = $this->order; $t = number_format($o->total_amount, 0, ',', ' ').' FCFA';
        $refunded = number_format($o->refunded_amount, 0, ',', ' ').' FCFA';
        $msg = match ($this->event) {
            'created'   => "Merci {$o->customer_name} ! Commande {$o->reference} recue ({$t}). ".($o->payment_method === 'cod' ? 'Nous vous appelons pour confirmer.' : 'Finalisez le paiement.'),
            'paid'      => "Paiement recu pour la commande {$o->reference} ({$t}). Livraison en preparation.",
            'assigned'  => "Votre commande {$o->reference} est confiee a un livreur. Gardez votre telephone a portee.",
            'delivered' => "Commande {$o->reference} livree. Merci pour votre confiance !",
            'preparing' => "Votre commande {$o->reference} est en préparation.",
            'ready'     => "Votre commande {$o->reference} est prête pour l'expédition.",
            'shipped'   => "Votre commande {$o->reference} est en route vers vous.",
            'cancelled' => "Votre commande {$o->reference} a été annulée. Contactez-nous pour toute question.",
            'failed'    => "Le paiement de la commande {$o->reference} n'a pas abouti. Le stock a été remis en vente.",
            'refunded'  => "Le remboursement de {$refunded} pour la commande {$o->reference} a été enregistré.",
            default     => null,
        };
        if ($msg) { $sms->send($o->customer_phone, $msg); $whatsapp->send($o->customer_phone, $msg); }
    }
}
