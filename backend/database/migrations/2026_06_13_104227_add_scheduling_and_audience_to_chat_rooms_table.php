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
        Schema::table('chat_rooms', function (Blueprint $table) {
            $table->dateTime('scheduled_at')->nullable()->after('type');
            $table->enum('audience_type', ['all', 'course_id', 'specific_users'])->default('all')->after('scheduled_at');
            $table->foreignId('course_id')->nullable()->constrained()->nullOnDelete()->after('audience_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('chat_rooms', function (Blueprint $table) {
            $table->dropForeign(['course_id']);
            $table->dropColumn(['scheduled_at', 'audience_type', 'course_id']);
        });
    }
};
