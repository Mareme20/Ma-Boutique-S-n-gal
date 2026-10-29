<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Shop extends Model {
    protected $guarded=[];
    protected $casts=['active'=>'boolean'];
    public function products() { return $this->hasMany(Product::class); }
    public function orders() { return $this->hasMany(Order::class); }
}
