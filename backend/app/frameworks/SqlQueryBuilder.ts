/*
    Itt importálni kell az adatbáziskapcsolatot 
*/
import { QueryResult, ResultSetHeader } from "my_sql2";
import { joinTypes } from "../app/models/types.js";
import pool from "./Conn.js";
import getQuestionMarks from "./getQuestionMarks.js";

class _sqlQueryBuilder {
    private _sql:string;
    private conn:any;
    private values:any[];
    private inTransaction:boolean;

    constructor() {
        //this.getConnection();  ezt nem itt fogjuk megcsinálni, hanem az execute függvényen belül!!!! 
        this.values = [];
        this._sql = "";
        this.inTransaction = false;
    }

    public get sql():string {
        return this._sql;
    }

    /*
            Fontos, hogy ezek async-ek legyenek és await-elni kell!! 
    */

    public async beginTransaction() {
        if(this.inTransaction) {
            throw "There is an active transaction under execution!";
        }
        this.inTransaction = true;
        this.conn = await pool.promise().getConnection();
        await this.conn.beginTransaction();
    }

    public async commit() {
        await this.conn.commit();
    }

    public async rollBack() {
        try { await this.conn.rollback(); this.conn.release(); } catch(err) { 
            console.log("_sqlQueryBuilder.rollBack", err); 
        }
    }

    public select(table:string, fields:string[]):_sqlQueryBuilder {
        //elő kell állítani egy _sql string-et 
        //mert a fields az egy tömb, amiben vannak a mezők, de mi itt azt akarjuk, hogy egymás mellett fel legyenek sorolva string-ként 
        //fields.join(", ")

        this._sql += `SELECT ${fields.join(", ")} FROM ${table}} `;
        return this;

        /*
            Ha azt mondjuk, hogy return this, akkor azt lehet csinálni, hogy létrehozunk egy public where és majd össze lehet füzni őket!! 
        */
    }

    public where(field:string, operation:string, value:any):_sqlQueryBuilder {
        
        //hozzáfüzzük az _sql változóhoz 
        this._sql += `WHERE ${field} ${operation} ? `;
        //a values-ba meg belerakjuk a value-t, amit bekér a függvény és majd meghatározunk meghívásnál 
        this.values.push(value);

        //és ez is egy _sqlQueryBuilder-t fog visszaadni és azt mondjuk, hogy return this
        return this;
    }

    // public get_sql():string {
    //     return this._sql;
    // }

    public and(field:string, operation:string, value:any):_sqlQueryBuilder {
        this._sql += `AND ${field} ${operation} ? `; //itt fontos, hogy hagyni kell egy szóközt, mert összefűzésnél nehogy egybe legyen a kettő
        this.values.push(value);
        return this;
    }

    public like(field:string, andOrWhere:string, value:any):_sqlQueryBuilder {
        this._sql += `${andOrWhere} ${field} LIKE ? `; 
        this.values.push(value);
        return this;
    }

    public or(field:string, operation:string, value:any):_sqlQueryBuilder {
        this._sql += `OR ${field} ${operation} ? `;
        this.values.push(value);
        return this;
    }

    public in(field:string, values:any[], andOrWhere:string):_sqlQueryBuilder {
        this._sql += `${andOrWhere} ${field} IN(${values.map(v=>"?").join(",")}) `;
        this.values.push(...values);
        return this;
    }

    public between(field:string, values:[any, any], andOrWhere:string):_sqlQueryBuilder {
        this._sql += `${andOrWhere} ${field} BETWEEN ? AND ?}} `;
        this.values.push(...values);
        return this;
    }
    
    public insert(table:string, fieldsValues:Record<string, any>):_sqlQueryBuilder {
        this._sql += `INSERT INTO ${table} 
        (${Object.keys(fieldsValues)}) 
        VALUES(${getQuestionMarks(Object.keys(fieldsValues))})`

        this.values.push(...Object.values(fieldsValues));
        console.log(this.values);
        return this;
    }

    public join(joinType:joinTypes, table:string, fields:[string, string]):_sqlQueryBuilder {
        this._sql += `${joinType} ${table} ON ${fields[0]} = ${fields[1]} `;
        return this;
    }

