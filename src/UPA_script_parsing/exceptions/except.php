<?php

class LexException {
     function __construct($pos, $msg) {
        $this->pos = $pos;
        $this->msg = $msg;
    }
}

class ParseException {
     function __construct($pos, $msg) {
        $this->pos = $pos;
        $this->msg = $msg;
    }
}
?>
