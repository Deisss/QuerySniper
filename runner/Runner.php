<?php

require 'Step.php';

/**
 * This class will run step by step the search query user is asking.
 * It will also take care to remove unused elements after every
 * steps.
*/
class Runner {
    private $engine;
    private $steps;

    /**
     * Constructor
     *
     * @param engine The SQL engine to use
    */
    public function __construct($engine) {
        $this->engine = $engine;
        $this->steps = array();
    }

    /**
     * Get the parent
     *
     * @param $position The parent position, where 0 means the last parent
     * inserted, and max size the first parent inserted (from the first request)
    */
    private function getParent($position) {
        $l = count($this->steps);
        if($l > 0) {
            if($position < $l) {
                return $this->steps[$l - 1 - $position];
            } else {
                return $this->steps[0];
            }
        }
        return null;
    }

    /**
     * Try to find the appropriate content regarding variable.
     *
     * @param $variable The raw string variable.
     * @return The related SQL string
    */
    private function interpretVariable($variable) {
        $variables = explode('.', $variable);

        $position = 0;
        $result = '';
        $l = count($variables);
        $max = count($this->steps);

        // Must be 2 or more: __parent__.id is the minimum...
        if($l < 2) {
            return '()';
        }

        // We skip the last element, which contains the table key to search
        for($i = 0; $i < $l - 1; ++$i) {
            $v = $variables[$i];

            $position++;
            if($v !== '__parent__') {
                // From the current point, we search for the step which got
                // the good value.
                while(true) {
                    $parent = $this->getParent($position);
                    if($parent->name == $v || $position >= $max) {
                        break;
                    } else {
                        $position++;
                    }
                }
            }
        }

        $key = end($variables);
        $parent = $this->getParent($position - 1);
        //var_dump('key to search '.$key.' in '.$parent->name.'(position: '.$position.')');

        // We get the appropriate result
        return '('.implode(',', $parent->extractField($key)).')';
    }

    /**
     * Variable parsing system.
     *
     * @param $query The query to translate to a concrete element
    */
    private function parseVariables($query) {
        $left = strpos($query, '{{');
        $right = strpos($query, '}}');

        while($left < $right && $left !== false) {
            $variable = substr($query, $left + 2, $right - $left - 2);

            // Replacing the content
            $content = $this->interpretVariable($variable);
            $query = substr($query, 0, $left).$content.substr($query, $right + 2, strlen($query));

            $left = strpos($query, '{{');
            $right = strpos($query, '}}');
        }

        return $query;
    }

    /**
     * Get the successive query results
    */
    public function getResults() {
        $results = array();

        for($i = 0, $l = count($this->steps); $i < $l; ++$i) {
            $step = $this->steps[$i];

            $results[] = array(
                'name' => $step->name,
                'content' => $step->elements
            );
        }

        return $results;
    }

    /**
     * Clean inside content
    */
    public function clean() {
        $this->steps = array();
    }

    /**
     * Apply a quick query to engine, and get the results.
     *
     * @param $table The table to apply query to
     * @param $query The WHERE clause to apply
     * @return results The list of results
    */
    public function quickQuery($table, $query) {
        // Parsing variables
        $table = $this->parseVariables($table);
        $query = $this->parseVariables($query);

        $results = $this->engine->quickQuery($table, $query);

        $this->steps[] = new Step($table, $results);
        return $this->getParent(0);
    }

    /**
     * Apply a custom query to engine, and get the results.
     *
     * @param $query The query to send to DB
     * @return results The list of results
    */
    public function customQuery($query) {
        $matches = [];
        // Really simple, but way enough...
        preg_match_all("/((?:^select .+?(?:from|into))|^update|^table|join) (`?\w+`?)\s/i", $query, $matches);

        // We try to get the table
        $table = '';

        try {
            $tmp = end($matches);
            $name = end($tmp);

            if(strpos($name, '`') !== false) {
                $table = substr($name, 1, -1);
            } else {
                $table = $name;
            }
        } catch(Exception $e) {}

        $results = $this->engine->customQuery($query);

        $this->steps[] = new Step($table, $results);
        return $this->getParent(0);
    }
};

?>