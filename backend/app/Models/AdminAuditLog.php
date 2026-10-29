<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class AdminAuditLog extends Model { protected $guarded=[]; public $timestamps=false; protected $casts=['details'=>'array','created_at'=>'datetime']; public function admin() { return $this->belongsTo(AdminUser::class,'admin_user_id'); } }
