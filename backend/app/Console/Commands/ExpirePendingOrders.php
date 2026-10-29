<?php
namespace App\Console\Commands;

use App\Models\Order;
use App\Jobs\SendOrderSms;
use Illuminate\Console\Command;

class ExpirePendingOrders extends Command {
    protected $signature = 'shop:expire-orders';
    protected $description = 'Expire unpaid mobile money orders and restore reserved stock';

    public function handle(): int {
        Order::where('status', 'pending')->whereNotNull('expires_at')->where('expires_at', '<=', now())
            ->orderBy('id')->chunkById(100, function ($orders) {
                foreach ($orders as $order) {
                    $order->releaseReservedStock('failed', 'Délai de paiement dépassé, stock remis en vente');
                    if ($order->fresh()->status === 'failed') SendOrderSms::dispatch($order->fresh(), 'failed');
                }
            });
        return self::SUCCESS;
    }
}
