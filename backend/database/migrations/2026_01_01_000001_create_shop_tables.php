<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('products', function (Blueprint $t) {
            $t->id();
            $t->string('name');
            $t->string('slug')->unique();
            $t->text('description')->nullable();
            $t->unsignedInteger('price');           // FCFA, entier
            $t->unsignedInteger('stock')->default(0);
            $t->string('image_url')->nullable();
            $t->boolean('active')->default(true);
            $t->timestamps();
        });
        Schema::create('orders', function (Blueprint $t) {
            $t->id();
            $t->string('reference', 30)->unique();
            $t->string('customer_name');
            $t->string('customer_phone', 20)->index();   // E.164 +221...
            $t->string('region', 100);
            $t->string('ville_quartier');
            $t->text('points_repere');
            $t->string('delivery_method', 50)->default('moto_express');
            $t->unsignedInteger('subtotal');
            $t->unsignedInteger('delivery_fee');
            $t->unsignedInteger('total_amount');
            $t->enum('payment_method', ['wave', 'orange_money', 'cod']);
            $t->enum('status', ['pending','paid','assigned','delivered','failed','cancelled'])->default('pending')->index();
            $t->string('transaction_ref')->nullable()->unique();
            $t->timestamp('paid_at')->nullable();
            $t->timestamps();
        });
        Schema::create('order_items', function (Blueprint $t) {
            $t->id();
            $t->foreignId('order_id')->constrained()->cascadeOnDelete();
            $t->foreignId('product_id')->constrained();
            $t->string('product_name');
            $t->unsignedInteger('quantity');
            $t->unsignedInteger('unit_price');
        });
        Schema::create('order_status_history', function (Blueprint $t) {
            $t->id();
            $t->foreignId('order_id')->constrained()->cascadeOnDelete();
            $t->string('status');
            $t->text('note')->nullable();
            $t->timestamp('created_at')->useCurrent();
        });
        Schema::create('webhook_events', function (Blueprint $t) {  // idempotence + logs
            $t->id();
            $t->string('provider');
            $t->string('event_key')->unique();
            $t->json('payload');
            $t->timestamps();
        });
    }
    public function down(): void {
        foreach (['webhook_events','order_status_history','order_items','orders','products'] as $x) Schema::dropIfExists($x);
    }
};
