<?php

/**
 * Most simple interface, with everything needed.
*/
interface IEngine {
    /**
     * After starting class, connect to given db, using options array assoc.
     *
     * @param $options The options to connect to MySQL
    */
    public function connect($options);

    /**
     * Search for tables in current model, restricting to given prefix
     *
     * @param $prefix Can be null, a prefix to sub select the result of tables listing
     * @return An array of strings, where each string is a table name selected
    */
    public function getTables($prefix);

    /**
     * Retrieve columns of given table.
     *
     * @param $table The table name
     * @return The list of columns in the current model
    */
    public function getColumns($table);

    /**
     * Get the primary id(s) for this table
     * 
     * @param $table The table name
     * @return The list of ids which are marked as primary
    */
    public function getPrimaryKeys($table);

    /**
     * Get the foreign keys for this table.
     *
     * @param $table The table name
     * @return The list of foreign keys and their relation
    */
    public function getForeignKeys($table);

    /**
     * Send a to a given table a basic query element.
     *
     * @param $table The table name
     * @param $query The query after 'WHERE', for example 'SELECT * FROM user WHERE'
     * should be automated (not changeable except table name) and "user_id = 10" is the query string...
     * @return The query result.
    */
    public function quickQuery($table, $query);

    /**
     * Send to a given table a user query element.
     *
     * @param $query The query elements to send.
     * @return The query result.
    */
    public function customQuery($query);
};

?>