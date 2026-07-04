<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'academy_name',
    'admin_email',
    'logo_path',
    'general_description',
    'center_director_name',
])]
class Setting extends Model
{
}
