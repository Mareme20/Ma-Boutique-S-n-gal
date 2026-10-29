<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class AdminApiToken extends Model {
    protected $guarded = [];
    protected $casts = ['expires_at' => 'datetime'];
    public function user() { return $this->belongsTo(AdminUser::class, 'admin_user_id'); }
}
