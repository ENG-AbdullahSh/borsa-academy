<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $fillable = [
        'academy_name',
        'admin_email',
        'logo_path',
        'general_description',
        'center_director_name',
    ];
}