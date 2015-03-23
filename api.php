<?php

require 'config.php';
require 'database/FactoryEngine.php';
require 'runner/Runner.php';

/**
 * Get the engine
*/
function getEngine() {
    global $config;

    // Getting engine
    $factory = new FactoryEngine($config['engine']);
    $engine = $factory->getEngine();

    // Connecting
    $engine->connect($config['database']);

    return $engine;
}

/**
 * Get the listing for current db
*/
function getListing($prefix) {
    global $config;
    $engine = getEngine();

    $tables = $engine->getTables($prefix);
    $results = [];

    foreach($tables as $value) {
        $columns = $engine->getColumns($value);
        $primaries = $engine->getPrimaryKeys($value);
        $foreigns = $engine->getForeignKeys($value);

        $tmp = array(
            'columns' => $columns,
            'primaries' => $primaries,
            'foreigns' => $foreigns,
            'prints' => array()
        );

        if(isset($config['prints'][$value]) &&
            is_array($config['prints'][$value])) {
            $tmp['prints'] = $config['prints'][$value];
        }

        if(isset($config['foreigns'][$value]) &&
            is_array($config['foreigns'][$value])) {
            foreach($config['foreigns'][$value] as $k => $v) {
                $tmp['foreigns'][$k] = $v;
            }
        }

        $results[$value] = $tmp;
    }

    return $results;
}


/**
 * Apply execute and get back an array composed of
 * table => result
*/
function getExecute($execute) {
    // TODO: return JSON error
    if($execute == null) {
        return null;
    }

    global $config;
    $engine = getEngine();
    $runner = new Runner($engine);
    $offsetCustom = 0;
    $offsetQuick = 0;

    for($i = 0, $l = count($execute['types[]']); $i < $l; ++$i) {
        $type = $execute['types[]'][$i];

        if($type == 'quick') {
            $table = $execute['tables[]'][$offsetQuick];
            $query = $execute['queries[]'][$offsetQuick];

            $runner->quickQuery($table, $query);

            // Update offset
            $offsetQuick++;
        } else {
            $query = $execute['customs[]'][$offsetCustom];

            $runner->customQuery($query);

            // Update offset
            $offsetCustom++;
        }
    }

    return $runner->getResults();
}



// We are executing a request
if(isset($_POST) && !empty($_POST['execute'])) {
    $json = null;

    if(!empty($_POST['json'])) {
        $json = json_decode($_POST['json'], true);
    }

    echo json_encode(getExecute($json));
    exit();
}

// We are getting list of tables and their relationsships
if(isset($_POST) && !empty($_POST['listing'])) {
    $prefix = '';

    if(!empty($_POST['prefix'])) {
        $prefix = $_POST['prefix'];
    }

    echo json_encode(getListing($prefix));
    exit();
}

?>