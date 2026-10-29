<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Coupon extends Model {
    protected $guarded = [];
    protected $casts = ['active' => 'boolean', 'starts_at' => 'datetime', 'ends_at' => 'datetime'];
}
