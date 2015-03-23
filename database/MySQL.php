<?php

require 'IEngine.php';

/**
 * Create the engine for MySQL system.
*/
class MySQLEngine implements IEngine {
    private $db;
    private $dbString;

    public function connect($options) {
        $opt = array(
            PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES '.$options['charset'],
        );
        $this->dbString = $options['database'];

        try {
            $this->db = new PDO('mysql:dbname='.$options['database'].';host='.$options['host'].';port='.$options['port'].';charset='.$options['charset'], $options['username'], $options['password'], $opt);
            $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch(PDOException $e) {
            die('{"error":"'.$e->getMessage().'"}');
        }
    }

    public function getTables($prefix = null) {
        try {
            $results = array();
            $partials = $this->db->query('SHOW TABLES');

            while ($row = $partials->fetch(PDO::FETCH_NUM)) {
                if(empty($prefix)) {
                    $results[] = $row[0];
                } else if(substr($row, 0, strlen($prefix)) == $prefix) {
                    $results[] = $row[0];
                }
            }

            return $results;
        } catch(Exception $e) {
            die('{"error": "'.$e->getMessage().'"}');
        }
    }

    public function getColumns($table) {
        try {
            $results = array();
            $partials = $this->db->query('SHOW COLUMNS FROM `'.$table.'`');

            while ($row = $partials->fetch(PDO::FETCH_NUM)) {
                $results[] = $row[0];
            }

            return $results;
        } catch(Exception $e) {
            die('{"error":"'.$e->getMessage().'"}');
        }
    }

    public function getPrimaryKeys($table) {
        try {
            $results = array();
            $partials = $this->db->query('SHOW KEYS FROM `'.$table.'` WHERE Key_name = "PRIMARY"');

            while ($row = $partials->fetch(PDO::FETCH_ASSOC)) {
                $results[] = $row['Column_name'];
            }

            return $results;
        } catch(Exception $e) {
            die('{"error":"'.$e->getMessage().'"}');
        }
    }

    public function getForeignKeys($table) {
        try {
            $results = array();
            $partials = $this->db->query('SELECT CONCAT(table_name, ".", column_name) AS "fk", CONCAT(referenced_table_name, ".", referenced_column_name) AS "ref" FROM information_schema.key_column_usage WHERE referenced_table_name IS not null AND table_schema = "'.$this->dbString.'" AND table_name = "'.$table.'"');

            while ($row = $partials->fetch(PDO::FETCH_ASSOC)) {
                $results[] = array(
                    'foreign' => $row['fk'],
                    'reference' => $row['ref']
                );
            }

            return $results;
        } catch(Exception $e) {
            die('{"error":"'.$e->getMessage().'"}');
        }
    }

    public function quickQuery($table, $query) {
        try {
            $results = array();
            $partials = $this->db->query('SELECT * FROM `'.$table.'` WHERE '.$query);

            while ($row = $partials->fetch(PDO::FETCH_ASSOC)) {
                $results[] = $row;
            }

            return $results;
        } catch(Exception $e) {
            die('{"error":"'.$e->getMessage().'"}');
        }
    }

    public function customQuery($query) {
        try {
            $results = array();

            if(preg_match('#^select#i', $query) === 1) {
                $partials = $this->db->query($query);

                while ($row = $partials->fetch(PDO::FETCH_NUM)) {
                    $results[] = $row;
                }
            } else {
                $this->db->exec($query);
            }

            return $results;
        } catch(Exception $e) {
            die('{"error":"'.$e->getMessage().'"}');
        }
    }
};

?>