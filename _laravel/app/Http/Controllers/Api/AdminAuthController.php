<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\AdminUser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Services\AdminAuditService;
use Illuminate\Support\Str;

class AdminAuthController extends Controller {
    public function login(Request $request) {
        if($request->has('email')) $request->merge(['email'=>strtolower(trim($request->input('email')))]);
        $data = $request->validate(['email' => 'required|email', 'password' => 'required|string']);
        $user = AdminUser::where('email', $data['email'])->first();
        if (!$user || !$user->active || !Hash::check($data['password'], $user->password)) {
            return response()->json(['message' => 'Identifiants invalides'], 401);
        }
        $user->tokens()->where('expires_at','<=',now())->delete();
        $token = Str::random(64);
        $user->tokens()->create(['token_hash' => hash('sha256', $token), 'expires_at' => now()->addHours(12)]);
        return response()->json(['token' => $token, 'expires_at' => now()->addHours(12), 'user' => $user->only(['id','name','email','role'])]);
    }
    public function logout(Request $request) {
        AdminAuditService::record($request,'logout','admin_user',$request->attributes->get('admin_user')->id);
        $request->attributes->get('admin_token')?->delete();
        return response()->json(['ok' => true]);
    }
    public function me(Request $request) { return $request->attributes->get('admin_user')->only(['id','name','email','role']); }
    public function changePassword(Request $request) {
        $data=$request->validate(['current_password'=>'required|string','password'=>'required|string|min:12|confirmed']);
        $user=$request->attributes->get('admin_user');
        if(!Hash::check($data['current_password'],$user->password)) return response()->json(['message'=>'Mot de passe actuel incorrect.'],422);
        $user->update(['password'=>Hash::make($data['password'])]);
        $user->tokens()->where('id','!=',$request->attributes->get('admin_token')->id)->delete();
        AdminAuditService::record($request,'password_changed','admin_user',$user->id);
        return response()->json(['ok'=>true]);
    }
}
