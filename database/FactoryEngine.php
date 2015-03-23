<?php

require 'MySQL.php';

/**
 * Factory engine system
*/
class FactoryEngine {
    private $engine;

    /**
     * Constructor
     *
     * @param $engine The engine string
    */
    public function __construct($engine) {
        $this->engine = null;

        if($engine == 'MySQL') {
            $this->engine = new MySQLEngine();
        } else {
            die('Unknow engine, check your config.php file');
        }
    }

    /**
     * Get current engine setted.
     *
     * @return The engine currently in use
    */
    public function getEngine() {
        return $this->engine;
    }
};

?>