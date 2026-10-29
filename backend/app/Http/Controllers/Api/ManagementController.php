<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\{AdminAuditLog, AdminUser, Coupon, Order, Product};
use App\Jobs\SendOrderSms;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Services\AdminAuditService;

class ManagementController extends Controller {
    public function admins() { return AdminUser::orderBy('name')->get(['id','name','email','role','active','created_at']); }
    public function createAdmin(Request $request) {
        if($request->has('email')) $request->merge(['email'=>strtolower(trim($request->input('email')))]);
        $data=$request->validate(['name'=>'required|string|max:120','email'=>'required|email|max:255|unique:admin_users,email','role'=>'required|in:owner,manager,logistics','password'=>'required|string|min:12']);
        $data['password']=Hash::make($data['password']); $user=AdminUser::create($data);
        AdminAuditService::record($request,'admin_created','admin_user',$user->id,['email'=>$user->email,'role'=>$user->role]);
        return $user->only(['id','name','email','role','active','created_at']);
    }
    public function updateAdmin(Request $request, AdminUser $adminUser) {
        $data=$request->validate(['name'=>'sometimes|required|string|max:120','role'=>'sometimes|required|in:owner,manager,logistics','active'=>'sometimes|required|boolean']);
        if($adminUser->id===$request->attributes->get('admin_user')->id && ($data['active']??true)===false) return response()->json(['message'=>'Vous ne pouvez pas désactiver votre propre compte.'],422);
        $adminUser->update($data); if(array_key_exists('active',$data) && !$data['active']) $adminUser->tokens()->delete();
        AdminAuditService::record($request,'admin_updated','admin_user',$adminUser->id,$data);
        return $adminUser->fresh()->only(['id','name','email','role','active','created_at']);
    }
    public function resetAdminPassword(Request $request, AdminUser $adminUser) {
        $data=$request->validate(['password'=>'required|string|min:12']);
        $adminUser->update(['password'=>Hash::make($data['password'])]); $adminUser->tokens()->delete();
        AdminAuditService::record($request,'admin_password_reset','admin_user',$adminUser->id);
        return response()->json(['ok'=>true]);
    }
    public function auditLogs() { return AdminAuditLog::with('admin:id,name,email')->orderByDesc('id')->limit(200)->get(); }
    public function lowStock(Request $request) { return Product::where('active', true)->when($request->shop_id,fn($q,$id)=>$q->where('shop_id',$id))->whereColumn('stock', '<=', 'low_stock_threshold')->orderBy('stock')->get(['id','name','stock','low_stock_threshold']); }
    public function metrics(Request $request) {
        $shopFilter=fn($q,$id)=>$q->where(fn($sq)=>$sq->where('shop_id',$id)->orWhereHas('items.product',fn($pq)=>$pq->where('shop_id',$id)));
        $revenue=Order::where(fn($q)=>$q->where(fn($paid)=>$paid->whereIn('status',['paid','assigned'])->where('payment_method','!=','cod'))->orWhere('status','delivered'))
            ->when($request->shop_id,$shopFilter)->sum('total_amount');
        $refunds=Order::when($request->shop_id,$shopFilter)->sum('refunded_amount');
        return [
            'orders' => Order::when($request->shop_id,$shopFilter)->count(), 'open_orders' => Order::whereIn('status', ['pending','paid','assigned'])->when($request->shop_id,$shopFilter)->count(),
            'delivered' => Order::where('status','delivered')->when($request->shop_id,$shopFilter)->count(),
            'revenue' => $revenue-$refunds,
            'low_stock_count' => Product::where('active',true)->when($request->shop_id,fn($q,$id)=>$q->where('shop_id',$id))->whereColumn('stock','<=','low_stock_threshold')->count(),
            'top_products' => DB::table('order_items')->join('orders','orders.id','=','order_items.order_id')->join('products','products.id','=','order_items.product_id')->where(fn($q)=>$q->where(fn($paid)=>$paid->whereIn('orders.status',['paid','assigned'])->where('orders.payment_method','!=','cod'))->orWhere('orders.status','delivered'))->when($request->shop_id,fn($q,$id)=>$q->where('products.shop_id',$id))->select('order_items.product_name',DB::raw('SUM(order_items.quantity) as quantity'),DB::raw('SUM(order_items.quantity * order_items.unit_price) as revenue'))->groupBy('order_items.product_name')->orderByDesc('revenue')->limit(10)->get(),
        ];
    }
    public function validateCoupon(Request $request) {
        $data = $request->validate(['code'=>'required|string|max:40','subtotal'=>'required|integer|min:0']);
        $coupon = $this->usableCoupon(strtoupper(trim($data['code'])), (int)$data['subtotal']);
        if (!$coupon) return response()->json(['message'=>'Code promo invalide, expiré ou non applicable.'], 422);
        $discount = $coupon->discount_type === 'percent' ? (int) floor($data['subtotal'] * min(100,$coupon->discount_value) / 100) : min($data['subtotal'], $coupon->discount_value);
        return ['code'=>$coupon->code,'discount_amount'=>$discount,'total_after_discount'=>$data['subtotal']-$discount];
    }
    public function coupons() { return Coupon::orderByDesc('id')->get(); }
    public function saveCoupon(Request $request, ?Coupon $coupon = null) {
        if($request->has('code')) $request->merge(['code'=>strtoupper(trim($request->input('code')))]);
        $unique='unique:coupons,code'.($coupon?','.$coupon->id:'');
        $data = $request->validate(['code'=>($coupon?'sometimes|required':'required').'|string|max:40|'.$unique,'discount_type'=>($coupon?'sometimes|required':'required').'|in:percent,fixed','discount_value'=>($coupon?'sometimes|required':'required').'|integer|min:1','minimum_order'=>'sometimes|nullable|integer|min:0','usage_limit'=>'sometimes|nullable|integer|min:1','starts_at'=>'sometimes|nullable|date','ends_at'=>'sometimes|nullable|date|after_or_equal:starts_at','active'=>'sometimes|boolean']);
        if (($data['discount_type']??$coupon?->discount_type)==='percent' && ($data['discount_value']??$coupon?->discount_value)>100) return response()->json(['message'=>'Le taux maximal est 100 %.'],422);
        $coupon ? $coupon->update($data) : $coupon=Coupon::create($data);
        AdminAuditService::record($request,$coupon->wasRecentlyCreated?'coupon_created':'coupon_updated','coupon',$coupon->id,['code'=>$coupon->code]);
        return $coupon->fresh();
    }
    public function deleteCoupon(Request $request,Coupon $coupon) { AdminAuditService::record($request,'coupon_deleted','coupon',$coupon->id,['code'=>$coupon->code]); $coupon->delete(); return response()->noContent(); }
    public function refund(Request $request, Order $order) {
        $data=$request->validate(['amount'=>'required|integer|min:1','note'=>'required|string|max:500']);
        DB::transaction(function() use($order,$data) {
            $locked=Order::whereKey($order->id)->lockForUpdate()->firstOrFail();
            abort_unless(in_array($locked->status,['paid','assigned','delivered','cancelled']) && ($locked->payment_method !== 'cod' || $locked->status === 'delivered') && $data['amount'] <= $locked->total_amount-$locked->refunded_amount,422,'Montant remboursable invalide.');
            $newAmount=$locked->refunded_amount+$data['amount'];
            $locked->update(['refunded_amount'=>$newAmount,'refund_status'=>$newAmount >= $locked->total_amount ? 'refunded' : 'partial','refunded_at'=>now()]);
            $locked->setStatus($locked->status,'Remboursement enregistré: '.$data['amount'].' FCFA. '.$data['note']);
        });
        $order->refresh();
        AdminAuditService::record($request,'refund_recorded','order',$order->id,['amount'=>$data['amount'],'note'=>$data['note']]);
        SendOrderSms::dispatch($order->fresh(),'refunded');
        return $order->fresh();
    }
    public function delivery(Request $request, Order $order) {
        $data=$request->validate(['status'=>'required|in:preparing,ready,shipped,delivered','note'=>'nullable|string|max:500']);
        $steps=['unprepared'=>0,'preparing'=>1,'ready'=>2,'shipped'=>3,'delivered'=>4];
        abort_if($steps[$data['status']] < $steps[$order->delivery_status] || $order->status==='cancelled',422,'Étape de livraison invalide.');
        DB::transaction(function() use($request,$order,$data) {
            $order->update(['delivery_status'=>$data['status']]);
            DB::table('order_delivery_history')->insert(['order_id'=>$order->id,'status'=>$data['status'],'note'=>$data['note']??null,'admin_user_id'=>$request->attributes->get('admin_user')->id,'created_at'=>now()]);
            if($data['status']==='delivered' && $order->status!=='delivered') $order->setStatus('delivered','Livraison effectuée');
        });
        AdminAuditService::record($request,'delivery_updated','order',$order->id,['status'=>$data['status'],'note'=>$data['note']??null]);
        $event=['preparing'=>'preparing','ready'=>'ready','shipped'=>'shipped','delivered'=>'delivered'][$data['status']];
        SendOrderSms::dispatch($order->fresh(),$event);
        return $order->fresh()->load('deliveryHistory');
    }
    private function usableCoupon(string $code,int $subtotal): ?Coupon {
        return Coupon::where('code',$code)->where('active',true)->where(fn($q)=>$q->whereNull('starts_at')->orWhere('starts_at','<=',now()))
            ->where(fn($q)=>$q->whereNull('ends_at')->orWhere('ends_at','>=',now()))->where(fn($q)=>$q->whereNull('usage_limit')->orWhereColumn('used_count','<','usage_limit'))
            ->where('minimum_order','<=',$subtotal)->first();
    }
    public function couponForOrder(string $code,int $subtotal): ?Coupon { return $this->usableCoupon(strtoupper(trim($code)),$subtotal); }
}
