<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Drop the table first in case a previous failed migration left it partially created.
        Schema::dropIfExists('email_verification_otps');

        Schema::create('email_verification_otps', function (Blueprint $table) {
            $table->id();
            $table->string('email', 191)->index();
            $table->string('code', 6);
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('email_verification_otps');
    }
};