    //JOIN-ból lehet alapból egy olyat csinálni, hogy INNER JOIN-os 
    public innerJoin(table:string, fields:[string, string]):_sqlQueryBuilder {
        return this.join(joinTypes.INNER, table, fields);
    }
    //és ha az innerJoin-t hívjuk meg akkor nem kell beírni, hogy mi a joinType, mert abban meg van hívva a join és ott megadtuk neki!! 

    //ugyanígy lehet right és left join-os is 
    public leftJoin(table:string, fields:[string, string]):_sqlQueryBuilder {
        return this.join(joinTypes.LEFT, table, fields);
    }

    public rightJoin(table:string, fields:[string, string]):_sqlQueryBuilder {
        return this.join(joinTypes.RIGHT, table, fields);
    }

    public callProcedure(name:string, values:any[]) {
        this._sql += `call ${name}(${getQuestionMarks(values)}) `;
        this.values.push(...values);
        return this;
    }
    
    public update(table:string, fieldsValues:Record<string, any>):_sqlQueryBuilder {

        const fieldsString:string = Object.keys(fieldsValues).map(key=> `${key} = ?`).join(", ");
        this._sql += `UPDATE ${table} SET ${fieldsString} `;
        return this;
        //return this, hogy tudjunk majd chain-elni, mert itt lehet majd utána a where vagy az and .. 
    }

