<?php
namespace App\Http\Middleware;
use Closure;
use Illuminate\Http\Request;
use App\Models\AdminApiToken;
class AdminToken {
    public function handle(Request $r, Closure $next, ...$roles) {
        $raw = (string) $r->bearerToken();
        $token = $raw === '' ? null : AdminApiToken::with('user')->where('token_hash', hash('sha256', $raw))->where('expires_at', '>', now())->first();
        if (!$token || !$token->user->active) abort(401);
        if ($roles && !in_array($token->user->role, $roles, true)) abort(403);
        $r->attributes->set('admin_user', $token->user);
        $r->attributes->set('admin_token', $token);
        return $next($r);
    }
}
