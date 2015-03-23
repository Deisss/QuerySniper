<?php

/**
 * Represent a single step. This class store
 * relative data to current echelon while searching
 * for final answer.
*/
class Step {
    public $name;
    public $elements;

    /**
     * Constructor
     *
     * @param $name The table name
     * @param $elements The elements found for this step...
    */
    public function __construct($name, $elements) {
        $this->name = $name;
        $this->elements = $elements;
    }

    /**
     * From a parameter name, extract a sub array containing all that elements
     * found in collections.
     *
     * @param name The param name to search
     * @return An array with the field found for every results line
    */
    public function extractField($name) {
        $results = array();

        for($i = 0, $l = count($this->elements); $i < $l; ++$i) {
            $element = $this->elements[$i];

            if(array_key_exists($name, $element)) {
                $results[] = $element[$name];
            }
        }

        return $results;
    }
};

?>