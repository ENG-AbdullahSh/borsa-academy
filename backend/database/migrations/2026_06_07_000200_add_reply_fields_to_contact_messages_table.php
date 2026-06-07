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
        $missingReplySubject = ! Schema::hasColumn('contact_messages', 'reply_subject');
        $missingReplyMessage = ! Schema::hasColumn('contact_messages', 'reply_message');
        $missingRepliedAt = ! Schema::hasColumn('contact_messages', 'replied_at');
        $missingRepliedBy = ! Schema::hasColumn('contact_messages', 'replied_by');

        if ($missingReplySubject || $missingReplyMessage || $missingRepliedAt || $missingRepliedBy) {
            Schema::table('contact_messages', function (Blueprint $table) use (
                $missingReplySubject,
                $missingReplyMessage,
                $missingRepliedAt,
                $missingRepliedBy
            ) {
                if ($missingReplySubject) {
                    $table->string('reply_subject')->nullable()->after('admin_note');
                }

                if ($missingReplyMessage) {
                    $table->text('reply_message')->nullable()->after('reply_subject');
                }

                if ($missingRepliedAt) {
                    $table->timestamp('replied_at')->nullable()->after('reply_message');
                }

                if ($missingRepliedBy) {
                    $table->foreignId('replied_by')
                        ->nullable()
                        ->after('replied_at')
                        ->constrained('users')
                        ->nullOnDelete();
                }
            });
        }

        Schema::table('contact_messages', function (Blueprint $table) {
            $table->string('status', 20)->default('unread')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('contact_messages', function (Blueprint $table) {
            $table->dropConstrainedForeignId('replied_by');
            $table->dropColumn(['reply_subject', 'reply_message', 'replied_at']);
            $table->enum('status', ['unread', 'read', 'archived'])->default('unread')->change();
        });
    }
};