    public async execute():Promise<ResultSetHeader>|Record<string, any>[] {
        try {
            /*
                Itt megcsináljuk a connection és nem felül 
            */
            if(!this.inTransaction)
                this.conn = await pool.promise().getConnection();
            /*
            tehát itt van meg a collection és ha megcsináljuk a response-os dolgot, akkor release()
            elengedjük ezt a conn-t szabaddá tesszük 
            */
            const _sql = this._sql;
            const values = this.values;
            this._sql = "";
            this.values = [];
            const response = await this.conn.query(_sql, values);
            this.conn.release();

        } catch(err:any) {
            /*
                Itt az error kell visszaadni, de hogy mi legyen a formátuma, de csak visszaadjuk simán az err-t -> return err;
            */
            throw err;
        }
    }

/*
    Még hiányzik az any, exists meg allekérdezés 

    exists() az vár egy subquery-t, aminek a típusa _sqlQueryBuilder

    és hagyjuk ezt az sql-t
    ->
        public get_sql():string {
            return this.sql;
        }
    hanem inkább azt csináljuk, hogy az _sql ami egy sima változó volt és a constructor-ben definiáltuk, hogy az értéke egy üres string 
        ->
        class _sqlQueryBuilder {
            private _sql:string;***

        constructor() {
            this._sql = "";***
        }
    hogy egy dinamikusan változó _sql-t hozunk létre 
    ->
    class _sqlQueryBuilder {
    private _sql:string;
    private conn:any;

    constructor() {
        this._sql = "";
    }

    public get _sql():string {
        return this_sql;
    }
    És lesz egy get-tere is ami egy string-et fog visszaadni
    Persze itt a példában mindenhol ahol eddig sql volt az _sql-re kell helyestesíteni 
    -> 
    this.sql += `UPDATE ${table} SET ${fieldsString} `;
    ->
    this._sql += `UPDATE ${table} SET ${fieldsString} `;
    **********************************************************************
    Mi a getter és a setter 
    -> 
    A getter és a setter az objektumorientált programpzásban (OOP) gyakran használt mechanizmusok, melyek a private mezők 
    (vagy másnéven property-k) kezelését könnyíti meg az osztályokon belül
    Segítenek abban, hogy biztonságosan és ellenőrzött módon férjünk hozzá egy osztály private adattagjaihoz 

    Getter 
    A getter egy olyan metódus, amely egy private mező értékét adja vissza anélkül, hogy közvetlen hozzáférést biztosítana a mezőkhöz 
    Így az osztály kivülről nem módosíthatja közvetlenül ezt az értéket, csak lekérheti 

    A példában a get _sql lekéri az __sql értékét 
    public get sql():string {
        return this._sql;
    }
    Ezzel a kóddal pedig megkapjuk 
    const queryBuilder = new _sqlQueryBuilder();
    console.log(queryBuilder.sql) -> ezzel lekérjük az _sql értékét 

    Setter 
    A setter egy olyan metódus, amely lehetőséget ad arra, hogy egy private mező értékét ellenőrzötten módosítsuk
    Ha pl. van egy olyan mező, amelynek csak bizonyos feltételekkel lehet új értéket adni, a setter segítségével ellenőrízhetjük 
        hogy megfelel-e az érték 
    
    Ha az __sql mezőt szeretnénk beállítani, létrehozunk egy set sql metódust 
    public set sql(newValue:string) {
        this._sql = newValue;
    }

    Getter: Lekéri egy private mező értékét 
    Setter: Beállítja egy private mező értékét, és ellenőrzést végezhet az érték beállítása előtt 
    ***************************************************************************************************
    public exists(subquery:_sqlQueryBuilder) {
        this._sql += `${subquery.sql} `;
    }
    Ez azt fogja csinálni, hogy egy másik sqlQueryBuilder páldányt kérünk be -> exists(subquery:_sqlQueryBuilder***) 
    paraméterként!! 
    mert egy allekérdezésben kettő subquery kell de el kell majd választani egy andOrWhere-vel és kell egy EXISTS()
    ->
    public exists(subquery:_sqlQueryBuilder, andOrWhere:string***) {
        this._sql += `${andOrWhere} EXISTS(${subquery.sql}) `;
    }

    Ahhoz, hogy ezt le tudjuk ellenőrizni, hogyan müködik be kell írni a terminálba
    - nodemon index 
    - tsc index.ts --watch --target ES2022 (fordítás)

    index.ts-en 
    példányosítani kell 
    const qb = new SqlQueryBuilder();
    const sql = qb.select("users", ["*"]).exists();

    Ilyenkor vagy az van, hogy létrehozuk egy másik változóban pl. const qb2 = new SqlQueryBuilder() 
    vagy itt ezt meg lehet csinálni az allekérdezésben is így 
    -> 
    const sql = qb.select("users", ["*"]).exists(
        new SqlQueryBuilder().select("rating", ["userID"]).where("users.userID", "=", "ratings.userID")
        .and("ratings.rate", "=", 5), "WHERE"; -> azért kell a where, mert a exists két paramétert vár 1 subQuery az a hosszú valami meg a "WHERE"
    );
    !!!!!!!!!!!!
    Ilyenkor ez a valami, amit inkább ki is szedünk és belerakjuk egy változóba 
    const subQuery = new SqlQueryBuilder().select("rating", ["userID"]).where("users.userID", "=", "ratings.userID").and("ratings.rate", "=", 5);
    és akkor a subQuery-t fogjuk átadni 
    ->
    const sql = qb.select("users", ["*"]).exists(subQuery, "WHERE");

    public exists(subquery:_sqlQueryBuilder, andOrWhere:string) {
        console.log(subquery.sql);***
        this._sql += `${andOrWhere} EXISTS(${subquery.sql}) `;
        return this;
    }
    és mivel itt a subQuery-nek van egy ilyen sql getter-e 
    ezért ez lesz a console.log(subQuery.sql);
    SELECT userID from ratings WHERE users.userID = ? AND ratings.rate = ? 

    ÉS ez az egész amit csináltunk az index-en az, hogy összerakunk egy másik példányban egy másik sql string-et és annak a public 
    sql tulajdonságát hozzáfüzzük!!!! 

    és az index-en még hozzárakjuk, hogy .sql
    -> 
    const sql = qb.select("users", ["*"]).exists(subQuery, "WHERE").sql***;
    Akkor az egészet összefüzi nekünk 
    ->
    SELECT * FROM users WHERE EXISTS(SELECT userID FROM ratings WHERE user.userID = ? AND ratings.rate = ?) 
*/ 

    public exists(subquery:_sqlQueryBuilder, andOrWhere:string) {
        console.log(subquery.sql);
        this._sql += `${andOrWhere} EXISTS(${subquery.sql}) `;
        return this;
    }
    
    /*
        Az any meg teljesen ugyanaz, azzal a kivételel, hogy ott ANY van nem EXISTS
    */
    public any(subquery:_sqlQueryBuilder, andOrWhere:string) {
        this._sql += `${andOrWhere} ANY(${subquery.sql}) `;
        return this;
    }

    /*
        és van egy sima subQuery ahova nem kell sem ANY sem EXISTS 
    */
    public subQuery(subquery:_sqlQueryBuilder, andOrWhere:string) {
        this._sql += `${andOrWhere} ${subquery.sql} `;
        return this;
    }

    

    

   
}



export default _sqlQueryBuilder;

