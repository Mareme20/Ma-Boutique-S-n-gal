<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller {
    public function index(Request $request) {
        return Product::with('shop:id,name,slug,city,whatsapp')->where('active', true)
            ->when($request->shop_id, fn($q,$id)=>$q->where('shop_id',$id))
            ->when($request->shop_slug, fn($q,$slug)=>$q->whereHas('shop',fn($sq)=>$sq->where('slug',$slug)))
            ->orderByDesc('id')->get();
    }
    public function show(string $slug) {
        return Product::with('shop')->where('active', true)->where('slug', $slug)->firstOrFail();
    }
}
