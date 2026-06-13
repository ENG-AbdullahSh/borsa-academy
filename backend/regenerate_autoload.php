<?php
/**
 * This script manually regenerates the Composer PSR-4 autoload classmap
 * to include the ArPHP\I18N namespace from vendor/khaled.alshamaa/ar-php/src/
 *
 * Run once: php regenerate_autoload.php
 * Then delete this file.
 */

$autoloadFile = __DIR__ . '/vendor/composer/autoload_psr4.php';
$content = file_get_contents($autoloadFile);

$entry = "\n    'ArPHP\\\\I18N\\\\' => array(\$vendorDir . '/khaled.alshamaa/ar-php/src'),";

if (strpos($content, 'ArPHP\\\\I18N\\\\') !== false) {
    echo "ArPHP autoload entry already exists.\n";
} else {
    // Insert before the closing );
    $content = str_replace(
        'return array(',
        'return array(' . $entry,
        $content
    );
    file_put_contents($autoloadFile, $content);
    echo "ArPHP autoload entry injected into autoload_psr4.php\n";
}

// Verify
require __DIR__ . '/vendor/autoload.php';
if (class_exists('ArPHP\I18N\Arabic')) {
    echo "SUCCESS: ArPHP\I18N\Arabic is now autoloaded!\n";

    // Test glyph shaping
    $arabic = new ArPHP\I18N\Arabic();
    $test = $arabic->utf8Glyphs('شهادة إتمام دورة');
    echo "Glyph shaping test: " . ($test !== '' ? 'PASS' : 'FAIL') . "\n";
    echo "Output length: " . mb_strlen($test) . " chars\n";
} else {
    echo "FAILED: ArPHP class still not found.\n";
}
