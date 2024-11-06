function trim(obj:Record<string, any>):Record<string, any> {
    for(const key in obj) {
        if(typeof obj[key] === "string")
            obj[key] = obj[key].trim();   
    }

    return obj;
}

export default trim;

/*
    Egy Record<string, any>-t ad vissza és vár egy objektumot ami szintén egy Record<string, any>
    ->
    function trim(obJ:Record<string, any>):Record<string, any> {

    }
    1. Végigmegyünk ennek az obj-nak az for in-vel a kulcsokon        for(const key in obj)
    2. és amennyiben a kulcs (obj[key]) az egy string                 if(typeof obj[key] === "string")
    3. akkor azt trim-eljük                                           obj[key] = obj[key].trim();
    4. visszaadjuk ezt a obj-et ahol már megtörtént a trim-elés       return obj;

    Record<string, any> meg bármilyen objektumra jó!! 
*/ 