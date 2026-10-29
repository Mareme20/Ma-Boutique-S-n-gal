<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;
class StoreOrderRequest extends FormRequest {
    public function authorize(): bool { return true; }
    protected function prepareForValidation(): void {
        $p = preg_replace('/[\s.\-]/', '', (string) $this->customer_phone);
        if (preg_match('/^7[0-9]{8}$/', $p)) $p = '+221'.$p;
        elseif (preg_match('/^221(7[0-9]{8})$/', $p)) $p = '+'.$p;
        $this->merge(['customer_phone' => $p]);
    }
    public function rules(): array {
        return [
            'customer_name'  => 'required|string|max:120',
            'customer_phone' => ['required', 'regex:/^\+2217[0-9]{8}$/'],
            'region'         => 'required|in:'.implode(',', config('shop.regions')),
            'ville_quartier' => 'required|string|max:255',
            'points_repere'  => 'required|string|max:500',
            'payment_method' => 'required|in:wave,orange_money,cod',
            'coupon_code' => 'nullable|string|max:40',
            'items'          => 'required|array|min:1|max:30',
            'items.*.product_id' => 'required|integer|exists:products,id',
            'items.*.quantity'   => 'required|integer|min:1|max:20',
        ];
    }
    public function messages(): array {
        return ['customer_phone.regex' => 'Numéro invalide. Exemple : 77 123 45 67'];
    }
}
