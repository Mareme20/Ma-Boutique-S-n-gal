<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('admin_users', function (Blueprint $table) {
            $table->id(); $table->string('name'); $table->string('email')->unique();
            $table->string('password'); $table->enum('role', ['owner','manager','logistics'])->default('manager');
            $table->boolean('active')->default(true); $table->timestamps();
        });
        Schema::create('admin_api_tokens', function (Blueprint $table) {
            $table->id(); $table->foreignId('admin_user_id')->constrained('admin_users')->cascadeOnDelete();
            $table->char('token_hash', 64)->unique(); $table->timestamp('expires_at'); $table->timestamps();
        });
        Schema::create('admin_audit_logs', function (Blueprint $table) {
            $table->id(); $table->foreignId('admin_user_id')->nullable()->constrained('admin_users')->nullOnDelete();
            $table->string('action', 100); $table->string('subject_type', 100)->nullable(); $table->unsignedBigInteger('subject_id')->nullable();
            $table->json('details')->nullable(); $table->string('ip_address', 45)->nullable(); $table->timestamp('created_at')->useCurrent();
            $table->index(['subject_type','subject_id']);
        });
        Schema::create('coupons', function (Blueprint $table) {
            $table->id(); $table->string('code', 40)->unique(); $table->enum('discount_type', ['percent','fixed']);
            $table->unsignedInteger('discount_value'); $table->unsignedInteger('minimum_order')->default(0);
            $table->unsignedInteger('usage_limit')->nullable(); $table->unsignedInteger('used_count')->default(0);
            $table->timestamp('starts_at')->nullable(); $table->timestamp('ends_at')->nullable();
            $table->boolean('active')->default(true); $table->timestamps();
        });
        Schema::table('products', function (Blueprint $table) { $table->unsignedInteger('low_stock_threshold')->default(5); });
        Schema::table('orders', function (Blueprint $table) {
            $table->foreignId('coupon_id')->nullable()->constrained('coupons')->nullOnDelete();
            $table->string('coupon_code', 40)->nullable(); $table->unsignedInteger('discount_amount')->default(0);
            $table->string('delivery_status', 30)->default('unprepared')->index();
            $table->string('refund_status', 30)->default('none')->index();
            $table->unsignedInteger('refunded_amount')->default(0); $table->timestamp('refunded_at')->nullable();
        });
        Schema::create('order_delivery_history', function (Blueprint $table) {
            $table->id(); $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->string('status', 30); $table->text('note')->nullable(); $table->foreignId('admin_user_id')->nullable()->constrained('admin_users')->nullOnDelete();
            $table->timestamp('created_at')->useCurrent();
        });
    }
    public function down(): void {
        Schema::dropIfExists('order_delivery_history');
        Schema::dropIfExists('admin_audit_logs');
        Schema::table('orders', function (Blueprint $table) {
            $table->dropConstrainedForeignId('coupon_id');
            $table->dropColumn(['coupon_code','discount_amount','delivery_status','refund_status','refunded_amount','refunded_at']);
        });
        Schema::table('products', function (Blueprint $table) { $table->dropColumn('low_stock_threshold'); });
        Schema::dropIfExists('coupons'); Schema::dropIfExists('admin_api_tokens'); Schema::dropIfExists('admin_users');
    }
};
