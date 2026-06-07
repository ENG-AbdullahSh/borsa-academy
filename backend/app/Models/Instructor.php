<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'name',
    'bio',
    'specialization',
    'profile_image_path',
])]
class Instructor extends Model
{
}
