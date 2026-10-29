<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class AdminUser extends Model {
    protected $table = 'admin_users';
    protected $guarded = [];
    protected $hidden = ['password'];
    protected $casts = ['active' => 'boolean'];
    public function tokens() { return $this->hasMany(AdminApiToken::class); }
}
