# Ma Boutique Sénégal — Next.js 15 + Laravel 12 + PostgreSQL

## Présentation du projet

**Ma Boutique Sénégal** est une plateforme de commerce en ligne conçue pour vendre et gérer des produits de boutiques sénégalaises. Les clients peuvent parcourir le catalogue, rechercher un article, passer commande, choisir un mode de paiement et suivre leur livraison à l’aide de leur référence et de leur jeton de suivi.

La plateforme prend en charge plusieurs boutiques, les codes promotionnels, la gestion des stocks et des commandes, ainsi que les paiements PayTech. Le personnel dispose d’un espace d’administration dont les accès sont séparés par rôle : le propriétaire administre l’ensemble de la plateforme, le gestionnaire s’occupe des ventes et du catalogue, et la logistique suit les livraisons. Des notifications par SMS et WhatsApp peuvent être configurées pour informer les clients.

Le frontend est développé avec Next.js, TypeScript et Tailwind CSS. Le backend Laravel expose une API connectée à PostgreSQL; Redis est fourni pour les services de développement.

## Contenu
- `backend/` : code Laravel à superposer sur une installation Laravel 12 (migrations, modèles, contrôleurs, services PayTech et SMS, job de notification, routes).
- `frontend/` : application Next.js (App Router, TypeScript, Tailwind).
- `docker-compose.yml` : PostgreSQL + Redis pour le développement.

## Démarrage
1. `docker compose up -d`
2. Backend (PHP 8.3+ et Composer requis) : `cd backend && ./setup.sh`
   - Le script crée `_laravel/`, y copie le code, ajoute la config `.env` et lance les migrations.
   - Ajoutez des produits : voir `backend/database/seeder_exemple.txt`.
   - Renseignez dans `_laravel/.env` : PayTech, Orange SMS et les identifiants WhatsApp Cloud API si vous activez ce canal.
   - Créez le premier compte propriétaire avec `cd _laravel && php artisan shop:create-admin` (choisir `owner`), puis activez les images importées avec `php artisan storage:link`.
   - `php artisan serve`, `php artisan queue:work`, puis configurez le cron du planificateur Laravel en production.
3. Frontend : `cd frontend && cp .env.local.example .env.local && npm install && npm run dev`

Pour appliquer les évolutions backend sur une installation `_laravel/` déjà créée, recopiez `backend/app`, `backend/config`, `backend/database` et `backend/routes` dans `_laravel/`, puis lancez `cd _laravel && php artisan migrate`. Créez ensuite le compte propriétaire avec `php artisan shop:create-admin` et lancez `php artisan storage:link`. Un propriétaire peut créer les autres comptes depuis l'onglet « Équipe & Journal ». Pour récupérer un compte propriétaire, utilisez `php artisan shop:reset-admin-password adresse@example.com`. Définissez `PAYMENT_ORDER_EXPIRATION_MINUTES=30` et, pour WhatsApp, `WHATSAPP_CLOUD_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_API_VERSION` et le nom d'un modèle transactionnel approuvé.

## API
| Méthode | Route | Rôle |
|---|---|---|
| GET | /api/v1/products, /products/{slug} | Catalogue |
| POST | /api/v1/orders | Crée la commande (+ lien de paiement) |
| POST | /api/v1/coupons/validate | Vérifie un code promo avant commande |
| POST | /api/v1/payments/webhook | IPN PayTech : signature, idempotence, contrôle du montant |
| POST | /api/v1/admin/login | Connexion admin (compte + rôle, jeton de session 12 h) |
| GET/POST/PATCH | /api/v1/admin/users | Comptes, création et rôles (propriétaire) |
| GET | /api/v1/admin/audit-logs | Journal des changements (propriétaire) |
| GET | /api/v1/admin/orders | Liste des commandes (Bearer token) |
| PATCH | /api/v1/admin/orders/{id}/status | Change le statut et envoie un SMS |
| PATCH | /api/v1/admin/orders/{id}/delivery | Suit préparation, expédition et livraison |
| PATCH | /api/v1/admin/orders/{id}/refund | Enregistre un remboursement manuel (rôle propriétaire) |
| GET/POST | /api/v1/admin/coupons | Liste et crée des codes promo |
| GET | /api/v1/admin/low-stock, /admin/metrics | Alertes et indicateurs commerciaux |
| GET | /api/v1/admin/orders-export?date=YYYY-MM-DD | CSV pour les livreurs |

## À vérifier avant la production
- Testez PayTech en mode `test` : champs de l'IPN et URLs à confirmer dans leur documentation actuelle.
- Orange SMS demande un compte développeur et un expéditeur validé.
- Activez CORS pour votre domaine frontend (`config/cors.php`).
- Les rôles sont `owner`, `manager` et `logistics`. Le propriétaire gère les comptes, remboursements et journal; le gestionnaire gère le catalogue et les promotions; la logistique met à jour les commandes et les étapes de livraison. Il n'y a pas d'inscription publique; les mots de passe oubliés peuvent être réinitialisés par un propriétaire ou depuis la console.
- Les alertes de stock utilisent un seuil par produit, réglable dans l'onglet Catalogue & Stocks (5 unités par défaut).
- Le remboursement est enregistré dans le back-office, mais l'argent doit encore être remboursé dans Wave, Orange Money ou le moyen de paiement utilisé.
- WhatsApp Cloud API est optionnel. Configurez un modèle transactionnel approuvé avec un paramètre de corps `{{1}}`; les SMS restent disponibles via Orange SMS.
- Les commandes Mobile Money expirent après le délai configuré (30 minutes par défaut) et leur stock est remis en vente. Activez le planificateur Laravel en production avec cron (`php artisan schedule:run` chaque minute).
- Le suivi nécessite le jeton aléatoire retourné à la création de commande. Les anciennes commandes, créées avant l'ajout de cette protection, ne disposent pas de jeton de suivi.
