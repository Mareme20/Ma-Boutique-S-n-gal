<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        \App\Models\Product::truncate();
        \App\Models\Product::insert([
            [
                'name' => 'Boubou Royal Bazin Riche Getzner',
                'slug' => 'boubou-royal-bazin-riche',
                'description' => "Bazin riche Getzner teinté artisanalement à Dakar, broderie grand fil d'or réalisée à la main par nos maîtres tailleurs. Coupe majestueuse et étoffe lustrée incomparable, parfaite pour les grandes cérémonies.",
                'price' => 65000,
                'stock' => 15,
                'image_url' => 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1000&q=80',
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Thiouraye Impérial « Gongo Royal » 150g',
                'slug' => 'thiouraye-imperial-gongo-150g',
                'description' => "Encens sénégalais haut de gamme macéré pendant 12 mois dans un assemblage secret de musc blanc, oud d'Orient et bois de santal. Fragrance envoûtante longue tenue pour parfumer vos intérieurs et vos tenues.",
                'price' => 8500,
                'stock' => 45,
                'image_url' => 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=1000&q=80',
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Sac Cabas Cuir Pleine Fleur de Thiès',
                'slug' => 'sac-cabas-cuir-pleine-fleur',
                'description' => "Cuir véritable sélectionné et tanné végétal à Thiès. Doublure en lin naturel avec empiècement en tissage Manjak traditionnel. Finition tranches cirées à chaud et fermoir en laiton brossé.",
                'price' => 38000,
                'stock' => 12,
                'image_url' => 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1000&q=80',
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Parure Manchette & Créoles Filigrane Wolof',
                'slug' => 'parure-manchette-filigrane-wolof',
                'description' => "Bijoux d'artisanat inspirés de la joaillerie traditionnelle saint-louisienne. Laiton noble doré à l'or fin 18 carats, filigrane ouvragé patiemment au fil par des maîtres orfèvres sénégalais.",
                'price' => 29500,
                'stock' => 8,
                'image_url' => 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1000&q=80',
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Ensemble Robe Soie & Écharpe Manjak',
                'slug' => 'ensemble-soie-echarpe-manjak',
                'description' => "Élégance sénégalaise contemporaine. Tissage géométrique aux motifs royaux, soie sauvage fluide et coton peigné du Sénégal. Pièce exclusive cousue dans notre atelier dakarois.",
                'price' => 52000,
                'stock' => 10,
                'image_url' => 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=80',
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Coffret Brume de Lingère & Musc Santal',
                'slug' => 'coffret-brume-lingere-musc-santal',
                'description' => "Brume parfumée délicate sans alcool pour le linge, voiles et intérieurs. Formule artisanale aux essences pures de santal rouge de Casamance, ambre doux et fleurs d'oranger.",
                'price' => 14500,
                'stock' => 30,
                'image_url' => 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=1000&q=80',
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
