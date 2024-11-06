/*
    Ez az osztály le tud ellenőrizni nagyon sokféle formátumu bemeneti értéket 
    Elöször is kell egy value, amit le kell majd elenőriznie 
*/
import {ruleTypes, valueName} from "../models/types";

class Validator {
    private _valueName:valueName;
    /*
        Ez fog ilyeneket tartalmazni a rule, hogy isNumber, tehát szám formátumunak kell lennie 
        Legalapvetőbb, hogy isRequired, tehát ki kell-e tölteni kötelezően ezt a mezőt vagy sem 
        isRequired 
        isNumber
        isString
        isPhone
        isMobile
        isEmail 
        ...
    */
    //private type:string[]; //mert egyre több is vonatkozhat pl. required és dateTime
    private rules:Record<string, any>[]

    constructor() {
        this.init();
    }

    public init() {
        this._valueName = {name: "", value: ""};
        this.rules = [];
    }

    public setValue(name:string, value:any) {
        this._valueName = {
            name,
            value
        };
    }

    //ez mindig vissza fog adni egy Validator-t, ugyanúgy mint az SqlQueryBuilder-nél, hogy tudjunk chain-elni 
    public required():Validator {
        this.rules.push({
            type: ruleTypes.required
        });
        return this;
    }

    /*
        Csináltunk egy enum-ot, ahova felsoroltuk, hogy milyen típusaink vannak
        -> 
        enum ruletype {
            isRequired = "isRequired",
            isNumber = "isNumber",
            minLength = "minLength"....
    */
    /*
        minimum length hosszúságú string kell 
    */

    public notRequired():Validator {
        this.rules.push({
            type: ruleTypes.notRequired
        })
        return this;
    }

    public minLength(length:number):Validator {
        this.rules.push({
            types: ruleTypes.minLength,
            value: length
        });
        return this;
    }

    /*
        Tehát van a minLength ami vár egy length, amit majd megadunk meghívásnál és lesz egy name is, ilyen objektumokat fogunk beletenni 
        a type-ban ha meghívjuk ezt a függvényt és meg tudunk hívni többet is (chain) és a type azért lesz egy tömb amiben lesznek ezek 
        az objektumok ha többet hívunk meg pl. isRequired meg a minLength!! 
    */

    public maxLength(length:number):Validator {
        this.rules.push({
            name: ruleTypes.maxLength, 
            value: length
        })
        return this;
    }
    public minValue(min:number):Validator {
        this.rules.push({
            type: ruleTypes.minValue, 
            value: min
        })
        return this;
    }

    public maxValue(max:number):Validator {
        this.rules.push({
            type: ruleTypes.maxValue, 
            value: max
        })
        return this;
    }

    /*
        A min meg a max-ot is megadjuk és azok között 
    */
    public between(min:number, max:number):Validator {
        this.rules.push({
            type: ruleTypes.between, 
            min: min, 
            max: max 
        })
        return this;
    }

    public betweenLength(min:number, max:number):Validator {
        this.rules.push({
            type: ruleTypes.betweenLength, 
            min: min, 
            max: max 
        })
        return this;
    }

    public isString():Validator {
        this.rules.push({
            type: ruleTypes.isString, 
        })
        return this;
    }

    public isMobile():Validator {
        this.rules.push({
            type: ruleTypes.isMobile, 
        })
        return this;
    }

    public isPhone():Validator {
        this.rules.push({
            type: ruleTypes.isPhone, 
        })
        return this;
    }

    public isEmail():Validator {
        this.rules.push({
            type: ruleTypes.isEmail, 
        })
        return this;
    }

    public isDate():Validator {
        this.rules.push({
            type: ruleTypes.isDate, 
        })
        return this;
    }

    public isTime():Validator {
        this.rules.push({
            type: ruleTypes.isTime, 
        })
        return this;
    }

    public isDateTime():Validator {
        this.rules.push({
            type: ruleTypes.isDateTime, 
        })
        return this;
    }
    
    /*
        Kell egy olyan, hogy regex és a saját reguláris kifejezésünket rakjuk itt bele 
        tehát itt fontos, hogy megkapjon egy RegExp-et -> public regex(regex:RegExp)
    */

    public regex(regex:RegExp):Validator {
        this.rules.push({
            type: ruleTypes.regex, 
            regex: regex
        })
        return this;
    }

    /*
        Kell egy olyan, hogy validate, mint ahogy volt az execute az SqlQueryBuilder-nél 
        Itt vannak nekünk ezek a szabályok és végigmegyünk rajtuk egy for-val 
        -> 
        for(const rule of this.rules)
        és meg kellene nézni, hogy egyáltalán required-e 
    */

