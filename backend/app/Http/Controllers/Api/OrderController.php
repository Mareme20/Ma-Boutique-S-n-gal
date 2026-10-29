<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOrderRequest;
use App\Jobs\SendOrderSms;
use App\Models\{Coupon, Order, Product};
use App\Services\PayTechService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderController extends Controller {
    public function store(StoreOrderRequest $req, PayTechService $paytech) {
        $d = $req->validated();
        $trackingToken = Str::random(64);

        $order = DB::transaction(function () use ($d, $trackingToken) {
            $subtotal = 0; $lines = []; $shopIds = [];
            foreach ($d['items'] as $it) {
                $p = Product::lockForUpdate()->findOrFail($it['product_id']);   // prix et stock lus côté serveur
                abort_if(!$p->active || $p->stock < $it['quantity'], 422, "Stock insuffisant : {$p->name}");
                $p->decrement('stock', $it['quantity']);
                $subtotal += $p->price * $it['quantity'];
                if ($p->shop_id) $shopIds[] = $p->shop_id;
                $lines[] = ['product_id' => $p->id, 'product_name' => $p->name, 'quantity' => $it['quantity'], 'unit_price' => $p->price];
            }
            $fees = config('shop.delivery_fees');
            $fee = $fees[$d['region']] ?? $fees['Autre'];
            $coupon = null; $discount = 0;
            if (!empty($d['coupon_code'])) {
                $coupon = Coupon::where('code', strtoupper(trim($d['coupon_code'])))->lockForUpdate()->first();
                abort_unless($coupon && $coupon->active && (!$coupon->starts_at || $coupon->starts_at->isPast())
                    && (!$coupon->ends_at || $coupon->ends_at->isFuture()) && (!$coupon->usage_limit || $coupon->used_count < $coupon->usage_limit)
                    && $subtotal >= $coupon->minimum_order, 422, 'Code promo invalide ou non applicable.');
                $discount = $coupon->discount_type === 'percent' ? (int) floor($subtotal * min(100,$coupon->discount_value) / 100) : min($subtotal,$coupon->discount_value);
                $coupon->increment('used_count');
            }

            $order = Order::create([
                'reference' => 'CMD-'.now()->format('Ymd').'-'.strtoupper(Str::random(5)),
                'customer_name' => $d['customer_name'], 'customer_phone' => $d['customer_phone'],
                'region' => $d['region'], 'ville_quartier' => $d['ville_quartier'], 'points_repere' => $d['points_repere'],
                'subtotal' => $subtotal, 'delivery_fee' => $fee, 'discount_amount' => $discount, 'total_amount' => $subtotal + $fee - $discount,
                'coupon_id' => $coupon?->id, 'coupon_code' => $coupon?->code,
                'payment_method' => $d['payment_method'],
                'shop_id' => count(array_unique($shopIds)) === 1 ? $shopIds[0] : null,
                'tracking_token_hash' => hash('sha256', $trackingToken),
                'expires_at' => $d['payment_method'] === 'cod'
                    ? null : now()->addMinutes(config('shop.payment_order_expiration_minutes', 30)),
            ]);
            $order->items()->createMany($lines);
            $order->setStatus('pending', 'Commande créée');
            DB::table('order_delivery_history')->insert(['order_id'=>$order->id,'status'=>'unprepared','note'=>'Commande reçue','created_at'=>now()]);
            return $order;
        });

        SendOrderSms::dispatch($order, 'created');

        if ($order->payment_method === 'cod') {
            return response()->json(['reference' => $order->reference, 'tracking_token' => $trackingToken, 'payment_url' => null], 201);
        }
        try {
            $url = $paytech->createPayment($order, $trackingToken);
        } catch (\Throwable $e) {
            report($e);
            return response()->json(['reference' => $order->reference, 'tracking_token' => $trackingToken, 'payment_url' => null,
                'message' => 'Paiement indisponible, nous vous contactons.'], 201);
        }
        return response()->json(['reference' => $order->reference, 'tracking_token' => $trackingToken, 'payment_url' => $url], 201);
    }

    public function show(\Illuminate\Http\Request $request, string $reference) {
        $token = (string) $request->query('token');
        $o = Order::with('items')->where('reference', $reference)->firstOrFail();
        abort_unless($token !== '' && hash_equals((string) $o->tracking_token_hash, hash('sha256', $token)), 404);
        return $o->load('deliveryHistory')->only(['reference','status','total_amount','delivery_fee','discount_amount','coupon_code','payment_method','delivery_status','created_at','expires_at']) + ['items' => $o->items, 'delivery_history' => $o->deliveryHistory];
    }
}
