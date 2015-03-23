<?php
$image = '';
if(isset($_POST) && !empty($_POST['image'])) {
    $image = $_POST['image'];
} else if(isset($_GET) && !empty($_GET['image'])) {
    $image = $_GET['image'];
}

if(strlen($image) > 0) {
    $image = str_replace('data:image/png;base64,', '', $image);
    $decoded = base64_decode($image);

    file_put_contents('tmp.png', $decoded, LOCK_EX);

    echo 'tmp.png';
} else {
    header('Content-Type: image/png');
    echo file_get_contents('tmp.png');
}

?>