    public execute() {
        for(const rule of this.rules) {
            const errors:string[] = [];
            /*
                Van a types-ban required meg egy notRequired meg itt is mindegyiknek egy függvény 

                rule.type === ruleTypes.notRequired && this.value.toString().length === 0
                Amikor nem töltötte ki és nem is kötelező, akkor hagyjuk a fenébe az egészet
            */
            if(rule.type === ruleTypes.notRequired && this._valueName.value.toString().length === 0) {
                break; //nem megyünk tovább 
            }

            //maxLength - mit kellene nézni a value esetében -> az, hogy string-e, ami maxlength az biztos, hogy string kell, hogy legyen 
            if(rule.type === ruleTypes.maxLength
                && (typeof this._valueName.value !== "string" //Ellenőrzi, hogy string típusú
                || this._valueName.value.length > rule.value) //Ellőnőrzi, hogy a hossza nagyobb-e, mint a megadott érték 
            ) {
                errors.push(`A következő mező maximális hossza ${rule.value} karakter lehet: ${this._valueName.name}`)
            }
            /*
                Nekünk automatikus üzeneteket kell küldeni és belefoglalni a mező nevét amivel probléma van
                Tehét nekünk nem csak a value kell, hanem az is, hogy mi a neve a mezőnek 
                
                Ezért csinálunk a types-ba egy ilyen type-ot, hogy valueName
                -> 
                type valueName = {
                    name:string,
                    value:any
                }
                És akkor ez helyett ami itt van
                private value:any;
                lesz egy ilyen, amiben benne van a value meg a name is 
                ->
                private _valueName:valueName;
                és ehhez még lesz egy ilyen függvény, amivel frissítjük a _valueName-t  
                    private setValue(name:string, value:any) {
                        this._valueName = {
                            name,
                            value
                    };

                Csak fontos, hogy amire itt hivatkoztunk value, az most valueName.value lesz
                Ez lesz a hibaüzenet
                errors.push(`A következő mező maximális hossza ${rule.value} karakter lehet: ${this._valueName.name}`)
                És akkor így már meg tudjuk határozni, hogy melyiknél van a hiba
                rule.value az a maximális karakter, amit majd bekérünk meghívásnál, hogy mennyi legyen 

                (typeof this._valueName.value !== "string" 
                || this._valueName.value.length > rule.value)
                Be kellett tenni egy ()-be, mert vagy nem string vagy this._valueName.value.length > rule.value 
                vagy mindkettő 

                minLength-es megoldás nagyon hasonló
            */

                if(rule.type === ruleTypes.minLength
                    && (typeof this._valueName.value !== "string" //Ellenőrzi, hogy string típusú
                    || this._valueName.value.length < rule.value) //Ellőnőrzi, hogy a hossza nagyobb-e, mint a megadott érték 
                ) {
                    errors.push(`A következő mező minimális hossza ${rule.value} karakter lehet: ${this._valueName.name}`)
                }

                // this._valueName = {value: "", name: ""};
                // this.rules = [];
                this.init(); //fontos, hogy a cikluson kivül legyen meghívva!!!! 

                /*
                    Meg az is fontos, hogy beállítsuk a valueName-t ezekre a kezdőértékekre, hogy ne legyen null vagy undefined
                    fontos a kezdértékek beállítása!!! 
                    ->
                    constructor() {
                        this._valueName = {name: "", value: ""};
                        this.rules = [];

                    De van egy másik megoldás, hogy csinálunk egy init függvényt  
                    ->
                    constructor() {
                        this.init();
                    }

                    public init() {
                        this._valueName = {name: "", value: ""};
                        this.rules = [];
                    }

                    Tehát az init-ben vannak a kezdőértékek és ez azért jó, mert meg tudjuk hívni a constructor-ban meg itt is 
                    amikor le kell nullázni a execute-ban!! 

                    Szóval itt ehelyett csak meghívjuk az init()-et 
                    this._valueName = {value: "", name: ""};
                    this.rules = [];
                    ->
                    this.init();

                */

                //miután beletettük a dolgokat visszaadjuk az errors-t (string array)!!!! 
                return errors;
                
        }
    }

    /*
        És ez azért jó, mert ha a userHandlerModel-ben csinálunk egy ilyen validator-t 
        -> 
        class userHandlerModel {    
            private conn: PoolConnection | any;
            private validator:Validator;*****

            constructor() {
                this.getConn();
                this.validator = new Validator();*******

            private async errorChecker(user:User) {
                const errors:string[] = [];

                const response = this.validator.setValue("jelszó", user.pass).minLength(8).execute();

                1. van egy validator, ami ennek az osztálynak a másolata 
                2. első lépés, hogy setValue, mert ez vár egy name-et meg egy value-t 
                    tehát itt a jelszó lesz, aminek az a value-ja, hogy user.pass 
                3. minLength, mert meg szeretnénk nézni, hogy elég, hosszú-e a jelszó és beállítjuk, hogy minimum 8 karakteres legyen 
                4. execute ez meg véghezviszi a folyamatot (itt vagyunk most) és belerak egy hibaüzenetet egy tömbbe 
                    amit visszaadunk és meghívásnál a userHandlerModel-nél meghívjuk és ott lesz a hibaüzenet 

            Amit biztos, hogy meg kell csinálni itt az execute-nál, mint ahogy meg kellett a SqlQueryBuilder-nél, hogy 
            minden változót ki kell űríteni, hogy utána lehessen tovább használni ugyanazt a példányt 
                mert láttuk, hogy csináltunk egy példányt ott meghívtuk egyszer az execute-ot és az még jó is volt 
                de viszont amikor meghívtuk mégegyszer, akkor bentmaradtak a dolgok!!! 
            ->
                this._valueName = {value: "", name: ""};
                this.rules = [];
    */
    
}

export default Validator;