<?php



function echoTermHomeHTML($paramNameArr, $safeParamValArr) {
    $len = count($paramNameArr);
    // TODO: Out-comment this length check.
    if (count($safeParamValArr) != $len) {
        throw new \Exception('echoTermDiv(): ' .
            'count(paramNameArr) != count(safeParamValArr).');
    }

    echo '<div class="term" ';
    for ($i = 0; $i < $len; $i++) {
        echo $paramNameArr[$i] . "=" . '"' . $safeParamValArr[$i] . '" ';
    }
    echo 'context="home"></div>';
}


?>
