<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('shops', function(Blueprint $t) {
            $t->id(); $t->string('name'); $t->string('slug')->unique(); $t->string('city',100)->default('Dakar');
            $t->string('whatsapp',30)->default('221770000000'); $t->string('address')->nullable(); $t->text('description')->nullable();
            $t->string('image_url')->nullable(); $t->boolean('active')->default(true); $t->timestamps();
        });
        Schema::table('products', function(Blueprint $t) { $t->foreignId('shop_id')->nullable()->constrained('shops')->nullOnDelete(); });
        Schema::table('orders', function(Blueprint $t) { $t->foreignId('shop_id')->nullable()->constrained('shops')->nullOnDelete(); });
    }
    public function down(): void {
        Schema::table('orders', function(Blueprint $t) { $t->dropConstrainedForeignId('shop_id'); });
        Schema::table('products', function(Blueprint $t) { $t->dropConstrainedForeignId('shop_id'); });
        Schema::dropIfExists('shops');
    }
};
