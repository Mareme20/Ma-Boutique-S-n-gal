<?php
return [
    'frontend_url' => env('FRONTEND_URL', 'http://localhost:3000'),
    'payment_order_expiration_minutes' => (int) env('PAYMENT_ORDER_EXPIRATION_MINUTES', 30),
    'paytech' => ['key' => env('PAYTECH_API_KEY'), 'secret' => env('PAYTECH_API_SECRET'), 'env' => env('PAYTECH_ENV', 'test')],
    'sms' => ['client_id' => env('ORANGE_SMS_CLIENT_ID'), 'client_secret' => env('ORANGE_SMS_CLIENT_SECRET'), 'sender' => env('ORANGE_SMS_SENDER')],
    'whatsapp' => ['token' => env('WHATSAPP_CLOUD_TOKEN'), 'phone_id' => env('WHATSAPP_PHONE_NUMBER_ID'), 'version' => env('WHATSAPP_API_VERSION', 'v26.0'), 'template' => env('WHATSAPP_TEMPLATE_NAME', 'order_update')],
    // Frais de livraison en FCFA par région (à ajuster)
    'delivery_fees' => ['Dakar' => 1500, 'Thiès' => 2500, 'Diourbel' => 3500, 'Saint-Louis' => 4000, 'Autre' => 5000],
    'regions' => ['Dakar','Thiès','Diourbel','Saint-Louis','Louga','Kaolack','Fatick','Kaffrine','Kolda','Ziguinchor','Sédhiou','Tambacounda','Kédougou','Matam'],
];
