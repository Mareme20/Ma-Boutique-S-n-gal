<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Jobs\SendOrderSms;
use App\Models\Order;
use App\Services\PayTechService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WebhookController extends Controller {
    public function paytech(Request $r, PayTechService $paytech) {
        $p = $r->all();
        if (!$paytech->verifyIpn($p)) return response()->json(['error' => 'invalid signature'], 403);

        $ref = $p['ref_command'] ?? null; $type = $p['type_event'] ?? '';
        $order = Order::where('reference', $ref)->first();
        if (!$order) return response()->json(['ok' => true]);               // inconnu : on acquitte

        // Idempotence : un même événement n'est traité qu'une fois
        $key = 'paytech:'.$ref.':'.$type;
        $new = DB::table('webhook_events')->insertOrIgnore([
            'provider' => 'paytech', 'event_key' => $key, 'payload' => json_encode($p), 'created_at' => now(), 'updated_at' => now(),
        ]);
        if (!$new) return response()->json(['ok' => true, 'duplicate' => true]);

        if ($type === 'sale_complete') {
            if ((int) ($p['item_price'] ?? 0) !== $order->total_amount) {   // contrôle du montant
                $order->releaseReservedStock('failed', 'Montant reçu différent, stock remis en vente');
                if ($order->fresh()->status === 'failed') SendOrderSms::dispatch($order->fresh(), 'failed');
                return response()->json(['error' => 'amount mismatch'], 422);
            }
            if ($order->expires_at && $order->expires_at->isPast()) {
                $order->releaseReservedStock('failed', 'Paiement reçu après expiration, stock remis en vente');
                return response()->json(['error' => 'payment expired'], 422);
            }
            $paid = DB::transaction(function () use ($order) {
                $locked = Order::whereKey($order->id)->lockForUpdate()->first();
                if (!$locked || $locked->status !== 'pending' || ($locked->expires_at && $locked->expires_at->isPast())) return false;
                $locked->update(['paid_at' => now()]);
                $locked->setStatus('paid', 'Paiement confirmé');
                return true;
            });
            if ($paid) SendOrderSms::dispatch($order, 'paid');
        } elseif ($type === 'sale_canceled' && $order->status === 'pending') {
            $order->releaseReservedStock('failed', 'Paiement annulé, stock remis en vente');
            if ($order->fresh()->status === 'failed') SendOrderSms::dispatch($order->fresh(), 'failed');
        }
        return response()->json(['ok' => true]);
    }
}
