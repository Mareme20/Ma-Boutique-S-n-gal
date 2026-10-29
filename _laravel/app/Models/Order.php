<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
class Order extends Model {
    protected $guarded = [];
    protected $casts = ['paid_at' => 'datetime', 'expires_at' => 'datetime'];
    public function items() { return $this->hasMany(OrderItem::class); }
    public function shop() { return $this->belongsTo(Shop::class); }
    public function deliveryHistory() { return $this->hasMany(OrderDeliveryHistory::class); }
    public function setStatus(string $status, ?string $note = null): void {
        $this->update(['status' => $status]);
        DB::table('order_status_history')->insert(['order_id' => $this->id, 'status' => $status, 'note' => $note, 'created_at' => now()]);
    }

    /** Restore reserved inventory once when an unpaid order is closed. */
    public function releaseReservedStock(string $status, string $note): void {
        DB::transaction(function () use ($status, $note) {
            $order = self::query()->lockForUpdate()->with('items')->findOrFail($this->id);
            if ($order->status !== 'pending') return;
            foreach ($order->items as $item) {
                Product::whereKey($item->product_id)->lockForUpdate()->increment('stock', $item->quantity);
            }
            if ($order->coupon_id) Coupon::whereKey($order->coupon_id)->where('used_count', '>', 0)->decrement('used_count');
            $order->setStatus($status, $note);
            $this->refresh();
        });
    }
}
