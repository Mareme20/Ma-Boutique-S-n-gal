<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('tracking_token_hash', 64)->nullable()->index();
            $table->timestamp('expires_at')->nullable()->index();
        });
    }
    public function down(): void {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['tracking_token_hash', 'expires_at']);
        });
    }
};
