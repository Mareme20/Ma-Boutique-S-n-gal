<?php
use App\Http\Controllers\Api\{AdminAuthController, AdminController, ManagementController, OrderController, ProductController, WebhookController};
use App\Http\Middleware\AdminToken;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('admin/login', [AdminAuthController::class, 'login'])->middleware('throttle:5,1');
    Route::post('coupons/validate', [ManagementController::class, 'validateCoupon'])->middleware('throttle:20,1');
    Route::get('products', [ProductController::class, 'index']);
    Route::get('products/{slug}', [ProductController::class, 'show']);
    Route::get('shops', [AdminController::class, 'shops']);

    Route::post('orders', [OrderController::class, 'store'])->middleware('throttle:10,1');
    Route::get('orders/{reference}', [OrderController::class, 'show'])->middleware('throttle:60,1');

    Route::post('payments/webhook', [WebhookController::class, 'paytech']);

    Route::prefix('admin')->middleware(AdminToken::class)->group(function () {
        Route::post('logout', [AdminAuthController::class, 'logout']);
        Route::get('me', [AdminAuthController::class, 'me']);
        Route::post('password', [AdminAuthController::class, 'changePassword']);
        Route::get('users', [ManagementController::class, 'admins'])->middleware(AdminToken::class.':owner');
        Route::post('users', [ManagementController::class, 'createAdmin'])->middleware(AdminToken::class.':owner');
        Route::patch('users/{adminUser}', [ManagementController::class, 'updateAdmin'])->middleware(AdminToken::class.':owner');
        Route::patch('users/{adminUser}/password', [ManagementController::class, 'resetAdminPassword'])->middleware(AdminToken::class.':owner');
        Route::get('audit-logs', [ManagementController::class, 'auditLogs'])->middleware(AdminToken::class.':owner');
        Route::get('orders', [AdminController::class, 'index']);
        Route::patch('orders/{order}/status', [AdminController::class, 'updateStatus'])->middleware(AdminToken::class.':owner,manager');
        Route::get('orders-export', [AdminController::class, 'export']);
        Route::get('shops', [AdminController::class, 'shops']);
        Route::get('products', [AdminController::class, 'products'])->middleware(AdminToken::class.':owner,manager');
        Route::post('products', [AdminController::class, 'createProduct'])->middleware(AdminToken::class.':owner,manager');
        Route::patch('products/{product}', [AdminController::class, 'updateProduct'])->middleware(AdminToken::class.':owner,manager');
        Route::delete('products/{product}', [AdminController::class, 'deleteProduct'])->middleware(AdminToken::class.':owner,manager');
        Route::post('upload-image', [AdminController::class, 'uploadImage'])->middleware(AdminToken::class.':owner,manager');
        Route::patch('orders/{order}/delivery', [ManagementController::class, 'delivery']);
        Route::patch('orders/{order}/refund', [ManagementController::class, 'refund'])->middleware(AdminToken::class.':owner');
        Route::get('metrics', [ManagementController::class, 'metrics'])->middleware(AdminToken::class.':owner,manager');
        Route::get('low-stock', [ManagementController::class, 'lowStock'])->middleware(AdminToken::class.':owner,manager');
        Route::get('coupons', [ManagementController::class, 'coupons'])->middleware(AdminToken::class.':owner,manager');
        Route::post('coupons', [ManagementController::class, 'saveCoupon'])->middleware(AdminToken::class.':owner,manager');
        Route::patch('coupons/{coupon}', [ManagementController::class, 'saveCoupon'])->middleware(AdminToken::class.':owner,manager');
        Route::delete('coupons/{coupon}', [ManagementController::class, 'deleteCoupon'])->middleware(AdminToken::class.':owner,manager');
    });
});
