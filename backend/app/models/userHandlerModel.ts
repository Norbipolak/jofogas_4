/*
    Fenntartja az adatbázis kapcsolatot 
*/

import { HTTPResponse, User } from "./types.js";
import catchFunc from "../frameworks/catchFunc.js";
import trim from "../frameworks/trim.js";
/*
    Azért jó, hogy csináltunk egy típust, type-ot a types.js-en, amit ide behívunk
    mert azt tudjuk mondani, hogy amit vár a register user-t az egy User típus lesz!!! 
    ->
    public async register(user:User)***
*/
import { PoolConnection } from "mysql2";
import pool from "../frameworks/Conn.js";
import emailRegex from "./regex.js";
import Validator from "../frameworks/Validator.js";


class userHandlerModel {
    //kell ennek egy connection!!! 
    private conn: PoolConnection | any;
    private validator:Validator;

    constructor() {
        /*
            De viszont itt az a probléma, hogyha poolConnection-t akarunk szerezni, ahhoz kell egy async function 
            this.conn = pool.getConnection(); mert ebben az esetben itt kellene nekünk egy callback -> getConnection(()=> {})
                és akkor itt belül kapnánk meg a connection-t {itt} 
            A másik megoldás meg ahogy csináltuk 
            this.conn = await pool.promise().getConnection();
                csak itt meg az a probléma, hogy await-elni kell majd!! 
                de viszont a constructor az nem lehet async, tehát ez így nem lehet -> async constructor() {

            Ezért kell csinálni egy private async getConn()-t 
        */
        //ha megszereztük a connection-t a getConn-val, akkor azt itt meghívjuk és meg lesz a connection 
        this.getConn();
        this.validator = new Validator();
    }

    private async getConn() {
        //kell egy try-catch blokk, hogy elkapja ha van valami hiba 
        try {
            this.conn = await pool.promise().getConnection();
        } catch (err) {
            console.log(err);
        }
    }

    public async register(user:User):Promise<HTTPResponse>|never {
        /*
            és akkor a user-nek van automtikusan ilyenjei, hogy created, email, firstName...!!! 
        */
        try {
            user = trim(user) as User;
            const response:Query = await this.conn.query(
                //beállítottuk az adatbázisban, hogy a users táblán az isAdmin az alapból 0 legyen, ezért ezt nem kell beállítani 
                `INSERT INTO users (email, pass)`,
                [user.email, user.pass] //ami majd itt bejön -> register(user: User)
            );

            if (response[0].affectedRows === 1) {
                return {
                    status:200,
                    message:""
                };
            } else {
                throw {
                    status: 503,
                    message: "A szolgáltatás ideiglenes nem elérhető"
                };
            }

        } catch (err:any) {
            catchFunc(err, "UserHandler", "register");
        }
    }

