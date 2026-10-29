<?php
namespace App\Console\Commands;
use App\Models\AdminUser;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
class ResetAdminPassword extends Command {
    protected $signature='shop:reset-admin-password {email}';
    protected $description='Reset a back-office account password from the server console';
    public function handle(): int {
        $user=AdminUser::where('email',strtolower($this->argument('email')))->first();
        if(!$user){$this->error('Compte introuvable.');return self::FAILURE;}
        $password=$this->secret('Nouveau mot de passe (12 caractères minimum)');
        if(strlen((string)$password)<12){$this->error('Le mot de passe doit contenir au moins 12 caractères.');return self::FAILURE;}
        $user->update(['password'=>Hash::make($password)]); $user->tokens()->delete();
        $this->info('Mot de passe changé; les sessions ont été révoquées.'); return self::SUCCESS;
    }
}
