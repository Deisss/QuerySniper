<?php

$config = array(
    // possible values: MySQL
    'engine'   => 'MySQL',

    // Database configuration
    'database' => array(
        'host'     => 'localhost',
        'port'     => 3306,
        'database' => 'example_querysniper',
        'username' => 'root',
        'password' => '',
        'charset'  => 'utf8'
    ),

    /*
     * Print help you to define what Query Sniper must show for
     * each table, at least, in short mode.
     * It helps to select important field you must see globally.
     *
     * ex: you have a table "user", you know you don't care about
     * "created_at" and "deleted_at", but you care about "id" and "login".
     * In this array, put: "user" => array("id", "login")
     * In global render view, you will not see created_at but it will
     * print id and login.
     *
     * Note: by default, if short is empty for a table, only primary key
     * field is show...
    */
    'prints' => array(
        'companies' => array('name'),
        'users' => array('login'),
        'project_has_users' => array('role'),
        'projects' => array('name')
    ),

    /*
     * Redefine some foreigns key relation manually.
     *
     * For example, let's take a simple case, a guy forgot about
     * foreign keys, and then, in your DB, two tables got "link"
     * but SQL system don't know about it...
     * This array is here for: you can manually create foreign
     * keys even if they don't trully exist. It helps to still
     * keep a nice helper even if you db configuration is crappy...
     *
     * How to use it:
     * You have two table, one "user", and one "company", user got
     * "company_id" which is linked to "id" in "company", you will,
     * in this case, add to this array:
     * "user" => array(
     *   "user.company_id" => "company.id"
     * )
     * You can of course add many like this.
    */
    'foreigns' => array(
    ),

    
);

?>