    /*
        Ha itt minden rendben ment akkor visszaadhatunk egy true-t, ha meg nem akkor dobni kellene egy hibát 
            if(response[0].affectedRows === 1) {
                return true;
            } else {
                throw `A szerver ideiglenes nem érhető el`;
            }
        
        És akkor ez lesz a visszatérési értéke a függvénynek  -> public async register(user:User):Promise<boolean|never>***

        catch ágban meg megnézzük, hogy mi volt a hiba és továbbdobjuk a hibát, amit mi csináltunk!!
        } catch (err:any) {
            console.log("UserHandler.register", err);
            throw `A szerver ideiglenes nem érhető el`;
        }

        Ez így jó, de nem így lesz, mert úgy, ahogy eddig csináltunk, hogy dobunk egy HTTP kódot, hogy 201 ha jól ment minden 503 ha nem 
        és lesz még mellette egy message is, tehát dobunk egy objektumot, amiben ezek lesznek benne!! 

        return {
            status:200,
            message:""
        };

        Ez sokszor lesz, tehét erre is létrehozhatunk egy típust -> types.ts
        type HTTPResponse = {
            status:number,
            message:string,
            insertID?:number insertID az nullable lesz, tehát ezt nem fontos mindig megadni, mert nem mindig adunk itt vissza userID-t, pl. itt sem
        }
        és akkor ebben az esetben a register visszaad egy HTTPResponse-ot vagy egy never-t 
        public async register(user:User):Promise<HTTPResponse>|never****

                    if (response[0].affectedRows === 1) {
                return {
                    status:200,
                    message:""
                };
            } else {
                throw {
                    status: 503,
                    message: "A szolgáltatás ideiglenes nem elérhető"
                };
            }

        } catch (err:any) {
            console.log("UserHandler.register", err);

            if(err.status) 
                throw err;

            throw {
                status: 503,
                message: "A szolgáltatás ideiglenes nem elérhető"
            };
        }
        És ez a rész itt a catch-ben az annyiszor elő fog fordulni, hogy csinálunk neki a framework-ben egy ilyet, hogy catchFunc.ts!!!!
        -> 
        function catchFunc(err:any, cls:string, method:string):never {
            console.log(`${cls}.${method}`, err**);

            if(err.status) 
                throw err;

            throw {
                status: 503,
                message: "A szolgáltatás ideiglenes nem elérhető"
            };
        }

        és itt pedig ez meghívjuk a catch-ben ezt a catchFunc-ot, fontos, hogy be legyen hívva -> import catchFunc from "../../frameworks/catchFunc.js";
        -> 
            } catch (err:any) {
            catchFunc(err, "UserHandler", "register");
        Ezt majd minden catch-ben meghívjuk és be tudjuk így dobni 

        Tranzakciókezelés itt nem kell majd, mert egyetlen egy adat meg fel egyetlen egy táblába!! 
        Meg kell csinálni a hesh-et meg a trim-et -> trim.ts
        -> 
        function trim(obj:Record<string, any>):Record<string, any> {
            for(const key in obj) {
                if(typeof obj[key] === "string")
                    obj[key] = obj[key].trim();   
            }

            return obj;
        import trim from "../../frameworks/trim.js";!! 

        És akkor itt a register elején megcsináljuk, hogy amit vár user-t azt trim-eljük
        ->
        public async register(user:User):Promise<HTTPResponse>|never {
            try {
                user = trim(user) as User;
        És fontos ez az as User, mert itt kell egy típuskonverzió, hogy elhiggye, hogy ez tényleg User 
            JavaScriptben egy sima egyszerű objektumról van szó, szóval ott nem érdekli a rendszer, hogy ez milyen objektum pontosan! 
        Tehát lefutna, ha nem írnánk oda, hogy as User, mert lefordítja JavaScript-re és ott mindegy, csak itt .ts-en van aláhúzva és zavaró

        ****
        Itt regisztrálunk de nem ellenőrizzük a hibákat 
        csinálunk egy errorChecker függvényt!! 
    */
    private async errorChecker(user:User) {
        /*
            Vár egy user-t, amit nekünk itt meg kell nézni ebből az az email meg a pass, mert csak ez kell a regisztrációhoz 
        */
        const errors:string[] = [];

        //itt kell majd egy Regex-et csinálni erre! meg lesznek még regex-ek, ezért csinálunk egy olyat, hogy regex.ts
        //const emailRegex = /^[\w\_\-\.]{1,255}\@[\w\_\-\.]{1,255}\.[\w]{1,8}$/;  mert akkor ezt majd máskor is használhatjuk 
        // if(!emailRegex.test(user.email)) 
        //     errors.push("Az email cím formátuma nem megfelelő!");
        
        /*
            Hosszabbnak kell lennie mint 8, de viszont itt jön be, hogy mi van ha undefined
            Ezért nem is ezt csináljuk, hanem csinálunk egy hasonlóna chain-elős megoldással egy Validator osztályt a frameworks-ben 
        */
        // if(user.pass.length < 8)
        this.validator.setValue("jelszó", user.pass).minLength(8).execute();
            
    }


    public async login() {

    }

    //hogyan tudunk kétfaktoros autentikációt csinálni 
    public async twoFactor() {

    }
}

export default userHandlerModel;