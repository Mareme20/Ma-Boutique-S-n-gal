<?php
namespace App\Console\Commands;
use App\Models\AdminUser;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class CreateAdminUser extends Command {
    protected $signature = 'shop:create-admin';
    protected $description = 'Create a back-office account';
    public function handle(): int {
        $name = $this->ask('Nom'); $email = strtolower($this->ask('Email'));
        $role = $this->choice('Rôle', ['owner','manager','logistics'], 'manager');
        $password = $this->secret('Mot de passe (12 caractères minimum)');
        if (!$name || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen((string)$password) < 12 || AdminUser::where('email', $email)->exists()) {
            $this->error('Données invalides, mot de passe trop court ou email déjà utilisé.'); return self::FAILURE;
        }
        AdminUser::create(['name' => $name, 'email' => $email, 'role' => $role, 'password' => Hash::make($password)]);
        $this->info('Compte créé.'); return self::SUCCESS;
    }
}
