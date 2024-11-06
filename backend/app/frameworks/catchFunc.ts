function catchFunc(err:any, cls:string, method:string):never {
    console.log(`${cls}.${method}`, err**);

    if(err.status) 
        throw err;

    throw {
        status: 503,
        message: "A szolgáltatás ideiglenes nem elérhető"
    };
}


export default catchFunc;

/*
    Visszatérési értéke egy never lesz, mert soha nem lesz neki visszatérési értéke 
    ->
    function catchFunc():never

    } catch (err:any) {
        console.log("UserHandler.register", err**);

        if(err.status) 
            throw err;

        throw {
            status: 503,
            message: "A szolgáltatás ideiglenes nem elérhető"
        };
    }
    Ezt a részt akarjuk majd helyetesíteni ezzel a függvénymeghívással 
    **Ez egy err-t biztosan kér, ami any lesz 
    "UserHandler***.register****" amit még az osztély*** meg a metódus****
    és akkor ezt be kell majd helyetesíteni 
    ->
    function catchFunc(err:any, cls:string, method:string):never {
    console.log(`${cls}.${method}`, err**);


*/