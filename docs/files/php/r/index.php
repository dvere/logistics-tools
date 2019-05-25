<?php

$uf = 'cors_' . strtolower($_SERVER['REQUEST_METHOD']);
$proto = $_SERVER['SERVER_PROTOCOL'];

if (empty($_REQUEST)) {
    header($proto . ' 400 Bad Request');
    exit;
}

if (function_exists($uf)) {
    call_user_func($uf, $_REQUEST);
} else {
    header($proto . ' 405 Method Not Allowed');
    exit;
}

function cors_get($req){

}

function cors_post($req){

}