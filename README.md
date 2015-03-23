# QuerySniper
Query Sniper is a tool for creating a relationship map between datas across multiple tables.  
Thus, it's suitable mostly for relationship database style, such as SQL system.

Here is some screen capture of database structure, a query and associated results (data are available in example folder):

**The database structure:**  
![The database settings](http://www.kirikoo.net/images/14Anonyme-20150323-181522.png)

**The query (dont worry, most of it is filled automatically):**  
![The query](http://www.kirikoo.net/images/14Anonyme-20150323-181539.png)

**The results:**  
![The results](http://www.kirikoo.net/images/14Anonyme-20150323-181554.png)


You can find an in depth tutorial [here](https://github.com/Deisss/QuerySniper/wiki/base).

## history

It all begins with a small program: it is a desktop application, installing on various environment (Linux, Windows...), and, in background, doing many things with a MySQL database across internet.  
The problem was: how to handle tech support in a various environment -with probably many tiny bugs due to environment changes-, with the minimum people/tech guys.  
The idea quickly became POC, I need a tool able to 'trace queries and datas' across multiple tables to have a good overview of what's going on for a specific user, a specific requirement.  
Short story simple: to know what are the current state of the database regarding this user/plugin.  

Query Sniper [was born](https://github.com/Deisss/QuerySniper/wiki/Idea)!

## Server Configuration

By default the full configuration is available into config.php, to avoid htaccess problem, the system does not use any rewrite rules, making it quickly usable, please pay attention to following config.php variables:

  * **Engine**: the SQL engine you want to work with. By default it should be set on MySQL.
  * **Database**: The database configuration for connecting to it.
  * **Prints**: a _'table' => array('field1', 'field2')_ array, containing all fields to see in the global overview. See the example image above, and the current prints content: 'name' for table projects. This system exists because it cannot know "in advance", what are the important field to show in priority while rendering graph.
  * **Foreigns**: if your database lack some definition because of bad relationship description, you can fake some here, allowing system to still use it like if it was "official" constraint.

## Client configuration

Next, you need to add everything needed for client to work, for this, we use [bower](http://bower.io/):

```sh
bower install
```

In the base folder, will grab many libraries (from jQuery to jsPlumb for graphics).

## Limitations

There is few limits to this system by now:

  * By default, **the system as no security at all**, you should at least make a password protection with a htaccess or similar...
  * The links between data across table works well **ONLY** when the relationship between tables is done using foreign keys relations and not a custom SQL command. Please pay a lot attention to this.
  * The system may hang your server and/or your browser if you take a huge dataset to render.
  * The system for now handle mostly inner type join, no group, distinct or left join for now, as it makes system way more complex, and the purpose is to save time, not start digging into complex query.

## Improvements
  * To correct the "link" problem which works well only when foreigns keys are used, the system should use a [SQL.js](https://github.com/kripken/sql.js/) on client side, inserting model into JS database, then inserting data, and getting line one by one, to find real relationship between each elements of each tables... Right now the system simply takes registred foreign keys, and say "user.id == company.id", OK, link both id. Which may create bad results if your query does not rely on foreign keys to mix...
  * Modify a visual, and beeing able to have parameters inside.
  * Adding more SQL Engine, like PostGreSQL, SQLite, ...
  * Being able to cascading delete when modifying a single line. For now the system crash with "constraint error", without giving option to the user to cascade delete.

## License

QuerySniper is licensed under GPLv3 license. Please see [LICENSE](./LICENSE) file for more details.