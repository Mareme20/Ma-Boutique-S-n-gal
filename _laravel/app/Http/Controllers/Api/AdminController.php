<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Jobs\SendOrderSms;
use App\Models\{Order, Product, Shop};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\{Schema, Storage};
use App\Services\AdminAuditService;

class AdminController extends Controller {
    private const FLOW = ['pending','paid','assigned','delivered','failed','cancelled'];

    public function shops(Request $r) {
        return Shop::withCount(['products','orders'])->when(!str_contains($r->path(), 'admin/shops'), fn($q)=>$q->where('active',true))->orderBy('name')->get();
    }
    public function products(Request $r) { return Product::with('shop:id,name,slug,city,whatsapp')->when($r->shop_id,fn($q,$id)=>$q->where('shop_id',$id))->orderByDesc('id')->get(); }
    public function createProduct(Request $r) {
        $data=$r->validate(['name'=>'required|string|max:255','slug'=>'required|string|max:255|unique:products,slug','description'=>'nullable|string','price'=>'required|integer|min:0','stock'=>'required|integer|min:0','low_stock_threshold'=>'nullable|integer|min:0','active'=>'boolean','image_url'=>'nullable|string|max:2048','shop_id'=>'nullable|exists:shops,id']);
        $data['low_stock_threshold']=$data['low_stock_threshold']??5;
        $product=Product::create($data)->load('shop');
        AdminAuditService::record($r,'product_created','product',$product->id,['name'=>$product->name]);
        return $product;
    }
    public function updateProduct(Request $r, Product $product) {
        $data=$r->validate(['name'=>'sometimes|required|string|max:255','slug'=>'sometimes|required|string|max:255|unique:products,slug,'.$product->id,'description'=>'nullable|string','price'=>'sometimes|required|integer|min:0','stock'=>'sometimes|required|integer|min:0','low_stock_threshold'=>'sometimes|required|integer|min:0','active'=>'sometimes|boolean','image_url'=>'nullable|string|max:2048','shop_id'=>'nullable|exists:shops,id']);
        $product->update($data); AdminAuditService::record($r,'product_updated','product',$product->id,$data); return $product->fresh('shop');
    }
    public function deleteProduct(Product $product) {
        if($product->orderItems()->exists()) return response()->json(['message'=>'Ce produit apparaît dans des commandes et ne peut pas être supprimé. Masquez-le à la place.'],409);
        AdminAuditService::record(request(),'product_deleted','product',$product->id,['name'=>$product->name]);
        $product->delete(); return response()->noContent();
    }
    public function uploadImage(Request $r) {
        $r->validate(['image'=>'required|image|mimes:jpg,jpeg,png,webp|max:5120']);
        $path=$r->file('image')->store('products','public'); AdminAuditService::record($r,'product_image_uploaded','product',null,['path'=>$path]); return ['url'=>url(Storage::url($path))];
    }

    public function index(Request $r) {
        return Order::with(['items.product.shop','deliveryHistory','shop:id,name,slug,city,whatsapp'])->when($r->status, fn($q, $s) => $q->where('status', $s))->when($r->shop_id,fn($q,$id)=>$q->where(fn($sq)=>$sq->where('shop_id',$id)->orWhereHas('items.product',fn($pq)=>$pq->where('shop_id',$id))))->orderByDesc('id')->paginate(50);
    }
    public function updateStatus(Request $r, Order $order) {
        $r->validate(['status' => 'required|in:'.implode(',', self::FLOW), 'note' => 'nullable|string|max:300']);
        if ($r->attributes->get('admin_user')->role === 'logistics') abort_unless(in_array($r->status, ['assigned','delivered','cancelled']), 403);
        if (in_array($r->status, ['failed', 'cancelled']) && $order->status === 'pending') {
            $order->releaseReservedStock($r->status, $r->note ?: 'Commande fermée, stock remis en vente');
        } else {
            $order->setStatus($r->status, $r->note);
        }
        if ($r->status === 'delivered' && $order->delivery_status !== 'delivered') {
            $order->update(['delivery_status'=>'delivered']);
            \Illuminate\Support\Facades\DB::table('order_delivery_history')->insert(['order_id'=>$order->id,'status'=>'delivered','note'=>'Livraison effectuée','admin_user_id'=>$r->attributes->get('admin_user')->id,'created_at'=>now()]);
        }
        if (in_array($r->status, ['assigned','delivered'])) SendOrderSms::dispatch($order, $r->status);
        if ($r->status === 'cancelled') SendOrderSms::dispatch($order, 'cancelled');
        if ($r->status === 'failed') SendOrderSms::dispatch($order, 'failed');
        AdminAuditService::record($r,'order_status_updated','order',$order->id,['status'=>$r->status,'note'=>$r->note]);
        return $order->fresh();
    }
    /** CSV du jour pour les livreurs (à envoyer par WhatsApp). */
    public function export(Request $r) {
        $day = $r->query('date', now()->toDateString());
        $orders = Order::with(['shop','items.product.shop'])->whereDate('created_at', $day)->whereIn('status', ['pending','paid','assigned'])->when($r->shop_id,fn($q,$id)=>$q->where(fn($sq)=>$sq->where('shop_id',$id)->orWhereHas('items.product',fn($pq)=>$pq->where('shop_id',$id))))->get();
        $out = fopen('php://temp', 'w+');
        fwrite($out, "\xEF\xBB\xBF");  // BOM pour Excel
        fputcsv($out, ['Reference','Boutique','Client','Telephone','Region','Quartier','Reperes','A encaisser (FCFA)'], ';');
        foreach ($orders as $o) {
            $cash = $o->payment_method === 'cod' ? $o->total_amount : 0;
            fputcsv($out, [$o->reference,$o->shop?->name ?? 'Général',$o->customer_name,$o->customer_phone,$o->region,$o->ville_quartier,$o->points_repere,$cash], ';');
        }
        rewind($out);
        return response(stream_get_contents($out), 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=livraisons-$day.csv",
        ]);
    }
}
