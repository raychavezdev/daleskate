<?php
require_once __DIR__ . "/../config/headers.php";
require_once __DIR__ . "/../config/article_access.php";

$banner = getPublicBannerArticle($conn);
echo json_encode($banner);
