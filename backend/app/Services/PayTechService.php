<?php
namespace App\Services;
use App\Models\Order;
use Illuminate\Support\Facades\Http;

class PayTechService {
    /** Crée la demande de paiement et retourne l'URL de redirection. */
    public function createPayment(Order $order, string $trackingToken): string {
        $cfg = config('shop.paytech');
        $res = Http::withHeaders(['API_KEY' => $cfg['key'], 'API_SECRET' => $cfg['secret']])
            ->timeout(15)->asJson()
            ->post('https://paytech.sn/api/payment/request-payment', [
                'item_name'      => 'Commande '.$order->reference,
                'item_price'     => $order->total_amount,
                'currency'       => 'XOF',
                'ref_command'    => $order->reference,
                'command_name'   => 'Paiement '.$order->reference,
                'env'            => $cfg['env'],
                'ipn_url'        => url('/api/v1/payments/webhook'),
                'success_url'    => config('shop.frontend_url').'/suivi?reference='.urlencode($order->reference).'&token='.urlencode($trackingToken),
                'cancel_url'     => config('shop.frontend_url').'/suivi?reference='.urlencode($order->reference).'&token='.urlencode($trackingToken),
                'target_payment' => $order->payment_method === 'wave' ? 'Wave' : 'Orange Money',
            ])->throw()->json();

        if (($res['success'] ?? 0) != 1 || empty($res['redirect_url'])) {
            throw new \RuntimeException('PayTech: '.json_encode($res));
        }
        $order->update(['transaction_ref' => $res['token'] ?? null]);
        return $res['redirect_url'];
    }

    /** PayTech envoie sha256(API_KEY) et sha256(API_SECRET) dans l'IPN. */
    public function verifyIpn(array $p): bool {
        $cfg = config('shop.paytech');
        return !empty($p['api_key_sha256']) && !empty($p['api_secret_sha256'])
            && hash_equals(hash('sha256', (string) $cfg['key']), (string) $p['api_key_sha256'])
            && hash_equals(hash('sha256', (string) $cfg['secret']), (string) $p['api_secret_sha256']);
    }
}
