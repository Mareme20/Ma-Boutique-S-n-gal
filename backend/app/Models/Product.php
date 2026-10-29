<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class Product extends Model {
    protected $guarded = [];
    protected $casts = ['active' => 'boolean'];
    public function orderItems() { return $this->hasMany(OrderItem::class); }
    public function shop(): BelongsTo { return $this->belongsTo(Shop::class); }
}
