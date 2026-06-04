<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::updateOrCreate(
            ['email' => 'admin@borsa.test'],
            [
                'name' => 'Borsa Admin',
                'password' => Hash::make('Password123!'),
                'role' => 'admin',
                'status' => 'active',
            ],
        );

        User::updateOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => Hash::make('Password123!'),
                'role' => 'student',
                'status' => 'active',
            ],
        );

        $this->call(CourseSeeder::class);
    }
}
